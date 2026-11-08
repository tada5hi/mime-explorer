# Testing

`npm test` type-checks `test/types/` through `npm run test:types`, then runs Vitest using `test/vitest.config.mts`. `npm run test:coverage` enables the configured coverage provider and existing thresholds; keep those thresholds and source inclusion rules intact.

`npm run build` regenerates the MIME database before bundling; change the generator/source dependency rather than hand-editing generated data.

Run the build when changing exported types or bundle configuration. Validate both CommonJS and ESM consumer entrypoints when altering package exports. A missing external service is an incomplete check, not a passing test.
