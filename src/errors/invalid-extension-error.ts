import { MimeExplorerError } from './mime-explorer-error.ts';

/** An extension can never be found by a lookup, such as 'tar.gz' or '*txt'. */
export class InvalidExtensionError extends MimeExplorerError {
    readonly type: string;

    readonly extension: string;

    constructor(type: string, extension: string) {
        super({ code: 'INVALID_EXTENSION_ERROR', message: `'${extension}' of '${type}' is not a valid extension.` });

        this.name = 'InvalidExtensionError';
        this.type = type;
        this.extension = extension;
    }
}
