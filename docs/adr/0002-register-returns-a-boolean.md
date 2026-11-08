# 2. `register()` returns a boolean

Status: Accepted (2026-11-08)

## Context

`register()` applies what it can and returns `true` only when everything was applied. With `throwOnFailure` it applies nothing and throws a `RegistrationError` that lists every problem.

A review proposed returning the list of failures, so that a caller could inspect them while still applying the usable definitions. The registry redesign in #155 had already moved from that shape to a boolean.

## Decision

Keep the boolean return value. Per-problem details stay available through `throwOnFailure` and `RegistrationError`.

- An empty array is truthy, so `if (mime.register(definitions))` would pass on every call, including calls that failed.
- Failures are lazy thunks, and an error is only constructed when a caller asks for details. Returning failures would construct an error for every problem on every permissive call, and large collections can have many problems.

## Consequences

- The common check stays a plain condition, and permissive registration does not pay for errors nobody reads.
- A caller cannot apply the usable definitions and also receive the details in one call. It can run a strict `register()` first, which changes nothing when it throws, and then a permissive one.

## Reconsider when

Callers need partial application and failure details together, often enough to justify a separate method or a result object that cannot be mistaken for a success flag.
