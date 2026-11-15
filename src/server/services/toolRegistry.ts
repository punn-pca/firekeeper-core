/**
 * FIRE KEEPER Tool Registry & Secure Executor
 * 
 * Provides built-in tool execution for:
 * 1. web_search - Real live search with multi-source retrieval and epistemic tagging
 * 2. exec - Narrow read-only inspection commands via no-shell execFile allowlist
 * 
 * Complies with PUNN Predictive Cognitive Architecture (PCA v3.0) and Security Policy.
 */

import { execFile } from 'node:child_process';
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

// ── SECURITY POLICY: ARGUMENT-BASED, NO-SHELL EXECUTION ────────────────────
type SafeCommand = { file: string; args: string[] };

function parseSafeCommand(command: string): SafeCommand | null {
  const trimmed = String(command || '').trim();
  if (!trimmed || trimmed.length > 256 || /[\u0000-\u001f;&|`$><()]/.test(trimmed)) return null;

  // Commands are tokenized without shell expansion. Only fixed executable /
  // argument combinations are accepted; no arbitrary scripts or file reads.
  const [file, ...args] = trimmed.split(/\s+/);
  const noArgs = new Set(['date', 'whoami', 'uptime', 'pwd', 'hostname']);
  if (noArgs.has(file) && args.length === 0) return { file, args };
  if (file === 'echo' && args.length > 0) return { file, args };
  if ((file === 'node' || file === 'npm') && args.length === 1 && args[0] === '-v') return { file, args };
  if (file === 'git' && args.length === 1 && args[0] === 'status') return { file, args };
  if (file === 'git' && args.length === 2 && args[0] === 'status' && args[1] === '--short') return { file, args };
  if (file === 'git' && args.length === 2 && args[0] === 'branch' && args[1] === '--show-current') return { file, args };
  if (file === 'git' && args.length === 2 && args[0] === 'log' && args[1] === '--oneline') return { file, args };
  if (file === 'git' && args.length === 3 && args[0] === 'log' && args[1] === '-n' && /^([1-9]|1[0-9]|20)$/.test(args[2])) return { file, args };
  if (file === 'ls' && (args.length === 0 || (args.length === 1 && ['-l', '-la', '-al'].includes(args[0])))) return { file, args };
  if ((file === 'df' || file === 'free') && args.length === 1 && args[0] === '-h') return { file, args };
  if (file === 'pm2' && args.length === 1 && args[0] === 'status') return { file, args };
  return null;
}

function sanitizeSecretLeakage(output: string): string {
  if (!output) return '';
  return output
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/[0-9]{9,11}:[a-zA-Z0-9_-]{30,}/g, '[REDACTED_BOT_TOKEN]')
    .replace(/[a-f0-9]{48,64}/g, (match) => {
      // Don't redact harmless short strings, only 64-char hex tokens
      return match.length === 64 ? '[REDACTED_SECRET]' : match;
    });
}

/**
 * Executes a strictly allowlisted inspection command without invoking a shell.
 */
export async function executeSafeCommand(command: string, timeoutMs = 5000): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const parsed = parseSafeCommand(command);
  if (!parsed) {
    throw new Error('Command execution blocked by security policy (command or arguments are not allowlisted).');
  }

  return new Promise((resolve, reject) => {
    execFile(
      parsed.file,
      parsed.args,
      {
        timeout: Math.max(1, Math.min(timeoutMs, 10000)),
        maxBuffer: 512 * 1024,
        windowsHide: true,
        shell: false,
        env: {
          PATH: process.env.PATH || '',
          NODE_ENV: 'production',
          HOME: process.env.HOME || '',
        },
      },
      (error, stdout, stderr) => {
        const cleanStdout = sanitizeSecretLeakage(stdout ? stdout.trim() : '');
        const cleanStderr = sanitizeSecretLeakage(stderr ? stderr.trim() : '');

        if (error) {
          if ((error as any).killed || (error as any).code === 'ETIMEDOUT') {
            return reject(new Error(`Command timed out after ${timeoutMs}ms.`));
          }
          const exitCode = typeof (error as any).code === 'number' ? (error as any).code : 1;
          return resolve({
            stdout: cleanStdout,
            stderr: cleanStderr || error.message,
            exitCode,
          });
        }

        resolve({ stdout: cleanStdout, stderr: cleanStderr, exitCode: 0 });
      }
    );
  });
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
    {
      name: 'exec',
      description: 'Execute a narrowly allowlisted read-only inspection command without shell expansion.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to run.',
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
