export type TypeMap = Record<string, string[] | TypeMetaInput>;

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
