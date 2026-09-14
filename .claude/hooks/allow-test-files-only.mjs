import { readFileSync } from 'node:fs';

const TEST_PATHS = /\.spec\.ts$|(^|\/)e2e\/|(^|\/)src\/test\//;

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = String(input.tool_input?.file_path ?? '').replaceAll('\\', '/');

if (!TEST_PATHS.test(filePath)) {
    process.stderr.write(
        `The test-author agent edits test files only; ${filePath} is not a test file.\n`
    );
    process.exit(2);
}
