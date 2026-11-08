import { MimeExplorer } from '../../src';
import type {
    IMimeExplorer, MimeExplorerError, TypeMap, TypeMeta, TypeMetaCollection,
} from '../../src';
import db from '../../src/db';

const definitions = {
    'text/x-note': { extensions: ['note'], charset: 'UTF-8' },
    'text/x-log': ['log'],
    'application/x-stream': { compressible: true },
} as const;
const collection: TypeMetaCollection = definitions;
const legacyCollection: TypeMap = definitions;
const mime: IMimeExplorer = new MimeExplorer(collection);
const extensions = ['alias'] as const;
const metadata = { extensions: ['more'], charset: 'UTF-8' } as const;

mime.register({ 'text/x-note': extensions });
mime.register({ 'text/x-note': metadata });
mime.register(definitions);
new MimeExplorer(legacyCollection);
new MimeExplorer(db);

const errors: readonly MimeExplorerError[] = mime.register(definitions, { throwOnFailure: true });
// @ts-expect-error The returned error list is readonly.
errors.push(errors[0] as MimeExplorerError);
mime.unregister('text/x-note') satisfies boolean;

const snapshot: TypeMeta | undefined = mime.getMeta('text/x-note');

if (snapshot) {
    // @ts-expect-error Metadata properties are readonly.
    snapshot.charset = 'ASCII';
    // @ts-expect-error The extension array property is readonly.
    snapshot.extensions = [];
    // @ts-expect-error Extension array elements are readonly.
    snapshot.extensions[0] = 'changed';
    // @ts-expect-error Extension arrays cannot be extended by callers.
    snapshot.extensions.push('changed');
}
