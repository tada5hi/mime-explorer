import { MimeExplorerError } from './mime-explorer-error.ts';

/** A registered MIME type was defined again with different metadata. */
export class MetadataConflictError extends MimeExplorerError {
    readonly type: string;

    constructor(type: string) {
        super({ code: 'METADATA_CONFLICT_ERROR', message: `'${type}' is already registered with different metadata.` });

        this.name = 'MetadataConflictError';
        this.type = type;
    }
}
