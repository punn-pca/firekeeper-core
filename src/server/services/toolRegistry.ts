/**
 * FIRE KEEPER Tool Registry & Secure Executor
 * 
 * Provides built-in tool execution for:
 * 1. web_search - Real live search with multi-source retrieval and epistemic tagging
 * 2. exec - Secure shell execution with strict allowlist and safety boundaries
 * 
 * Complies with PUNN Predictive Cognitive Architecture (PCA v3.0) and Security Policy.
 */

import { performWebSearch, type WebSearchExecutionResult } from './webSearch';
import { sanitizeErrorForLog } from '../security/sanitizeError';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  output: any;
  error?: string;
  durationMs: number;
}

// Shell execution is disabled: shell allowlists cannot safely constrain command chaining,
// substitutions, interpreters, or child processes.
export async function executeSafeCommand(_command: string, _timeoutMs = 5000): Promise<{
  stdout: string; stderr: string; exitCode: number;
}> {
  throw new Error('Shell execution is disabled by security policy.');
}

/**
 * Universal Tool Registry Class
 */
export class ToolRegistry {
  private static toolDefinitions: ToolDefinition[] = [
    {
      name: 'web_search',
      description: 'Search the web for up-to-date information, news, and facts with verified source URLs and domains.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query keyword or question.',
          },
        },
        required: ['query'],
      },
    },
        },
        required: ['command'],
      },
    },
  ];

  public static getOpenAITools(): Array<{ type: 'function'; function: ToolDefinition }> {
    return this.toolDefinitions.map(def => ({
      type: 'function',
      function: def,
    }));
  }

  public static async executeTool(
    name: string,
    argsInput: any,
    options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const normalizedName = (name || '').trim().toLowerCase();

    let args: Record<string, any> = {};
    if (typeof argsInput === 'string') {
      try {
        args = JSON.parse(argsInput);
      } catch {
        args = { input: argsInput };
      }
    } else if (typeof argsInput === 'object' && argsInput !== null) {
      args = argsInput;
    }

    try {
      if (normalizedName === 'web_search') {
        const query = String(args.query || args.input || args.search || '').trim();
        if (!query) {
          return {
            success: false,
            toolName: 'web_search',
            output: null,
            error: 'Missing required argument "query" for web_search.',
            durationMs: Date.now() - startTime,
          };
        }

        const searchRes: WebSearchExecutionResult = await performWebSearch(query, {
          maxResults: 6,
        });

        if (!searchRes.success || searchRes.results.length === 0) {
          return {
            success: false,
            toolName: 'web_search',
            output: {
              query,
              message: `ไม่พบผลลัพธ์จากการค้นหาเว็บสำหรับ: "${query}"`,
              results: [],
            },
            error: searchRes.statusMessage || 'No search results found.',
            durationMs: Date.now() - startTime,
          };
        }

        // Format clean, rich search evidence
        const formattedResults = searchRes.results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          source: r.sourceDomain,
          publishedAt: r.publishedAt || undefined,
        }));

        return {
          success: true,
          toolName: 'web_search',
          output: {
            query,
            totalFound: formattedResults.length,
            retrievedAt: searchRes.retrievedAt,
            results: formattedResults,
          },
          durationMs: Date.now() - startTime,
        };
      }

      if (normalizedName === 'exec') {
        const command = String(args.command || args.cmd || args.input || '').trim();
        if (!command) {
          return {
            success: false,
            toolName: 'exec',
            output: null,
            error: 'Missing required argument "command" for exec.',
            durationMs: Date.now() - startTime,
          };
        }

        const execResult = await executeSafeCommand(command, options?.timeoutMs || 5000);

        return {
          success: execResult.exitCode === 0,
          toolName: 'exec',
          output: {
            command,
            exitCode: execResult.exitCode,
            stdout: execResult.stdout,
            stderr: execResult.stderr,
          },
          error: execResult.exitCode !== 0 ? (execResult.stderr || `Command exited with code ${execResult.exitCode}`) : undefined,
          durationMs: Date.now() - startTime,
        };
      }

      // Unknown tool handling
      return {
        success: false,
        toolName: normalizedName,
        output: null,
        error: `Unknown tool "${normalizedName}". Available tools: ${this.toolDefinitions.map(t => t.name).join(', ')}.`,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        toolName: normalizedName,
        output: null,
        error: sanitizeErrorForLog(err?.message || err),
        durationMs: Date.now() - startTime,
      };
    }
  }
}
