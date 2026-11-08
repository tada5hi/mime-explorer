# 1. Extension ownership is not restored on unregister

Status: Accepted (2026-11-08)

## Context

Each extension has one owner: the first type that declared it. A later type that declares the same extension keeps it on its record, but `getType()` returns the first owner. `unregister()` deletes the owner entry, so the extension has no owner until something declares it again.

A review proposed keeping an ordered list of claimants per extension and promoting the next claimant when the owner is removed. The proposal would make `unregister()` the exact inverse of `register()`.

## Decision

Keep a single owner per extension. `unregister()` does not promote another type.

Promotion breaks the documented way to replace a record, which is `unregister()` followed by `register()`. When the extension is contested, the other claimant is promoted during that gap and the re-registered type loses the extension it just owned:

```ts
const mime = new MimeExplorer({
    'application/x-a': ['shared'],
    'application/x-b': ['shared'],
});

mime.unregister('application/x-a');
mime.register({ 'application/x-a': ['shared'] });

mime.getType('shared'); // today: application/x-a; with promotion: application/x-b
```

## Consequences

- The replace flow gives the same result whether or not an extension is contested.
- Removing an owner can leave an extension unknown even though another record still lists it. The README states that removal does not restore an earlier owner.

## Reconsider when

A use case needs removal to fall back to another claimant, and the proposal also defines how an explicit replace keeps its extensions.
