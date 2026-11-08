import { MimeExplorer, RegistrationError } from 'mime-explorer';
import type { IMimeExplorer, TypeMeta } from 'mime-explorer';
import db from 'mime-explorer/db';

const mime: IMimeExplorer = new MimeExplorer(db);
const meta: TypeMeta | undefined = mime.getMeta('application/json');

// @ts-expect-error The default export is the database, not a namespace holding it.
export const namespace: { default: unknown } = db;

export { RegistrationError, meta };
