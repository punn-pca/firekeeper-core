/**
 * FIRE KEEPER Tool Registry & Secure Executor
 * 
 * Provides built-in tool execution for:
 * 1. web_search - Real live search with multi-source retrieval and epistemic tagging
 * 2. exec - Secure shell execution with strict allowlist and safety boundaries
 * 
 * Complies with PUNN Predictive Cognitive Architecture (PCA v3.0) and Security Policy.
 */

import { exec } from 'child_process';
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

// ── SECURITY POLICY: EXEC ALLOWLIST & DENY PATTERNS ────────────────────────
const ALLOWED_COMMAND_PREFIXES = [
  'echo',
  'date',
  'whoami',
  'uptime',
  'node -v',
  'npm -v',
  'git status',
  'git log',
  'git branch',
  'pwd',
  'ls',
  'dir',
  'hostname',
  'openclaw',
  'pm2 status',
  'pm2 logs',
  'df',
  'free',
  'cat',
  'head',
  'tail',
  'python',
  'python3'
];

const DANGEROUS_PATTERNS = [
  /\brm\b/i,
  /\bmkfs\b/i,
  /\bdd\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bkill\b/i,
  /\bpkill\b/i,
  /\bsudo\b/i,
  /\bsu\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\beval\b/i,
  /\bexport\b/i,
  /\bcurl\b.*\|\s*(sh|bash)/i,
  /\bwget\b.*\|\s*(sh|bash)/i,
  /\.env\b/i,
  /\bid_rsa\b/i,
  /\/etc\/(passwd|shadow)/i,
  /FIREBASE_SERVICE_ACCOUNT/i,
  /DEEPSEEK_API_KEY/i,
  /OPENCLAW_SERVICE_TOKEN/i,
  /TELEGRAM_BOT_TOKEN/i,
];

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

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const trimmed = command.trim();
  if (!trimmed) {
    return { allowed: false, reason: 'Empty command string.' };
  }

  // Check dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: `Command execution blocked by security policy (prohibited pattern detected).`,
      };
    }
  }

  // Check allowlist
  const isAllowed = ALLOWED_COMMAND_PREFIXES.some(prefix => {
    return trimmed === prefix || trimmed.startsWith(`${prefix} `);
  });

  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Command "${trimmed.split(' ')[0]}" is not in the permitted allowlist. Permitted: ${ALLOWED_COMMAND_PREFIXES.join(', ')}.`,
    };
  }

  return { allowed: true };
}

/**
 * Executes a shell command within strict security boundaries
 */
export async function executeSafeCommand(command: string, timeoutMs = 5000): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const check = isCommandAllowed(command);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        timeout: timeoutMs,
        maxBuffer: 512 * 1024, // 512KB max buffer
        env: {
          // Provide safe, stripped environment variables
          PATH: process.env.PATH || '',
          NODE_ENV: 'production',
          HOME: process.env.HOME || '',
        },
      },
      (error, stdout, stderr) => {
        const cleanStdout = sanitizeSecretLeakage(stdout ? stdout.trim() : '');
        const cleanStderr = sanitizeSecretLeakage(stderr ? stderr.trim() : '');

        if (error) {
          if ((error as any).killed) {
            return reject(new Error(`Command timed out after ${timeoutMs}ms.`));
          }
          return resolve({
            stdout: cleanStdout,
            stderr: cleanStderr || error.message,
            exitCode: error.code || 1,
          });
        }

        resolve({
          stdout: cleanStdout,
          stderr: cleanStderr,
          exitCode: 0,
        });
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
      description: 'Execute a verified shell inspection command against a secure allowlist (e.g. echo, date, uptime, git status, openclaw, pm2 status, df, free, cat, head, tail, python).',
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
