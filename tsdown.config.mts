import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/db.ts'],
    format: ['esm'],
    dts: false,
    onSuccess: 'npm run build:types',
    clean: false,
    target: 'es2020',
    sourcemap: true,
    outExtensions: () => ({ js: '.mjs' }),
    deps: { alwaysBundle: [/.*/], neverBundle: ['@ebec/core'], onlyBundle: false },
    minify: true,
});
