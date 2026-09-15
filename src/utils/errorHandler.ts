import type { ComponentPublicInstance } from 'vue';

type ErrorLogger = (message: string, error: unknown) => void;

function logToConsole(message: string, error: unknown): void {
    console.error(message, error);
}

/** Design 9: log unexpected errors with their component context and keep the interface running. */
export function createErrorHandler(log: ErrorLogger = logToConsole) {
    return (error: unknown, instance: ComponentPublicInstance | null, info: string): void => {
        const options = instance?.$options as { name?: string; __name?: string } | undefined;
        const component = options?.name ?? options?.__name ?? 'an unknown component';
        log(`Unexpected error in ${component} (${info})`, error);
    };
}
