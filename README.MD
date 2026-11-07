<p align="center">
    <img src="https://raw.githubusercontent.com/tada5hi/mime-explorer/8b0d412c03e1ad24e0ca74b553d41bf2e16a2b6c/.github/assets/logo.svg" alt="mime-explorer: a cloud of file extensions" width="128" height="128" />
</p>

<h1 align="center">mime-explorer</h1>

<p align="center">
    <b>Look up MIME types, file extensions and metadata, and register your own mappings.</b><br>
    Use one API for file paths, Content-Type values and custom formats.<br>
    The MIME database is bundled, with ESM, CommonJS and TypeScript declarations.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/mime-explorer"><img src="https://img.shields.io/npm/v/mime-explorer" alt="npm version" /></a>
    <a href="https://github.com/tada5hi/mime-explorer/actions/workflows/main.yml"><img src="https://github.com/tada5hi/mime-explorer/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/tada5hi/mime-explorer"><img src="https://codecov.io/gh/tada5hi/mime-explorer/branch/master/graph/badge.svg" alt="Coverage" /></a>
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
| Content-Type parameters | Remove parameters before searching the database | `get()` and `getExtension()` accept values such as `text/html; charset=utf8` |
| Metadata | Maintain separate access to the underlying record | `get()` returns extensions, source, charset and compressibility when present |
| Custom formats | Keep your own mappings alongside the database | `define()`, `defineMany()` and `undefine()` modify the loaded registry |

```typescript
import { get, getExtension, getType } from 'mime-explorer';

getType('/uploads/report.JSON');          // 'application/json'
getExtension('text/html; charset=utf8');  // 'html'
get('application/json')?.charset;         // 'UTF-8'
```

<p align="center">
    <img src="https://raw.githubusercontent.com/tada5hi/mime-explorer/8b0d412c03e1ad24e0ca74b553d41bf2e16a2b6c/.github/assets/lookup.svg" alt="getType extracts and lowercases a file extension, then looks it up in the extension index. get and getExtension strip MIME parameters and look up the metadata index; getExtension returns its first extension." width="960" />
</p>

## Installation

```bash
npm install mime-explorer
```

The package provides ESM and CommonJS entrypoints, TypeScript declarations, and no runtime dependencies or peer dependencies. It does not declare a Node.js runtime minimum. Contributor tools require Node 24.11 or newer within the 24.x line.

## Usage

### Find a MIME type

```typescript
import { getType } from 'mime-explorer';

getType('txt');                    // 'text/plain'
getType('json');                   // 'application/json'
getType('.JSON');                  // 'application/json'
getType('/uploads/report.json');   // 'application/json'
getType('C:\\uploads\\report.json'); // 'application/json'
getType('unknown-extension');      // undefined
```

`getType()` uses the last path segment and its final extension, case-insensitively. Both `/` and `\` are path separators. A path whose final segment has no extension returns `undefined`; a bare extension such as `txt` is accepted. A dotfile in a path, such as `/uploads/.json`, is not treated as having an extension.

### Find the default extension

```typescript
import { getExtension } from 'mime-explorer';

getExtension('text/plain');                // 'txt'
getExtension('application/json');          // 'json'
getExtension('TEXT/HTML; charset=utf8');    // 'html'
getExtension('application/x-unknown-demo'); // undefined
```

`getExtension()` returns the first extension in the MIME record, without a leading dot. It ignores leading whitespace and MIME parameters, and compares the type case-insensitively. A leading `*` on a registered default extension is removed from the returned value.

### Read metadata

```typescript
import { get } from 'mime-explorer';

get('text/plain');
// {
//   source: 'iana',
//   compressible: true,
//   extensions: ['txt', 'text', 'conf', 'def', 'list', 'log', 'in', 'ini']
// }

get('application/json');
// {
//   source: 'iana',
//   charset: 'UTF-8',
//   compressible: true,
//   extensions: ['json', 'map']
// }

