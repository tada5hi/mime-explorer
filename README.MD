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
| File paths and extensions | Strip path segments and normalize extension case yourself | `getTypeByExtension()` accepts paths, extensions and dotted extensions |
| Content-Type parameters | Remove parameters before searching the database | `getMetaByType()` and `getExtensionByType()` accept values such as `text/html; charset=utf8` |
| Metadata | Maintain separate access to the underlying record | `getMetaByType()` returns extensions, source, charset and compressibility when present |
| Custom formats | Keep your own mappings alongside the database | `defineType()`, `defineTypes()` and `undefineType()` modify an instance |

```typescript
import { MimeExplorer } from 'mime-explorer';
import db from 'mime-explorer/db';

const mime = new MimeExplorer(db);

mime.getTypeByExtension('/uploads/report.JSON');         // 'application/json'
mime.getExtensionByType('text/html; charset=utf8');      // 'html'
mime.getMetaByType('application/json')?.charset;         // 'UTF-8'
```

<p align="center">
    <img src="https://raw.githubusercontent.com/tada5hi/mime-explorer/master/.github/assets/lookup.svg" alt="getTypeByExtension uses the extension index. getMetaByType and getExtensionByType use the MIME metadata index. Each MimeExplorer instance has its own indexes." width="960" />
</p>

## Installation

```bash
npm install mime-explorer
```

The package provides ESM and CommonJS entrypoints, TypeScript declarations, and no runtime dependencies or peer dependencies. It does not declare a Node.js runtime minimum. Contributor tools require Node 24.11 or newer within the 24.x line.

## Usage

Import the registry and database separately:

```typescript
import { MimeExplorer } from 'mime-explorer';
import db from 'mime-explorer/db';

const mime = new MimeExplorer(db);
```

`new MimeExplorer()` creates an empty registry for custom mappings. Importing `mime-explorer` alone does not load the database or create a shared registry. The `mime-explorer/db` entrypoint provides a typed default export in ESM and CommonJS builds, without JSON import attributes.

### Find a MIME type

```typescript
mime.getTypeByExtension('txt');                    // 'text/plain'
mime.getTypeByExtension('json');                   // 'application/json'
mime.getTypeByExtension('.JSON');                  // 'application/json'
mime.getTypeByExtension('/uploads/report.json');   // 'application/json'
mime.getTypeByExtension('C:\\uploads\\report.json'); // 'application/json'
mime.getTypeByExtension('unknown-extension');      // undefined
```

`getTypeByExtension()` uses the last path segment and its final extension, case-insensitively. Both `/` and `\` are path separators. A path whose final segment has no extension returns `undefined`; a bare extension such as `txt` is accepted. A dotfile in a path, such as `/uploads/.json`, is not treated as having an extension.

### Find the default extension

```typescript
mime.getExtensionByType('text/plain');                // 'txt'
mime.getExtensionByType('application/json');          // 'json'
mime.getExtensionByType('TEXT/HTML; charset=utf8');    // 'html'
mime.getExtensionByType('application/x-unknown-demo'); // undefined
```

`getExtensionByType()` returns the first extension in the MIME record, without a leading dot. It ignores leading whitespace and MIME parameters, and compares the type case-insensitively. A leading `*` on a registered default extension is removed from the returned value.

### Read metadata

```typescript
mime.getMetaByType('application/json');
// {
//   source: 'iana',
//   charset: 'UTF-8',
//   compressible: true,
//   extensions: ['json', 'map']
// }

mime.getMetaByType('application/json; charset=ISO-8859-1')?.charset; // 'UTF-8'
mime.getMetaByType('application/x-unknown-demo');                   // undefined
```

`getMetaByType()` applies the same MIME normalization as `getExtensionByType()`. Returned metadata comes from the registry; a header's `charset` parameter does not override it. Records without extensions are not registered, even if the underlying database contains other metadata for them.

## Custom mappings

```typescript
import { MimeExplorer } from 'mime-explorer';

