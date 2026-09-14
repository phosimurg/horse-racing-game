import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
].join('; ');

// Dev and test servers inject inline scripts, so the policy is added to production builds only.
function contentSecurityPolicy(): Plugin {
    return {
        name: 'content-security-policy',
        apply: 'build',
        transformIndexHtml: () => [
            {
                tag: 'meta',
                attrs: {
                    'http-equiv': 'Content-Security-Policy',
                    content: CONTENT_SECURITY_POLICY,
                },
                injectTo: 'head-prepend',
            },
        ],
    };
}

export default defineConfig({
    base: './',
    plugins: [vue(), vueDevTools(), contentSecurityPolicy()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