get('application/json; charset=ISO-8859-1')?.charset; // 'UTF-8'
get('application/x-unknown-demo');                   // undefined
```

`get()` applies the same MIME normalization as `getExtension()`. Returned metadata comes from the registry; a header's `charset` parameter does not override it. Records without extensions are not registered, even if the underlying database contains other metadata for them.

## Custom mappings

```typescript
import {
    define,
    defineMany,
    get,
    getExtension,
    getType,
    undefine,
} from 'mime-explorer';

define('application/x-project-note', ['pnote', 'pnt']);
getType('meeting.PNOTE');                   // 'application/x-project-note'
getExtension('application/x-project-note'); // 'pnote'

defineMany({
    'text/x-project-log': {
        extensions: ['plog'],
        charset: 'UTF-8',
        compressible: true,
    },
});
get('text/x-project-log')?.compressible; // true

undefine('application/x-project-note');
undefine('text/x-project-log');
getType('pnote'); // undefined
```

- Pass extensions without a leading dot. `define()` lowercases MIME keys and extensions; use bare MIME keys without parameters.
- An extension list must be nonempty. Missing, `undefined` or empty `extensions` make the definition a no-op.
- The first definition of a MIME record wins. Each extension mapping is also first-wins, independently. Calling `define()` again can register new extensions without replacing the MIME record or its metadata.
- To replace a MIME record, remove it with `undefine()` before defining it again. Existing extension owners still win; removal does not restore an earlier owner.
- `undefine()` takes the exact lowercase MIME key, without parameters. It removes the record and every extension currently pointing to that key. Unknown keys are a no-op.
- Definitions modify shared state in that loaded module instance. They are not saved to disk, and ESM and CommonJS builds maintain separate registries when loaded together.

### Metadata fields

`define()` accepts an extension array or a `TypeMeta` object. `defineMany()` accepts a `TypeMap`, whose object values may use the partial `TypeMetaInput` shape.

| Field | Type | Behavior |
|---|---|---|
| `extensions` | `string[]` | Required by `TypeMeta`; the first extension is the default. Definitions without extensions are ignored |
| `source` | `string` | Optional origin, for example `iana`, `apache` or `nginx` |
| `charset` | `string` | Optional charset recorded for the MIME type |
| `compressible` | `boolean` | Optional compressibility information; absence does not mean `false` |

## API

All exports below are available from `mime-explorer`.

| Export | Signature / type | Purpose |
|---|---|---|
| `getType` | `(input: string) => string \| undefined` | Look up a MIME type from a path or extension |
| `getExtension` | `(input: string) => string \| undefined` | Return a MIME record's default extension |
| `get` | `(input: string) => TypeMeta \| undefined` | Return a MIME record |
| `define` | `(key: string, value: string[] \| TypeMeta) => void` | Register a MIME type and extensions |
| `defineMany` | `(typeMap: TypeMap) => void` | Register multiple definitions |
| `undefine` | `(input: string) => void` | Remove a MIME record and its owned extensions |
| `TypeMeta` | Type | Metadata with required `extensions` and optional `source`, `charset`, `compressible` |
| `TypeMetaInput` | `Partial<TypeMeta>` | Partial metadata accepted in a `TypeMap` |
| `TypeMap` | `Record<string, string[] \| TypeMetaInput>` | Input for `defineMany()` |

## Notes

- **Extension lookup only.** The library does not inspect file contents, check that a file exists, or validate uploads. URL query strings and fragments are not stripped; pass a pathname or extension.
- **No fallback type.** Unknown inputs return `undefined`. Choose an application fallback such as `application/octet-stream` if needed.
- **Live metadata.** `get()` returns the stored object. Treat it as read-only: modifying it changes future metadata reads without rebuilding the extension index.
- **Bundled data.** The database comes from [mime-db](https://github.com/jshttp/mime-db) and is loaded in memory at import time. There are no network requests during lookups. Database updates can change mappings and default extensions.

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
