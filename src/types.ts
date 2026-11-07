export type TypeMeta = {
    /**
     * Source of the mime type and associated information.
     */
    source?: string,
    /**
     * Extensions associated with the mime type.
     */
    extensions: string[],
    /**
     * Charset of the mime type content.
     */
    charset?: string,
    /**
     * Content of mime type is compressible?
     */
    compressible?: boolean,
};

export type TypeMetaInput = Partial<TypeMeta>;

export type TypeMetaCollection = Record<string, string[] | TypeMetaInput>;

export type TypeMap = TypeMetaCollection;

export interface IMimeExplorer {
    /** Register a MIME type and its extensions/metadata, keeping existing definitions. */
    defineType(mimeType: string, value: string[] | TypeMetaInput) : void;

    /** Register definitions keyed by MIME type, such as { 'text/plain': ['txt'] }. */
    defineTypes(items: TypeMetaCollection) : void;

    /** Remove an exact lowercase MIME key and every extension owned by it. */
    undefineType(mimeType: string) : void;

    /** Read metadata for a MIME type or Content-Type header, ignoring case and parameters. */
    getMetaByType(mimeType: string) : TypeMeta | undefined;

    /** Get a MIME type from an extension, filename or path, such as '.json' or '/files/a.json'. */
    getTypeByExtension(extensionOrPath: string) : string | undefined;

    /** Get the default extension for a MIME type or Content-Type header, without a leading *. */
    getExtensionByType(mimeType: string) : string | undefined;
}
