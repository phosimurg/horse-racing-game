import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const LINTED = new Set(['.ts', '.mts', '.vue']);
const STYLED = new Set(['.vue', '.css']);
const FORMATTED = new Set([
    '.ts',
    '.mts',
    '.vue',
    '.css',
    '.js',
    '.mjs',
    '.json',
    '.md',
    '.yml',
    '.yaml',
    '.html',
]);

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path;
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

if (!filePath || !existsSync(filePath) || relative(projectDir, filePath).startsWith('..')) {
    process.exit(0);
}

const extension = extname(filePath);
const steps = [
    LINTED.has(extension) && ['eslint', ['--fix', filePath]],
    STYLED.has(extension) && ['stylelint', ['--fix', filePath]],
    FORMATTED.has(extension) && ['prettier', ['--write', '--ignore-unknown', filePath]],
].filter(Boolean);

const failures = [];
for (const [tool, args] of steps) {
    try {
        execFileSync(join(projectDir, 'node_modules', '.bin', tool), args, {
            cwd: projectDir,
            stdio: 'pipe',
        });
    } catch (error) {
        failures.push(`${tool}:\n${error.stdout ?? ''}${error.stderr ?? ''}`.trim());
    }
}

if (failures.length > 0) {
    process.stderr.write(
        `Unresolved issues in ${relative(projectDir, filePath)}:\n${failures.join('\n')}\n`
    );
    process.exit(2);
}
