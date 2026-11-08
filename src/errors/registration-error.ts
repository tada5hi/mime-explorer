import { MimeExplorerError } from './mime-explorer-error.js';

/** Thrown by `register()` with `throwOnFailure`, grouping every failure. */
export class RegistrationError extends MimeExplorerError {
    declare readonly errors: readonly MimeExplorerError[];

    constructor(errors: readonly MimeExplorerError[]) {
        super({
            code: 'REGISTRATION_ERROR',
            message: `Registration failed: ${errors.map((error) => error.message).join(' ')}`,
            errors,
        });

        this.name = 'RegistrationError';
    }
}
