/**
 * Time and Millisecond formatting utilities for PUNN Cognitive Architecture.
 * Provides exact wall clock rendering (HH:mm:ss.SSS) and precise millisecond tracking.
 */

/**
 * Formats a Date/ISO string/epoch timestamp into exact wall clock time with milliseconds.
 * Example: 14:32:05.123
 */
export function formatWallClock(timeInput?: string | number | Date): string {
  if (!timeInput) return '';
  const d = new Date(timeInput);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

/**
 * Formats a duration in milliseconds into a readable string with ms and seconds.
 * Example: 2,345 ms (2.345 s)
 */
export function formatMs(ms: number): string {
  if (ms < 0 || isNaN(ms)) ms = 0;
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  const sec = (ms / 1000).toFixed(3);
  return `${sec} s (${ms.toLocaleString()} ms)`;
}

/**
 * Formats elapsed milliseconds into digital stopwatch format: MM:SS.sss
 * Example: 00:03.456
 */
export function formatStopwatch(ms: number): string {
  if (ms < 0 || isNaN(ms)) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const sec = String(totalSec % 60).padStart(2, '0');
  const milli = String(Math.floor(ms % 1000)).padStart(3, '0');
  return `${min}:${sec}.${milli}`;
}
