import { describe, expect, it, vi } from 'vitest';
import type { ComponentPublicInstance } from 'vue';

import { createErrorHandler } from './errorHandler';

function component(name: string): ComponentPublicInstance {
    return { $options: { __name: name } } as unknown as ComponentPublicInstance;
}

describe('[NFR-04] createErrorHandler', () => {
    it('logs the error with the component name and the Vue lifecycle info', () => {
        const log = vi.fn<(message: string, error: unknown) => void>();
        const error = new Error('boom');

        createErrorHandler(log)(error, component('RaceTrack'), 'render function');

        expect(log).toHaveBeenCalledWith('Unexpected error in RaceTrack (render function)', error);
    });

    it('names an unknown component when the error has no instance', () => {
        const log = vi.fn<(message: string, error: unknown) => void>();

        createErrorHandler(log)('failure', null, 'setup function');

        expect(log).toHaveBeenCalledWith(
            'Unexpected error in an unknown component (setup function)',
            'failure'
        );
    });

    it('reports to console.error by default without rethrowing', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const error = new Error('boom');

        expect(() =>
            createErrorHandler()(error, component('AppBar'), 'mounted hook')
        ).not.toThrow();
        expect(consoleError).toHaveBeenCalledWith(
            'Unexpected error in AppBar (mounted hook)',
            error
        );
        consoleError.mockClear();
    });
});
