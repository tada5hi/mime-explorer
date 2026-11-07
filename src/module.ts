import type {
    IMimeExplorer,
    TypeMeta,
    TypeMetaCollection,
    TypeMetaInput,
} from './types';
import { hasOwnProperty } from './utils';

export class MimeExplorer implements IMimeExplorer {
    protected metaMap : Record<string, TypeMeta>;

    protected extensionMap : Record<string, string>;

    // ----------------------------------------------

    constructor(collection: TypeMetaCollection = {}) {
        this.metaMap = {};
        this.extensionMap = {};

        this.defineTypes(collection);
    }

    // ----------------------------------------------

    /** Register a MIME type and its extensions/metadata, keeping existing definitions. */
    defineType(mimeType: string, value: string[] | TypeMetaInput): void {
        let meta : TypeMeta = { extensions: [] };

        if (Array.isArray(value)) {
            meta.extensions = value;
        } else {
            meta = {
                ...meta,
                ...value,
            };
        }

        if (typeof meta.extensions === 'undefined') {
            meta.extensions = [];
        }

        if (meta.extensions.length === 0) {
            return;
        }

        meta.extensions = meta.extensions.map((t) => t.toLowerCase());

        mimeType = mimeType.toLowerCase();

        for (let j = 0; j < meta.extensions.length; j++) {
            const ext = meta.extensions[j] as string;

            if (!hasOwnProperty(this.extensionMap, ext)) {
                this.extensionMap[ext] = mimeType;
            }
        }

        if (!hasOwnProperty(this.metaMap, mimeType)) {
            this.metaMap[mimeType] = meta;
        }
    }

    /** Register definitions keyed by MIME type, such as { 'text/plain': ['txt'] }. */
    defineTypes(items: TypeMetaCollection): void {
        const keys = Object.keys(items);

        for (const key of keys) {
            if (!hasOwnProperty(items, key) || !items[key]) {
                continue;
            }

            this.defineType(key, items[key]);
        }
    }

    /** Remove an exact lowercase MIME key and every extension owned by it. */
    undefineType(mimeType: string): void {
        if (!hasOwnProperty(this.metaMap, mimeType)) {
            return;
        }

        delete this.metaMap[mimeType];

        const keys = Object.keys(this.extensionMap);

        for (const extension of keys) {
            if (this.extensionMap[extension] === mimeType) {
                delete this.extensionMap[extension];
            }
        }
    }

    /** Read metadata for a MIME type or Content-Type header, ignoring case and parameters. */
    getMetaByType(mimeType: string): TypeMeta | undefined {
        const type = /^\s*([^;\s]*)/.test(mimeType) && RegExp.$1;

        if (!type) {
            return undefined;
        }

        return this.metaMap[type.toLowerCase()];
    }

    /** Get the default extension for a MIME type or Content-Type header, without a leading *. */
    getExtensionByType(mimeType: string): string | undefined {
        const meta = this.getMetaByType(mimeType);

        const [ext] = meta?.extensions || [];

        if (!ext) {
            return undefined;
        }

        return ext[0] !== '*' ? ext : ext.slice(1);
    }

    /** Get a MIME type from an extension, filename or path, such as '.json' or '/files/a.json'. */
    getTypeByExtension(extensionOrPath: string): string | undefined {
        const last = extensionOrPath
            .replace(/^.*[/\\]/, '').toLowerCase();

        const ext = last
            .replace(/^.*\./, '').toLowerCase();

        const hasPath = last.length < extensionOrPath.length;
        const hasDot = ext.length < last.length - 1;

        if (!hasDot && hasPath) {
            return undefined;
        }

        return this.extensionMap[ext];
    }
}
