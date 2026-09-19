const { execSync } = require('child_process');

try {
  const targetDir = 'C:\\firekeeper-core\\mobile';
  const rawOutput = execSync('npx @react-native-community/cli config', {
    cwd: targetDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  // Replace any non-ASCII / OneDrive Thai path prefix with clean C:/firekeeper-core
  let cleaned = rawOutput.replace(/[a-zA-Z]:[\\/].*?[\\/]firekeeper-core/gi, 'C:/firekeeper-core');

  // Replace backslashes ONLY in Windows paths (e.g. C:\foo\bar), preserving JSON quote escapes (\")
  cleaned = cleaned.replace(/([a-zA-Z]:)\\[^"]+/g, (match) => match.replace(/\\/g, '/'))
                   .replace(/([^:]\/)\/+/g, '$1');

  process.stdout.write(cleaned);
} catch (error) {
  console.error('[CleanAutolink] Error fetching autolink config:', error);
  process.exit(1);
}
