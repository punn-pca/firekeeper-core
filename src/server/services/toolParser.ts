/**
 * FIRE KEEPER Tool Call Parser & Normalizer
 * 
 * Supports:
 * - Native OpenAI Structured Tool Calls
 * - DeepSeek Markup Language (DSML) Tool Calls:
 *     <invoke name="...">
 *       <parameter name="..." string="true">value</parameter>
 *     </invoke>
 *   (and <｜DSML｜invoke ...>, <|DSML|invoke ...>, <｜DSML｜tool_calls>)
 * - XML Function Calling:
 *     <function_call name="...">
 *     <tool_call>{"name": "...", "arguments": {...}}</tool_call>
 * 
 * Normalizes all tool calls into standard OpenAI tool_calls format:
 * [
 *   {
 *     id: "call_...",
 *     type: "function",
 *     function: { name: "...", arguments: "{...}" }
 *   }
 * ]
 */

import crypto from 'crypto';

export interface NormalizedToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolParseResult {
  hasToolCalls: boolean;
  toolCalls: NormalizedToolCall[];
  cleanVisibleText: string;
  reasoningText?: string;
  parseErrors?: string[];
}

/**
 * Normalizes DeepSeek and XML tool tokens to simplify regex parsing
 */
function normalizeDsmlTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[|｜]DSML[|｜]tool_calls>/gi, '')
    .replace(/<\/[|｜]DSML[|｜]tool_calls>/gi, '')
    .replace(/<[|｜]DSML[|｜]invoke\b/gi, '<invoke')
    .replace(/<\/[|｜]DSML[|｜]invoke>/gi, '</invoke>')
    .replace(/<[|｜]DSML[|｜]parameter\b/gi, '<parameter')
    .replace(/<\/[|｜]DSML[|｜]parameter>/gi, '</parameter>');
}

/**
 * Extracts parameter value, respecting string="true"/"false" flags and JSON syntax
 */
