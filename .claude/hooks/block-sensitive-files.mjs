import { readFileSync } from 'node:fs';

const BLOCKED_PATHS = [
    { pattern: /(^|\/)\.env(\.|$)/, reason: 'environment files may hold secrets' },
    { pattern: /\.(pem|key|p12|pfx)$/, reason: 'key material is never edited by an agent' },
    { pattern: /(^|\/)package-lock\.json$/, reason: 'the lockfile changes only through npm' },
    {
        pattern: /-snapshots\/[^/]+\.png$/,
        reason: 'visual baselines change only through npm run test:visual:update',
    },
    {
        pattern: /(^|\/)(dist|coverage|playwright-report|test-results)\//,
        reason: 'generated output',
    },
];

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = String(input.tool_input?.file_path ?? '').replaceAll('\\', '/');
const blocked = BLOCKED_PATHS.find(({ pattern }) => pattern.test(filePath));

if (blocked) {
    process.stderr.write(`Blocked edit to ${filePath}: ${blocked.reason}.\n`);
    process.exit(2);
}
