import { MimeExplorerError } from './mime-explorer-error.js';

/** An extension already belongs to another MIME type, which keeps the `getType()` result. */
export class ExtensionConflictError extends MimeExplorerError {
    readonly type: string;

    readonly extension: string;

    readonly owner: string;

    constructor(type: string, extension: string, owner: string) {
        super({ code: 'EXTENSION_CONFLICT_ERROR', message: `'${extension}' of '${type}' is owned by '${owner}'.` });

        this.name = 'ExtensionConflictError';
        this.type = type;
        this.extension = extension;
        this.owner = owner;
    }
}
