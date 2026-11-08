<p align="center">
    <img src="https://raw.githubusercontent.com/tada5hi/mime-explorer/8b0d412c03e1ad24e0ca74b553d41bf2e16a2b6c/.github/assets/logo.svg" alt="mime-explorer: a cloud of file extensions" width="128" height="128" />
</p>

<h1 align="center">mime-explorer</h1>

<p align="center">
    <b>Look up MIME types, file extensions and metadata, and register your own mappings.</b><br>
    Use one API for file paths, Content-Type values and custom formats.<br>
    The MIME database is bundled, as ESM with TypeScript declarations.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/mime-explorer"><img src="https://img.shields.io/npm/v/mime-explorer" alt="mime-explorer version on npm" /></a>
    <a href="https://github.com/tada5hi/mime-explorer/actions/workflows/main.yml"><img src="https://github.com/tada5hi/mime-explorer/actions/workflows/main.yml/badge.svg" alt="Build and test workflow status" /></a>
    <a href="https://codecov.io/gh/tada5hi/mime-explorer"><img src="https://codecov.io/gh/tada5hi/mime-explorer/branch/master/graph/badge.svg" alt="Test coverage on Codecov" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a> ·
    <a href="#usage">Usage</a> ·
    <a href="#custom-mappings">Custom mappings</a> ·
    <a href="#api">API</a> ·
    <a href="#notes">Notes</a>
</p>

---

## Why mime-explorer?

You need a MIME type for a filename, a default extension for a Content-Type header, or the metadata behind either. A raw MIME database supplies the records; you still need lookup rules and an extension index.

| Concern | Without it | With mime-explorer |
|---|---|---|
| File paths and extensions | Strip path segments and normalize extension case yourself | `getType()` accepts paths, extensions and dotted extensions |
| Content-Type parameters | Remove parameters before searching the database | `getMeta()` and `getExtension()` accept values such as `text/html; charset=utf8` |
| Metadata | Maintain separate access to the underlying record | `getMeta()` returns extensions, source, charset and compressibility when present |
| Custom formats | Keep your own mappings alongside the database | `register()` and `unregister()` modify an instance |

```typescript
import { MimeExplorer } from 'mime-explorer';
import db from 'mime-explorer/db';

const mime = new MimeExplorer(db);

mime.getType('/uploads/report.JSON');              // 'application/json'
mime.getExtension('text/html; charset=utf8');      // 'html'
mime.getMeta('application/json')?.charset;         // 'UTF-8'
```

<p align="center">
    <img src="https://raw.githubusercontent.com/tada5hi/mime-explorer/master/.github/assets/lookup.svg" alt="getType uses the extension index. getMeta and getExtension use the MIME metadata index. Each MimeExplorer instance has its own indexes." width="960" />
</p>

<details>
<summary>How the lookup indexes work</summary>

Each `MimeExplorer` instance owns two indexes, initialized from the definitions passed to its constructor. The extension index maps a file extension to its MIME type; `getType()` searches it using the final path segment and suffix. The MIME metadata index maps a MIME type to its record; `getMeta()` returns that record, and `getExtension()` returns its first extension. Unknown lookups return `undefined`.

</details>

## Installation

```bash
npm install mime-explorer
```

