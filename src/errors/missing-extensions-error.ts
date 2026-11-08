import { MimeExplorerError } from './mime-explorer-error.ts';

/** A definition has no usable extensions or metadata, so its MIME type cannot be registered. */
export class MissingExtensionsError extends MimeExplorerError {
    readonly type: string;

    constructor(type: string) {
        super({ code: 'MISSING_EXTENSIONS_ERROR', message: `'${type}' has no usable extensions or metadata.` });

        this.name = 'MissingExtensionsError';
        this.type = type;
    }
}
