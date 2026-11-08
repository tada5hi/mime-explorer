import assert from 'node:assert/strict';
import { BaseError } from '@ebec/core';
import { MimeExplorer, RegistrationError } from 'mime-explorer';
import db from 'mime-explorer/db';

assert.equal(db.default, undefined);
assert.ok(db['text/plain']);
assert.equal(new MimeExplorer(db).getType('/a/b.JSON'), 'application/json');

assert.throws(
    () => new MimeExplorer().register({ 'x/a': ['*bad'] }, { throwOnFailure: true }),
    (error) => error instanceof RegistrationError && error instanceof BaseError && error.name === 'RegistrationError',
);