const mime = new MimeExplorer();

mime.defineType('application/x-project-note', ['pnote', 'pnt']);
mime.getTypeByExtension('meeting.PNOTE');                   // 'application/x-project-note'
mime.getExtensionByType('application/x-project-note');      // 'pnote'

mime.defineTypes({
    'text/x-project-log': {
        extensions: ['plog'],
        charset: 'UTF-8',
        compressible: true,
    },
});
mime.getMetaByType('text/x-project-log')?.compressible; // true

mime.undefineType('application/x-project-note');
mime.undefineType('text/x-project-log');
mime.getTypeByExtension('pnote'); // undefined
```

- Pass extensions without a leading dot. `defineType()` lowercases MIME keys and extensions; use bare MIME keys without parameters.
- An extension list must be nonempty. Missing, `undefined` or empty `extensions` make the definition a no-op.
- The first definition of a MIME record wins. Each extension mapping is also first-wins, independently. Calling `defineType()` again can register new extensions without replacing the MIME record or its metadata.
- To replace a MIME record, remove it with `undefineType()` before defining it again. Existing extension owners still win; removal does not restore an earlier owner.
- `undefineType()` takes the exact lowercase MIME key, without parameters. It removes the record and every extension currently pointing to that key. Unknown keys are a no-op.
- Each instance owns its registry. Definitions are not shared with other instances or saved to disk.

### Metadata fields

`defineType()` accepts an extension array or a `TypeMetaInput` object. `defineTypes()` and the constructor accept a `TypeMetaCollection` with the same definition shapes.

| Field | Type | Behavior |
|---|---|---|
| `extensions` | `string[]` | Required by `TypeMeta`; the first extension is the default. Definitions without extensions are ignored |
| `source` | `string` | Optional origin, for example `iana`, `apache` or `nginx` |
| `charset` | `string` | Optional charset recorded for the MIME type |
| `compressible` | `boolean` | Optional compressibility information; absence does not mean `false` |

## API

The package root exports the class and types below. Lookup and registration methods belong to `MimeExplorer` instances; there are no standalone function helpers.

| Export | Purpose |
|---|---|
| `MimeExplorer` | Registry class; `new MimeExplorer(collection?)` creates an independent registry, empty by default |
| `IMimeExplorer` | Interface for the registry methods |
| `TypeMeta` | Metadata with required `extensions` and optional `source`, `charset`, `compressible` |
| `TypeMetaInput` | `Partial<TypeMeta>` accepted by registration methods |
| `TypeMetaCollection` | `Record<string, string[] \| TypeMetaInput>` accepted by the constructor and `defineTypes()` |
| `TypeMap` | Compatibility alias for `TypeMetaCollection` |

Import the bundled database as the default export from `mime-explorer/db`.

| Method | Signature | Purpose |
|---|---|---|
| `getTypeByExtension` | `(extensionOrPath: string) => string \| undefined` | MIME type from an extension, filename or path |
| `getExtensionByType` | `(mimeType: string) => string \| undefined` | Default extension from a MIME type or Content-Type header |
| `getMetaByType` | `(mimeType: string) => TypeMeta \| undefined` | Metadata from a MIME type or Content-Type header |
| `defineType` | `(mimeType: string, value: string[] \| TypeMetaInput) => void` | Register one MIME type and its extensions/metadata |
| `defineTypes` | `(items: TypeMetaCollection) => void` | Register definitions keyed by MIME type |
| `undefineType` | `(mimeType: string) => void` | Remove a MIME record and its owned extensions |

## Notes

- **Extension lookup only.** The library does not inspect file contents, check that a file exists, or validate uploads. URL query strings and fragments are not stripped; pass a pathname or extension.
- **No fallback type.** Unknown inputs return `undefined`. Choose an application fallback such as `application/octet-stream` if needed.
- **Live metadata.** `getMetaByType()` returns the stored object. Treat it as read-only: modifying it changes future metadata reads without rebuilding the extension index.
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
