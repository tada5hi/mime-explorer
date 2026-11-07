# MIME registry API improvements

Status: proposed for discussion. This document proposes changes to the public
interface; implementation and release decisions belong in follow-up changes.

The registry already has a small interface. The goal is to make definitions,
metadata reads and extension lookups agree, while making immutable caller data
easier to use. Keep independent registries, the empty default constructor,
optional bundled data and `undefined` for unknown lookups.

## 1. Return metadata snapshots

`getMetaByType()` currently returns the stored object. This allows callers to
change metadata without updating the extension index:

```typescript
const mime = new MimeExplorer({ 'text/x-note': ['note'] });
mime.getMetaByType('text/x-note')!.extensions[0] = 'changed';

mime.getExtensionByType('text/x-note'); // 'changed'
mime.getTypeByExtension('changed');    // undefined
mime.getTypeByExtension('note');       // 'text/x-note'
```

Propose returning a snapshot containing a copy of the extension array. Expose
readonly metadata properties and `readonly string[]` extensions. For the known
metadata fields, copying the object and its extension array is sufficient.
TypeScript readonly annotations alone do not protect runtime state.

This adds a small allocation per metadata read and changes object identity across
reads. Default-extension lookup should read the internal record directly so it
does not need a snapshot allocation. A readonly view of internal state is a
cheaper alternative, but leaves JavaScript callers able to change the registry.

## 2. Keep registered extensions and metadata consistent

Repeated `defineType()` calls currently add unclaimed aliases to the extension
index while retaining the first metadata record:

```typescript
const mime = new MimeExplorer({ 'text/x-note': ['note'] });
mime.defineType('text/x-note', ['alias']);

mime.getTypeByExtension('alias');              // 'text/x-note'
mime.getMetaByType('text/x-note')!.extensions; // ['note']
```

Propose the following rules:

- Keep the first owner of an extension.
- Append newly accepted aliases to the existing record in registration order,
  without duplicates. Keep its existing default extension first.
- Exclude extensions owned by another MIME type from a record's returned
  extension list. Every returned extension should resolve to that record's type.
- Keep the first definition of scalar metadata fields such as `charset`.
- Removing a type removes its currently owned aliases and does not transfer
  ownership to a previously rejected definition.

A type with no owned extensions can still have metadata under proposal 3.
Its default extension is `undefined`. Filtering conflicts can change the default
extension of bundled records, so representative bundled mappings need explicit
regression checks.

Rejecting every repeated definition would also be predictable, but would remove
the existing ability to add aliases. Keep replacement explicit through the
existing `undefineType()` followed by `defineType()` sequence. Consider a dedicated
replacement operation only if that sequence proves insufficient; do not add a
force option or replacement method in this proposal.

## 3. Preserve metadata without extensions

`TypeMetaInput` accepts partial records, including `{ compressible: true }`, but
registration ignores any record without a nonempty extension array. Some bundled
database entries therefore cannot be queried through `getMetaByType()`.

Propose registering these records with `extensions: []`. For example:

```typescript
const mime = new MimeExplorer({
    'application/x-stream': { compressible: true },
});

// Proposed results:
mime.getMetaByType('application/x-stream');
// { compressible: true, extensions: [] }
mime.getExtensionByType('application/x-stream'); // undefined
```

Treat missing, explicitly undefined and empty extensions consistently. Preserve
the first scalar metadata record when a later definition adds extensions, as in
proposal 2. An empty record creates a known type with no extra metadata.

Requiring extensions in the input type is an alternative, but would make useful
MIME metadata depend on the existence of a filename extension.

## 4. Accept readonly definitions

Accept `readonly string[]` both directly and inside metadata, and a readonly
collection of definitions. Mutable arrays and objects remain valid inputs.
Registration must copy input arrays before storing or extending them.

```typescript
const definitions = {
    'text/x-note': ['note', 'nt'],
} as const;

// Proposed to type-check without casting or copying at the call site:
const mime = new MimeExplorer(definitions);
const logExtensions = ['log'] as const;
mime.defineType('text/x-log', logExtensions);
```

Keep `TypeMeta`, `TypeMetaInput`, `TypeMetaCollection`, `TypeMap` and
`IMimeExplorer` available through their existing public entrypoints. Readonly
output types must include the nested extension array; `Readonly<TypeMeta>` alone
would leave a mutable `string[]` mutable.

## 5. Consider shorter lookup names separately

For a future major release, consider these names:

| Current name | Proposed name | Reason |
| --- | --- | --- |
| `getTypeByExtension(input)` | `getType(input)` | Input already accepts filenames and paths as well as extensions |
| `getExtensionByType(type)` | `getDefaultExtension(type)` | Makes the choice of one default extension explicit |
| `getMetaByType(type)` | `getMeta(type)` | Retains the meaning with less repetition |

These names are optional and lower priority than consistent behavior. Keeping
the existing names avoids migration work. Do not add duplicate aliases solely
to introduce the new spelling.

## Compatibility and validation

Recommend proposals 1 through 4 as one behavior and type contract for a future
major release. Readonly input support could ship independently as an additive
change. Metadata snapshots, conflict filtering and previously ignored records
change documented behavior; they should not be described as compatible fixes.
Renaming methods is a separate decision and should not block the behavior work.

An implementation must update `src/module.ts`, the public declarations and
`IMimeExplorer` in `src/types.ts`, `test/unit/module.spec.ts` and `README.MD`.
Retain the root and database entrypoints, legacy declaration facade and dual
CommonJS/ESM outputs. Generated database data does not need manual edits.

Before implementation is merged, verify:

- Mutating a returned object or its extension array cannot change later reads
  or extension lookups, and separate reads do not share mutable state.
- Repeated definitions append owned aliases once, preserve scalar metadata and
  keep the default stable. Conflicting aliases are excluded from the later
  type's metadata, including when every requested extension is already owned.
- Removal clears all owned aliases, preserves other types and does not restore
  earlier rejected owners.
- Metadata-only records are readable, have no default extension, and accept
  later extension registration without replacing their scalar metadata.
- Readonly definitions type-check through constructor, single and bulk
  registration calls, including metadata objects. Registration and later alias
  additions do not mutate caller-owned data.
- Representative bundled mappings and default extensions retain their expected
  results, or any deliberate mapping changes are documented for migration.
- `npm run build`, `npm run test:coverage` and `npm run lint` pass on the
  supported development Node 24 version. Check both CommonJS and ESM consumers
  and declaration resolution for changes to exported types.
