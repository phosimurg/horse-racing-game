import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIREMENT_HEADING = /\*\*((?:HORSE|PROG|RACE|RES|CTRL|UX|NFR)-\d{2})\b/g;
const REQUIREMENT_ID = /\b(?:HORSE|PROG|RACE|RES|CTRL|UX|NFR)-\d{2}\b/g;
const TEST_TITLE = /\b(?:describe|it|test)(?:\.\w+)*\s*\(\s*(['"`])(.*?)\1/gs;
const TEST_ROOTS = ['src', 'e2e'];
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage']);

const root = fileURLToPath(new URL('..', import.meta.url));
const enforce = process.argv.includes('--enforce');

function findSpecFiles(directory) {
    if (!existsSync(directory)) {
        return [];
    }
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED_DIRECTORIES.has(entry.name) ? [] : findSpecFiles(path);
        }
        return entry.name.endsWith('.spec.ts') ? [path] : [];
    });
}

const requirements = readFileSync(join(root, 'docs/specs/requirements.md'), 'utf8');
const coverage = new Map(
    [...requirements.matchAll(REQUIREMENT_HEADING)].map(([, id]) => [id, new Set()])
);
const unknownReferences = [];

for (const file of TEST_ROOTS.flatMap((directory) => findSpecFiles(join(root, directory)))) {
    const location = relative(root, file);
    for (const [, , title] of readFileSync(file, 'utf8').matchAll(TEST_TITLE)) {
        for (const id of title.match(REQUIREMENT_ID) ?? []) {
            if (coverage.has(id)) {
                coverage.get(id).add(location);
            } else {
                unknownReferences.push(`${id} (${location})`);
            }
        }
    }
}

const missing = [...coverage].filter(([, files]) => files.size === 0).map(([id]) => id);

console.log(
    `Traceability: ${coverage.size - missing.length} of ${coverage.size} requirements referenced by test titles.`
);
if (missing.length > 0) {
    console.log(`Not covered: ${missing.join(', ')}`);
}
if (unknownReferences.length > 0) {
    console.log(`Unknown requirement IDs: ${unknownReferences.join(', ')}`);
}
if (enforce && (missing.length > 0 || unknownReferences.length > 0)) {
    process.exitCode = 1;
}
