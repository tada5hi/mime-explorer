import { MimeExplorerError } from './mime-explorer-error';

/** A definition key has no MIME type, such as an empty string. */
export class InvalidTypeError extends MimeExplorerError {
    readonly type: string;

    constructor(type: string) {
        super({ code: 'INVALID_TYPE_ERROR', message: `'${type}' does not contain a MIME type.` });

        this.name = 'InvalidTypeError';
        this.type = type;
    }
}
