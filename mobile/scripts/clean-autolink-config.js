const { execSync } = require('child_process');
const path = require('path');

try {
  const targetDir = path.resolve(__dirname, '..');
  const rawOutput = execSync('npx @react-native-community/cli config', {
    cwd: targetDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  // Normalize Windows backslashes to forward slashes for CMake/Gradle compatibility
  let cleaned = rawOutput.replace(/([a-zA-Z]:)\\[^"]+/g, (match) => match.replace(/\\/g, '/'))
                         .replace(/([^:]\/)\/+/g, '$1');

  process.stdout.write(cleaned);
} catch (error) {
  console.error('[CleanAutolink] Error fetching autolink config:', error);
  process.exit(1);
}