function parseParameterValue(rawVal: string, isStringFlag: boolean | undefined): any {
  const trimmed = rawVal.trim();
  if (isStringFlag === true) {
    return trimmed;
  }
  if (isStringFlag === false) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  // If no string flag, try JSON parsing if it looks like JSON object/array/number/boolean
  if (/^(\d+(\.\d+)?|true|false|null|[[{])/.test(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/**
 * Parse DSML <invoke name="...">...</invoke> tags
 */
function parseDsmlInvocations(text: string): { toolCalls: NormalizedToolCall[]; matchedSpans: Array<[number, number]>; errors: string[] } {
  const toolCalls: NormalizedToolCall[] = [];
  const matchedSpans: Array<[number, number]> = [];
  const errors: string[] = [];

  const invokeRegex = /<invoke\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/invoke>/gi;
  let match: RegExpExecArray | null;

  while ((match = invokeRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    matchedSpans.push([startIndex, endIndex]);

    const toolName = match[1].trim();
    const innerContent = match[2];

    const argsRecord: Record<string, any> = {};

    // Parse parameters: <parameter name="..." string="true|false">value</parameter>
    const paramRegex = /<parameter\s+name=["']([^"']+)["'](?:\s+string=["'](true|false)["'])?\s*>([\s\S]*?)<\/parameter>/gi;
    let paramMatch: RegExpExecArray | null;
    let paramFound = false;

    while ((paramMatch = paramRegex.exec(innerContent)) !== null) {
      paramFound = true;
      const paramName = paramMatch[1].trim();
      const stringAttr = paramMatch[2];
      const paramValueRaw = paramMatch[3];
      const isString = stringAttr ? stringAttr.toLowerCase() === 'true' : undefined;

      argsRecord[paramName] = parseParameterValue(paramValueRaw, isString);
    }

    // If no <parameter> tags found, check if inner content is raw JSON or simple string
    if (!paramFound) {
      const trimmedInner = innerContent.trim();
      if (trimmedInner.startsWith('{') && trimmedInner.endsWith('}')) {
        try {
          Object.assign(argsRecord, JSON.parse(trimmedInner));
        } catch (e: any) {
          errors.push(`Invalid JSON inside <invoke name="${toolName}"></invoke>: ${e?.message || e}`);
        }
      } else if (trimmedInner) {
        // Fallback for single argument tools
        if (toolName === 'web_search') {
          argsRecord['query'] = trimmedInner;
        } else if (toolName === 'exec') {
          argsRecord['command'] = trimmedInner;
        } else {
          argsRecord['input'] = trimmedInner;
        }
      }
    }

    const callId = `call_dsml_${crypto.randomBytes(6).toString('hex')}`;
    toolCalls.push({
      id: callId,
      type: 'function',
      function: {
        name: toolName,
        arguments: JSON.stringify(argsRecord),
      },
    });
  }

  return { toolCalls, matchedSpans, errors };
}

/**
 * Parse <tool_call>{"name": "...", "arguments": {...}}</tool_call> tags
 */
function parseJsonToolCalls(text: string): { toolCalls: NormalizedToolCall[]; matchedSpans: Array<[number, number]>; errors: string[] } {
  const toolCalls: NormalizedToolCall[] = [];
  const matchedSpans: Array<[number, number]> = [];
  const errors: string[] = [];

  const toolCallRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
  let match: RegExpExecArray | null;

  while ((match = toolCallRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    matchedSpans.push([startIndex, endIndex]);

    const innerJson = match[1].trim();
    try {
      const parsed = JSON.parse(innerJson);
      const name = parsed.name || parsed.function?.name || parsed.tool;
      const rawArgs = parsed.arguments || parsed.function?.arguments || parsed.args || {};
      const args = typeof rawArgs === 'string' ? rawArgs : JSON.stringify(rawArgs);

      if (name) {
        toolCalls.push({
          id: parsed.id || `call_json_${crypto.randomBytes(6).toString('hex')}`,
          type: 'function',
          function: { name, arguments: args }
        });
      } else {
        errors.push(`Missing tool name in <tool_call>: ${innerJson}`);
      }
    } catch (e: any) {
      errors.push(`Malformed JSON inside <tool_call>: ${e?.message || e}`);
    }
  }

  return { toolCalls, matchedSpans, errors };
}

/**
 * Universal Tool Call Parser
 * Analyzes model output text and/or native tool_calls, returning normalized tool calls
 * and clean visible text with all raw tool markup stripped out.
 */
export function parseModelToolCalls(
  rawText: string = '',
  nativeToolCalls?: any[]
): ToolParseResult {
  const normalizedText = normalizeDsmlTags(rawText);
  const toolCalls: NormalizedToolCall[] = [];
  const parseErrors: string[] = [];
  const allSpans: Array<[number, number]> = [];

  // 1. Process Native Tool Calls if present
  if (Array.isArray(nativeToolCalls) && nativeToolCalls.length > 0) {
    for (const tc of nativeToolCalls) {
      if (!tc) continue;
      const fn = tc.function || tc;
      const name = fn.name;
      if (!name) continue;

      let argsString = '{}';
      if (typeof fn.arguments === 'string') {
        argsString = fn.arguments;
      } else if (typeof fn.arguments === 'object' && fn.arguments !== null) {
        argsString = JSON.stringify(fn.arguments);
      }

      toolCalls.push({
        id: tc.id || `call_native_${crypto.randomBytes(6).toString('hex')}`,
        type: 'function',
        function: {
          name,
          arguments: argsString,
        }
      });
    }
  }

  // 2. Parse DSML Invocations
  const dsmlResult = parseDsmlInvocations(normalizedText);
  if (dsmlResult.toolCalls.length > 0) {
    toolCalls.push(...dsmlResult.toolCalls);
    allSpans.push(...dsmlResult.matchedSpans);
  }
  if (dsmlResult.errors.length > 0) {
    parseErrors.push(...dsmlResult.errors);
  }

  // 3. Parse JSON <tool_call> tags
  const jsonResult = parseJsonToolCalls(normalizedText);
  if (jsonResult.toolCalls.length > 0) {
    toolCalls.push(...jsonResult.toolCalls);
    allSpans.push(...jsonResult.matchedSpans);
  }
  if (jsonResult.errors.length > 0) {
    parseErrors.push(...jsonResult.errors);
  }

  // 4. Construct clean visible text by excising tool call spans
  let cleanVisibleText = rawText;
  if (allSpans.length > 0) {
    // Sort spans in reverse order to excise from end to start without invalidating indices
    const sortedSpans = [...allSpans].sort((a, b) => b[0] - a[0]);
    let workText = normalizedText;
    for (const [start, end] of sortedSpans) {
      workText = workText.slice(0, start) + workText.slice(end);
    }
    // Clean up residual artifacts
    cleanVisibleText = workText
      .replace(/<[|｜]?DSML[|｜]?[^>]*>/gi, '')
      .replace(/<\/[|｜]?DSML[|｜]?[^>]*>/gi, '')
      .replace(/<invoke[^>]*\/>/gi, '')
      .trim();
  }

  return {
    hasToolCalls: toolCalls.length > 0,
    toolCalls,
    cleanVisibleText: cleanVisibleText.trim(),
    parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
  };
}
