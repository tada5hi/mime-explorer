import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/db.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    onSuccess: 'npm run build:types',
    clean: false,
    target: 'es2020',
    sourcemap: true,
    outExtensions: ({ format }) => ({ js: format === 'es' ? '.mjs' : '.cjs' }),
    deps: { alwaysBundle: [/.*/], onlyBundle: false },
    minify: true,
});