The package is ESM-only and ships TypeScript declarations. CommonJS code can `require()` it on Node.js 20.19, 22.12 or newer; older runtimes need `import()`. `require()` callers load a separate CommonJS copy of `@ebec/core`, so catch failures with `instanceof MimeExplorerError` rather than `BaseError`. CommonJS TypeScript needs `"module": "NodeNext"`, because `Node16` rejects ESM-only imports from `.cts` files. Its one runtime dependency is [`@ebec/core`](https://github.com/tada5hi/ebec), the base of its error classes; it has no peer dependencies. It does not declare a Node.js runtime minimum. Contributor tools require Node 24.11 or newer within the 24.x line.

## Usage

Import the registry and database separately:

```typescript
import { MimeExplorer } from 'mime-explorer';
import db from 'mime-explorer/db';

const mime = new MimeExplorer(db);
```

For CommonJS:

```javascript
const { MimeExplorer } = require('mime-explorer');
const { default: db } = require('mime-explorer/db');

const mime = new MimeExplorer(db);
mime.getType('/uploads/report.JSON'); // 'application/json'
```

`new MimeExplorer()` creates an empty registry for custom mappings. Importing `mime-explorer` alone does not load the database or create a shared registry. The `mime-explorer/db` entrypoint provides the database as a typed default export, without JSON import attributes.

### Find a MIME type

```typescript
mime.getType('txt');                    // 'text/plain'
mime.getType('json');                   // 'application/json'
mime.getType('.JSON');                  // 'application/json'
mime.getType('/uploads/report.json');   // 'application/json'
mime.getType('C:\\uploads\\report.json'); // 'application/json'
mime.getType('unknown-extension');      // undefined
```

`getType()` uses the last path segment and its final extension, case-insensitively. Both `/` and `\` are path separators. A path whose final segment has no extension returns `undefined`; a bare extension such as `txt` is accepted. A dotfile in a path, such as `/uploads/.json`, is not treated as having an extension.

### Find the default extension

```typescript
mime.getExtension('text/plain');                // 'txt'
mime.getExtension('application/json');          // 'json'
mime.getExtension('TEXT/HTML; charset=utf8');    // 'html'
mime.getExtension('application/x-unknown-demo'); // undefined
```

`getExtension()` returns the first extension in the MIME record, without a leading dot. It ignores leading whitespace and MIME parameters, and compares the type case-insensitively.

### Read metadata

```typescript
mime.getMeta('application/json');
// {
//   source: 'iana',
//   charset: 'UTF-8',
//   compressible: true,
//   extensions: ['json', 'map']
// }

mime.getMeta('application/json; charset=ISO-8859-1')?.charset; // 'UTF-8'
mime.getMeta('application/x-unknown-demo');                   // undefined
```

`getMeta()` applies the same MIME normalization as `getExtension()`. Returned metadata comes from the registry; a header's `charset` parameter does not override it. Records without extensions are not registered, even if the underlying database contains other metadata for them.

## Custom mappings

```typescript
import { MimeExplorer } from 'mime-explorer';

const mime = new MimeExplorer();

mime.register({
    'application/x-project-note': ['pnote', 'pnt'],
    'text/x-project-log': {
        extensions: ['plog'],
        charset: 'UTF-8',
        compressible: true,
    },
});
mime.getType('meeting.PNOTE');                   // 'application/x-project-note'
mime.getExtension('application/x-project-note'); // 'pnote'
mime.getMeta('text/x-project-log')?.compressible; // true

mime.unregister('application/x-project-note');   // true
mime.getType('pnote');                           // undefined
```

- MIME keys and extensions follow the same rules as lookups, so anything registered can be found again. Keys may be Content-Type values, and extensions may have one leading dot.
- The first definition of a MIME record wins, and each extension has one owner: the first type that declared it. Registering a known type again can add extensions but cannot change its metadata.
- To replace a MIME record, call `unregister()` before registering it again. Removal does not restore an earlier owner of its extensions.
- `unregister()` removes the record and every extension it owns, and returns whether a record was removed.
- Each instance owns its registry. Definitions are not shared with other instances or saved to disk.

### Handling failures

By default `register()` applies everything it can and returns `true` when all of it was applied, `false` otherwise.

```typescript
const mime = new MimeExplorer(db);

mime.register({ 'application/x-mine': ['json', 'mine'] }); // false: 'json' is owned by 'application/json'
mime.getType('mine');                                      // 'application/x-mine'
```

With `throwOnFailure`, it applies nothing and throws a `RegistrationError`, whose `errors` property lists every problem:

```typescript
import { RegistrationError } from 'mime-explorer';

try {
    mime.register(definitions, { throwOnFailure: true });
} catch (error) {
    if (error instanceof RegistrationError) {
        console.error(error.errors);
    }
}
```

| Error | Raised when | Extra properties |
|---|---|---|
| `InvalidTypeError` | A key has no MIME type | `type` |
| `MissingExtensionsError` | A definition has no extensions | `type` |
| `InvalidExtensionError` | An extension is not a string, is empty, starts with `*`, or contains whitespace, `.`, `/` or `\` after its leading dot | `type`, `extension` |
| `ExtensionConflictError` | An extension belongs to another MIME type. Without `throwOnFailure` the record still lists it and it can be the default extension; `getType()` keeps returning the owner | `type`, `extension`, `owner` |
| `MetadataConflictError` | A registered type is given different metadata | `type` |

All of them extend `MimeExplorerError`, which extends `BaseError` from `@ebec/core`. The constructor never throws, because bundled data contains records without extensions and contested extensions; it keeps the first definition and skips unusable entries.

### Metadata fields

`register()` and the constructor accept a `TypeMetaCollection`: each MIME key maps to an extension array or a `TypeMetaInput` object.

| Field | Type | Behavior |
|---|---|---|
| `extensions` | `readonly string[]` | Required by `TypeMeta`; the first extension is the default |
| `source` | `string` | Optional origin, for example `iana`, `apache` or `nginx` |
| `charset` | `string` | Optional charset recorded for the MIME type |
| `compressible` | `boolean` | Optional compressibility information; absence does not mean `false` |

## API

The package root exports the classes and types below. Lookup and registration methods belong to `MimeExplorer` instances; there are no standalone function helpers. The error classes are listed under [Handling failures](#handling-failures).

| Export | Purpose |
|---|---|
| `MimeExplorer` | Registry class; `new MimeExplorer(collection?)` creates an independent registry, empty by default |
| `IMimeExplorer` | Interface for the registry methods |
| `TypeMeta` | Read-only metadata with required `extensions` and optional `source`, `charset`, `compressible` |
| `TypeMetaInput` | `Partial<TypeMeta>` accepted in definitions |
| `TypeMetaCollection` | `Readonly<Record<string, readonly string[] \| TypeMetaInput>>` accepted by the constructor and `register()` |
| `TypeMap` | Compatibility alias for `TypeMetaCollection` |
| `RegisterOptions` | Options for `register()`: `throwOnFailure` (default `false`) |

Import the bundled database as the default export from `mime-explorer/db`.

| Method | Input | Returns |
|---|---|---|
| `getType(path)` | `string`: extension, dotted extension, file name or path | MIME type, or `undefined` when unknown |
| `getExtension(contentType)` | `string`: MIME type or Content-Type header | Default extension without a dot, or `undefined` when unknown |
| `getMeta(contentType)` | `string`: MIME type or Content-Type header | Read-only `TypeMeta`, or `undefined` when unknown |
| `register(definitions, options?)` | `TypeMetaCollection` and optional `RegisterOptions` | `true` when everything was applied, otherwise `false` |
| `unregister(contentType)` | `string`: MIME type or Content-Type header | `true` when a record was removed, otherwise `false` |

## Notes

- **Extension lookup only.** The library does not inspect file contents, check that a file exists, or validate uploads. URL query strings and fragments are not stripped; pass a pathname or extension.
- **No fallback type.** Unknown inputs return `undefined`. Choose an application fallback such as `application/octet-stream` if needed.
- **Read-only metadata.** `getMeta()` returns a frozen record. Later registrations do not change a record you already hold.
- **Optional bundled data.** `mime-explorer/db` contains data from [mime-db](https://github.com/jshttp/mime-db). Pass it to the constructor to initialize both indexes. There are no network requests during lookups. Database updates can change mappings and default extensions.

## Contributing

Use Node 24.11 or newer within the 24.x line and npm:

```bash
npm ci
npm run build
npm run test:coverage
npm run lint
```

The build regenerates `src/db.json` from `mime-db` before producing `dist/`. Change the source dependency or generator rather than editing the generated database. Tests live in `test/unit/`; open changes through the [issue tracker](https://github.com/tada5hi/mime-explorer/issues) or a pull request.

## License

Made with 💚

Published under [MIT License](./LICENSE).
