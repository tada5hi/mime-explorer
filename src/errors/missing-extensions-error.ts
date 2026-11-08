import { MimeExplorerError } from './mime-explorer-error';

/** A definition lists no extensions, so its MIME type cannot be registered. */
export class MissingExtensionsError extends MimeExplorerError {
    readonly type: string;

    constructor(type: string) {
        super({ code: 'MISSING_EXTENSIONS_ERROR', message: `'${type}' has no extensions.` });

        this.name = 'MissingExtensionsError';
        this.type = type;
    }
}
