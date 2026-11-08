# Registry Interface Plan

Deepening candidates for the next major release. Breaking changes are allowed. Goal: an interface that is clear, intuitive and usable.

| # | Candidate | Strength | Status |
|---|---|---|---|
| 1 | Seal the registry behind its interface | Strong | Implemented |
| 2 | One normalization rule for registering and looking up | Strong | Implemented |
| 3 | Make the public interface say what it does | Strong | Implemented |
| 4 | Give the database generator ownership of precedence | Worth exploring | Open |
| 5 | Delete the pass-through type modules | Speculative | Open |

## Interface

| Method | Input | Returns |
|---|---|---|
| `new MimeExplorer(definitions?)` | Definitions keyed by MIME type | Registry; never throws |
| `getType(path)` | Extension, dotted extension, file name or path | MIME type or `undefined` |
| `getExtension(contentType)` | MIME type or Content-Type header | Default extension or `undefined` |
| `getMeta(contentType)` | MIME type or Content-Type header | Read-only record or `undefined` |
| `register(definitions, options?)` | Definitions and `{ throwOnFailure }` | `true` when everything was applied |
| `unregister(contentType)` | MIME type or Content-Type header | `true` when a record was removed |

## 1. Seal the registry

- Registry state is private to `MimeExplorer` and held in `Map`s.
- `getMeta` returns frozen records, typed read-only. Registering an alias replaces the record, so a record already returned stays unchanged.
- A record lists every extension declared for its type, including aliases. The extension index holds the first owner of each extension.

## 2. One normalization rule

- MIME keys use one rule everywhere: trim, take the text before `;` or whitespace, lowercase.
- Extensions are read by the same rule that `getType` applies. A definition may use a leading dot.
- Invalid extensions: not a string, empty, containing whitespace, `.`, `/` or `\` after the leading dot, or starting with `*` after it.
- Lookups return `undefined` and `unregister` returns `false` for input that is not a string, such as a missing header.

## 3. Public interface

- Lookups name their result and parameters name their input. Doc comments state accepted input and return value.
- `register` is the only registration method. By default it applies what it can and returns whether everything was applied.
- A contested extension reports `ExtensionConflictError` and stays listed on its record, matching the constructor; `getType` keeps returning the first owner.
- With `throwOnFailure`, `register` applies nothing and throws `RegistrationError`, grouping every failure in `errors`.
- Errors extend `MimeExplorerError`, which extends `BaseError` from `@ebec/core`: `InvalidTypeError`, `MissingExtensionsError`, `InvalidExtensionError`, `ExtensionConflictError`, `MetadataConflictError`.
- The constructor never throws, because the bundled database holds records without extensions and contested extensions. It creates no error objects.
- Adding extensions to a registered type with matching or no metadata is valid.

## Test seams

- `MimeExplorer` public methods, through Vitest.
- `test/types/registry.ts` through `npm run test:types`, part of `npm test`.
- Built CommonJS and ESM entrypoints for the package root and `./db`, checked after the build.

## 4. Database generator owns precedence

Bundled lookups depend on `mime-db` key order: `.mp3` resolves to `audio/mp3` and `.mp4` to `application/mp4`. 1,507 of 2,522 records have no extensions and are never registered.

Move record selection and extension precedence into `bin/db.js`, with fixture tests. The registry keeps first-definition-wins.

Open: drop records without extensions, or register them for metadata lookups.

## 5. Pass-through type modules

`src/type.ts` and `TypeMap` add no behavior. `IMimeExplorer` has one adapter, but private state makes it the only way to write structural test doubles.

Open: delete the legacy path and alias; keep `IMimeExplorer` only if callers need test doubles.
