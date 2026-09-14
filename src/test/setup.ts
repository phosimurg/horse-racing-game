import { format } from 'node:util';

import { afterEach, beforeEach, vi } from 'vitest';

const spies = new Map<string, { mock: { calls: unknown[][] } }>();

beforeEach(() => {
    spies.set('warn', vi.spyOn(console, 'warn'));
    spies.set('error', vi.spyOn(console, 'error'));
});

afterEach(() => {
    for (const [method, spy] of spies) {
        if (spy.mock.calls.length > 0) {
            const messages = spy.mock.calls.map((args) => format(...args)).join('\n');
            throw new Error(`Unexpected console.${method}:\n${messages}`);
        }
    }
});
