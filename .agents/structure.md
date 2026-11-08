# Project Structure

| Source | Responsibility |
|---|---|
| `src/module.ts` | Instance-based MIME registry and lookups; no bundled database import |
| `src/errors/` | Error classes built on the external `@ebec/core` `BaseError`; the base is abstract and each concrete class sets its own `name` and `code` so minified builds keep them |
| `src/db.json` | Generated from `mime-db` by `bin/db.cjs` during `npm run build`; edit the dependency or generator |
| `src/db.ts` | Typed default database export for `mime-explorer/db` |
| `bin/db.cjs` | Database generator run by the build |
| `src/index.ts` | Public package exports |
| `tsdown.config.mts` | JavaScript build configuration |
| `.github/assets/` | README logo and MIME lookup diagram |

The package exports map declares the package root, `./db` and `./package.json`. Use these declared entrypoints under exports-aware resolution; undeclared `dist/` paths are not additional public exports. Preserve the declared output paths. `types.ts` files own shared type declarations; filesystem declaration paths and facades provide legacy compatibility only where the resolver supports them.

The build runs tsdown and refreshes declarations through `build:types` after successful JavaScript builds. Generated `dist/` files are build artifacts.
