const assert = require('node:assert/strict');
const { MimeExplorer, MimeExplorerError } = require('mime-explorer');
const { default: db } = require('mime-explorer/db');

assert.ok(db['text/plain']);
assert.equal(new MimeExplorer(db).getType('/a/b.JSON'), 'application/json');
assert.throws(
    () => new MimeExplorer().register({ 'x/a': ['*bad'] }, { throwOnFailure: true }),
    MimeExplorerError,
);
