import type { MimeExplorerError } from './errors';

export type TypeMeta = {
    /**
     * Source of the mime type and associated information.
     */
    readonly source?: string,
    /**
     * Extensions associated with the mime type. The first one is the default.
     */
    readonly extensions: readonly string[],
    /**
     * Charset of the mime type content.
     */
    readonly charset?: string,
    /**
     * Content of mime type is compressible?
     */
    readonly compressible?: boolean,
};

export type TypeMetaInput = Partial<TypeMeta>;

export type TypeMetaCollection = Readonly<Record<string, readonly string[] | TypeMetaInput>>;

export type TypeMap = TypeMetaCollection;

export type RegisterOptions = {
    /**
     * Apply nothing and throw `RegistrationError` when any part cannot be applied.
     *
     * @default false
     */
    readonly throwOnFailure?: boolean,
};

export interface IMimeExplorer {
    /**
     * Add definitions keyed by MIME type. The first definition of a type or extension wins.
     *
     * @param definitions - Extensions or metadata per MIME type, such as `{ 'text/plain': ['txt'] }`.
     * @param options - Set `throwOnFailure` to apply nothing and throw `RegistrationError` on any failure.
     * @returns One error per problem; empty when everything was applied. A contested extension
     * stays listed on its record, but `getType()` keeps returning its first owner.
     */
    register(definitions: TypeMetaCollection, options?: RegisterOptions) : readonly MimeExplorerError[];

    /**
     * Remove a MIME type and every extension it owns.
     *
     * @param contentType - A MIME type or Content-Type header, such as `text/plain; charset=utf-8`.
     * @returns `true` when a record was removed, `false` when the type is unknown.
     */
    unregister(contentType: string) : boolean;

    /**
     * Find the read-only record of a MIME type.
     *
     * @param contentType - A MIME type or Content-Type header, such as `text/html; charset=utf-8`.
     * @returns The record, or `undefined` when the type is unknown.
     */
    getMeta(contentType: string) : TypeMeta | undefined;

    /**
     * Find the MIME type of a file.
     *
     * @param path - An extension, dotted extension, file name or path, such as `/uploads/report.JSON`.
     * @returns The MIME type, such as `application/json`, or `undefined` when the extension is unknown.
     */
    getType(path: string) : string | undefined;

    /**
     * Find the default file extension of a MIME type.
     *
     * @param contentType - A MIME type or Content-Type header, such as `text/html; charset=utf-8`.
     * @returns The extension without a leading dot, such as `html`, or `undefined` when the type is unknown.
     */
    getExtension(contentType: string) : string | undefined;
}
