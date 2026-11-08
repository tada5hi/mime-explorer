# 3. Keep the `IMimeExplorer` interface

Status: Accepted (2026-11-08)

## Context

`MimeExplorer` is the only implementation of `IMimeExplorer` in this repository. A review proposed removing the interface, because a seam with one adapter is usually hypothetical.

## Decision

Keep and export `IMimeExplorer`.

The second adapter lives in consumer code. `MimeExplorer` has `#private` fields, which make the class nominal in TypeScript, so an object with the same methods cannot be assigned to it:

```ts
const fake = {
    register: () => true,
    unregister: () => true,
    getMeta: () => undefined,
    getExtension: () => undefined,
    getType: () => undefined,
};

const a: IMimeExplorer = fake; // compiles
const b: MimeExplorer = fake;  // does not compile
```

The interface is the only way for consumers to type a fake or an alternative registry. It is also part of the documented public exports.

## Consequences

- Method signatures and their documentation live on the interface, and the class has to stay in step with it.
- Removing the interface would be a breaking change for consumers that depend on it.

## Reconsider when

`MimeExplorer` stops being nominal, for example if its `#private` fields go away.
