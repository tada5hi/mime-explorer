# Conventions

Use the installed shared ESLint configuration through the repository's lint command. Keep interface/type naming and declaration placement compatible with public exports; qualify filesystem/deep type compatibility against the declared exports map.

`npm run build` regenerates the MIME database before bundling; change the generator/source dependency rather than hand-editing generated data.

Keep the runtime engine and emitted JavaScript contract separate from tooling requirements. Bundler upgrades must retain output names, module formats, declaration generation and source-map behavior. Avoid introducing runtime APIs unsupported by the package's declared engine or documented consumers.

No dependency overrides are declared. TypeScript stays on 6.0.x while `typescript-eslint` requires `<6.1.0`; upgrade when its peer range supports a newer compiler. Keep `@types/node` on 24.x while development and CI use Node 24; advance it with that baseline. Module resolution uses Node16 and `verbatimModuleSyntax: false` so declaration builds support the existing CommonJS source and both package entrypoints.

Release configuration lives in `.github/workflows/` and the release-please files. Changes to release triggers must preserve the separation between creating release metadata and publishing artifacts.
