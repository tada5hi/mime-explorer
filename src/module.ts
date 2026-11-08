import {
    ExtensionConflictError,
    InvalidExtensionError,
    InvalidTypeError,
    MetadataConflictError,
    MissingExtensionsError,
    RegistrationError,
} from './errors/index.js';
import type { MimeExplorerError } from './errors/index.js';
import type {
    IMimeExplorer,
    RegisterOptions,
    TypeMeta,
    TypeMetaCollection,
    TypeMetaInput,
} from './types.js';

type Records = Map<string, TypeMeta>;
type Owners = Map<string, string>;
type Failure = () => MimeExplorerError;

export class MimeExplorer implements IMimeExplorer {
    #records: Records = new Map();

    #owners: Owners = new Map();

    /**
     * Create an independent registry, empty by default. Never throws: the first definition
     * of a type or extension wins and unusable entries are skipped without being reported.
     *
     * @param definitions - Extensions or metadata per MIME type, such as the `mime-explorer/db` export.
     */
    constructor(definitions: TypeMetaCollection = {}) {
        applyDefinitions(definitions, this.#records, this.#owners);
    }

    register(definitions: TypeMetaCollection, options: RegisterOptions = {}): boolean {
        if (!options.throwOnFailure) {
            return applyDefinitions(definitions, this.#records, this.#owners).length === 0;
        }

        const records = new Map(this.#records);
        const owners = new Map(this.#owners);
        const failures = applyDefinitions(definitions, records, owners);

        if (failures.length > 0) {
            throw new RegistrationError(failures.map((createError) => createError()));
        }

        this.#records = records;
        this.#owners = owners;

        return true;
    }

    unregister(contentType: string): boolean {
        const type = readMimeType(contentType);
        const record = type && this.#records.get(type);

        if (!type || !record) {
            return false;
        }

        this.#records.delete(type);

        for (const extension of record.extensions) {
            if (this.#owners.get(extension) === type) {
                this.#owners.delete(extension);
            }
        }

        return true;
    }

    getMeta(contentType: string): TypeMeta | undefined {
        const type = readMimeType(contentType);

        return type ? this.#records.get(type) : undefined;
    }

    getExtension(contentType: string): string | undefined {
        return this.getMeta(contentType)?.extensions[0];
    }

    getType(path: string): string | undefined {
        const extension = readExtension(path);

        return extension ? this.#owners.get(extension) : undefined;
    }
}

/** Apply what is usable and describe the rest; errors are created only when a caller needs them. */
function applyDefinitions(definitions: TypeMetaCollection, records: Records, owners: Owners): Failure[] {
    const failures: Failure[] = [];

    for (const [mimeType, value] of Object.entries(definitions ?? {})) {
        applyDefinition(mimeType, value, records, owners, failures);
    }

    return failures;
}

function applyDefinition(
    mimeType: string,
    value: readonly string[] | TypeMetaInput,
    records: Records,
    owners: Owners,
    failures: Failure[],
): void {
    const type = readMimeType(mimeType);

    if (!type) {
        failures.push(() => new InvalidTypeError(mimeType));

        return;
    }

    const definition = readDefinition(value);
    const declared = Array.isArray(definition.extensions) ? definition.extensions as readonly string[] : [];
    const existing = records.get(type);

    if (existing && hasDifferentMetadata(existing, definition)) {
        failures.push(() => new MetadataConflictError(type));
    }

    if (declared.length === 0) {
        failures.push(() => new MissingExtensionsError(type));

        return;
    }

    const extensions = new Set<string>();

    for (const input of declared) {
        const extension = parseDeclaredExtension(input);

        if (extension) {
            extensions.add(extension);
        } else {
            failures.push(() => new InvalidExtensionError(type, describeValue(input)));
        }
    }

    if (extensions.size === 0) {
        return;
    }

    for (const extension of extensions) {
        const owner = owners.get(extension);

        if (owner === undefined) {
            owners.set(extension, type);
        } else if (owner !== type) {
            failures.push(() => new ExtensionConflictError(type, extension, owner));
        }
    }

    records.set(type, freezeRecord(existing ?
        { ...existing, extensions: [...new Set([...existing.extensions, ...extensions])] } :
        { ...definition, extensions: [...extensions] }));
}

function readDefinition(value: unknown): TypeMetaInput {
    if (Array.isArray(value)) {
        return { extensions: value };
    }

    return typeof value === 'object' && value !== null ? value : {};
}

/** A printable form of any value, including objects without a usable `toString`. */
function describeValue(value: unknown): string {
    return Object(value) === value ? Object.prototype.toString.call(value) : String(value);
}

function hasDifferentMetadata(record: TypeMeta, definition: TypeMetaInput): boolean {
    return Object.entries(definition).some(([key, value]) => key !== 'extensions' &&
        value !== undefined &&
        record[key as keyof TypeMeta] !== value);
}

function freezeRecord(record: TypeMeta): TypeMeta {
    return Object.freeze({ ...record, extensions: Object.freeze([...record.extensions]) });
}

/** The MIME key of a MIME type or Content-Type header: lowercase, without whitespace or parameters. */
function readMimeType(contentType: unknown): string | undefined {
    if (typeof contentType !== 'string') {
        return undefined;
    }

    const [type] = contentType.trim().split(/[;\s]/, 1);

    return type ? type.toLowerCase() : undefined;
}

/** The lowercase extension of a bare or dotted extension, file name or path. */
function readExtension(path: unknown): string | undefined {
    if (typeof path !== 'string') {
        return undefined;
    }

    const separator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    const name = path.slice(separator + 1);
    const dot = name.lastIndexOf('.');

    if (dot <= 0 && separator !== -1) {
        return undefined;
    }

    return name.slice(dot + 1).toLowerCase() || undefined;
}

/** The extension of a definition entry, which must read back unchanged apart from one leading dot. */
function parseDeclaredExtension(input: unknown): string | undefined {
    if (typeof input !== 'string') {
        return undefined;
    }

    const bare = input.startsWith('.') ? input.slice(1) : input;

    if (bare.startsWith('*') || /\s/.test(bare)) {
        return undefined;
    }

    const extension = readExtension(input);

    return extension === bare.toLowerCase() ? extension : undefined;
}
