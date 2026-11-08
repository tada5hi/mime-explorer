import { BaseError } from '@ebec/core';
import { describe, expect, it } from 'vitest';

import {
    ExtensionConflictError,
    InvalidExtensionError,
    InvalidTypeError,
    MetadataConflictError,
    MimeExplorer,
    MimeExplorerError,
    MissingExtensionsError,
    RegistrationError,
} from '../../src';
import type { TypeMeta, TypeMetaCollection, TypeMetaInput } from '../../src';
import db from '../../src/db';

function failuresOf(mime: MimeExplorer, definitions: TypeMetaCollection): readonly MimeExplorerError[] {
    try {
        mime.register(definitions, { throwOnFailure: true });
    } catch (error) {
        return (error as RegistrationError).errors;
    }

    return [];
}

describe('register() failures', () => {
    const seed = { 'text/plain': { extensions: ['txt'], charset: 'UTF-8' } };

    it.each([
        ['invalid MIME key', { ' ; a=b': ['ext'] }, InvalidTypeError, 'INVALID_TYPE_ERROR', { type: ' ; a=b' }],
        ['no extensions', { 'x/a': [] }, MissingExtensionsError, 'MISSING_EXTENSIONS_ERROR', { type: 'x/a' }],
        ['undefined extensions', { 'x/a': { extensions: undefined } }, MissingExtensionsError, 'MISSING_EXTENSIONS_ERROR', { type: 'x/a' }],
        ['invalid extension', { 'x/a': ['*bad'] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: '*bad' }],
        ['multi-part extension', { 'x/a': ['tar.gz'] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: 'tar.gz' }],
        ['marker after the leading dot', { 'x/a': ['.*bad'] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: '.*bad' }],
        ['whitespace in an extension', { 'x/a': [' txt '] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: ' txt ' }],
        ['owned extension', { 'x/a': ['TXT'] }, ExtensionConflictError, 'EXTENSION_CONFLICT_ERROR', { type: 'x/a', extension: 'txt', owner: 'text/plain' }],
        ['different metadata', { 'TEXT/PLAIN': { extensions: ['txt'], charset: 'ASCII' } }, MetadataConflictError, 'METADATA_CONFLICT_ERROR', { type: 'text/plain' }],
    ])('returns a typed error for %s', (_label, definitions, errorClass, code, fields) => {
        const errors = failuresOf(new MimeExplorer(seed), definitions);

        expect(new MimeExplorer(seed).register(definitions)).toBe(false);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(errorClass);
        expect(errors[0]).toBeInstanceOf(MimeExplorerError);
        expect(errors[0]).toBeInstanceOf(BaseError);
        expect(errors[0]).toMatchObject({ code, ...fields });
    });

    it('applies everything it can by default', () => {
        const mime = new MimeExplorer({ 'text/plain': ['txt'] });

        expect(mime.register({ 'x/note': ['txt', 'note'], 'x/other': ['other'] })).toBe(false);

        expect(mime.getType('txt')).toBe('text/plain');
        expect(mime.getType('note')).toBe('x/note');
        expect(mime.getType('other')).toBe('x/other');
        expect(mime.getExtension('x/note')).toBe('txt');
    });

    it('keeps the first metadata when metadata differs', () => {
        const mime = new MimeExplorer(seed);

        mime.register({ 'text/plain': { extensions: ['text'], charset: 'ASCII' } });

        expect(mime.getMeta('text/plain')).toEqual({ extensions: ['txt', 'text'], charset: 'UTF-8' });
    });

    it('returns true when everything applies or repeats', () => {
        const mime = new MimeExplorer(seed);

        expect(mime.register({ 'x/a': ['aaa'] })).toBe(true);
        expect(mime.register({ 'x/a': ['aaa', 'alias'] })).toBe(true);
        expect(mime.register({ 'text/plain': { extensions: ['txt'], charset: 'UTF-8' } })).toBe(true);
        expect(mime.register({ 'text/plain': { extensions: ['txt'], charset: undefined } })).toBe(true);
    });

    it.each([
        ['invalid extensions', { extensions: ['*bad'], charset: 'ASCII' }, InvalidExtensionError],
        ['malformed extensions', { extensions: 'txt', charset: 'ASCII' } as unknown as TypeMetaInput, MissingExtensionsError],
    ])('reports a metadata conflict alongside %s', (_label, definition, errorClass) => {
        const errors = failuresOf(new MimeExplorer(seed), { 'text/plain': definition });

        expect(new MimeExplorer(seed).register({ 'text/plain': definition })).toBe(false);
        expect(errors).toHaveLength(2);
        expect(errors.some((error) => error instanceof MetadataConflictError)).toBe(true);
        expect(errors.some((error) => error instanceof errorClass)).toBe(true);
    });

    it('detects conflicts inside one batch', () => {
        const errors = failuresOf(new MimeExplorer(), { 'x/a': ['same'], 'x/b': ['same'] });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatchObject({ type: 'x/b', extension: 'same', owner: 'x/a' });
    });
});

describe('register() with throwOnFailure', () => {
    it('throws one error carrying every failure', () => {
        const mime = new MimeExplorer({ 'text/plain': ['txt'] });

        let thrown: unknown;
        try {
            mime.register({ 'x/a': ['txt'], 'x/b': ['*bad'] }, { throwOnFailure: true });
        } catch (error) {
            thrown = error;
        }

        expect(thrown).toBeInstanceOf(RegistrationError);
        expect(thrown).toBeInstanceOf(MimeExplorerError);
        expect(thrown).toMatchObject({ code: 'REGISTRATION_ERROR' });

        const { errors } = thrown as RegistrationError;
        expect(errors[0]).toBeInstanceOf(ExtensionConflictError);
        expect(errors[1]).toBeInstanceOf(InvalidExtensionError);
        expect((thrown as RegistrationError).message).toContain('txt');
        expect((thrown as RegistrationError).message).toContain('*bad');
    });

    it('applies nothing when anything fails', () => {
        const mime = new MimeExplorer({ 'text/plain': ['txt'] });

        expect(() => mime.register({ 'x/good': ['good'], 'x/bad': ['txt'] }, { throwOnFailure: true }))
            .toThrow(RegistrationError);

        expect(mime.getType('good')).toBeUndefined();
        expect(mime.getMeta('x/good')).toBeUndefined();
    });

    it('registers normally when nothing fails', () => {
        const mime = new MimeExplorer();

        expect(mime.register({ 'x/a': ['aaa'] }, { throwOnFailure: true })).toBe(true);
        expect(mime.getType('aaa')).toBe('x/a');
    });
});

describe('malformed input from untyped callers', () => {
    it.each([
        [null],
        [undefined],
        [1],
        ['txt'],
        [{ extensions: 'txt' }],
        [{ extensions: 'txt', charset: 'UTF-8' }],
        [{ extensions: null, charset: 'UTF-8' }],
        [{}],
        [{ extension: ['txt'] }],
        [{ extension: ['txt'], charset: 'UTF-8' }],
        [{ charset: undefined }],
        [{ charset: null }],
        [{ charset: 1 }],
        [{ source: 1 }],
        [{ compressible: 'yes' }],
        [Object.create({ charset: 'UTF-8' })],
    ])('reports a definition of %j as having no extensions', (value) => {
        const definitions = { 'x/a': value } as unknown as TypeMetaCollection;

        expect(new MimeExplorer(definitions).getMeta('x/a')).toBeUndefined();
        expect(new MimeExplorer().register(definitions)).toBe(false);
        expect(failuresOf(new MimeExplorer(), definitions)[0]).toBeInstanceOf(MissingExtensionsError);
    });

    it('reports non-string extensions and applies the rest', () => {
        const definitions = { 'x/a': [1, null, 'good'] } as unknown as TypeMetaCollection;
        const mime = new MimeExplorer();
        const errors = failuresOf(new MimeExplorer(), definitions);

        expect(mime.register(definitions)).toBe(false);
        expect(errors).toHaveLength(2);
        expect(errors[0]).toBeInstanceOf(InvalidExtensionError);
        expect(errors[0]).toMatchObject({ extension: '1' });
        expect(mime.getMeta('x/a')).toEqual({ extensions: ['good'] });
    });

    it('reports an extension that cannot be converted to a string', () => {
        const definitions = JSON.parse('{ "x/a": [{ "toString": null }, "good"] }') as TypeMetaCollection;
        const mime = new MimeExplorer();
        const errors = failuresOf(new MimeExplorer(), definitions);

        expect(mime.register(definitions)).toBe(false);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(InvalidExtensionError);
        expect(errors[0]).toMatchObject({ extension: '[object Object]' });
        expect(mime.getType('good')).toBe('x/a');
    });

    it('treats null definitions as empty', () => {
        const definitions = JSON.parse('null') as TypeMetaCollection;

        expect(() => new MimeExplorer(definitions)).not.toThrow();
        expect(new MimeExplorer().register(definitions)).toBe(true);
    });

    it.each([[undefined], [null], [1]])('finds nothing for the input %j', (input) => {
        const mime = new MimeExplorer({ 'x/a': ['undefined', 'null', '1'] });
        const value = input as unknown as string;

        expect(mime.getMeta(value)).toBeUndefined();
        expect(mime.getExtension(value)).toBeUndefined();
        expect(mime.getType(value)).toBeUndefined();
        expect(mime.unregister(value)).toBe(false);
    });
});

describe('metadata-only definitions', () => {
    it.each([
        ['absent extensions', { charset: 'UTF-8' }],
        ['undefined extensions', { extensions: undefined, compressible: false }],
        ['empty extensions', { extensions: [], source: 'iana' }],
    ])('registers a record for %s', (_label, definition) => {
        const mime = new MimeExplorer();

        expect(mime.register({ 'X/A; a=b': definition })).toBe(true);
        expect(mime.getMeta('x/a')).toEqual({ ...definition, extensions: [] });
        expect(mime.getExtension('x/a')).toBeUndefined();
    });

    it.each([
        ['an empty charset', { charset: '' }],
        ['a false compressible', { compressible: false }],
        ['an undefined sibling field', { charset: 'UTF-8', source: undefined }],
    ])('treats %s as metadata', (_label, definition) => {
        expect(new MimeExplorer({ 'x/a': definition }).getMeta('x/a')).toEqual({ ...definition, extensions: [] });
    });

    it('freezes the record and its empty extensions', () => {
        const record = new MimeExplorer({ 'x/a': { charset: 'UTF-8' } }).getMeta('x/a') as TypeMeta;

        expect(Object.isFrozen(record)).toBe(true);
        expect(Object.isFrozen(record.extensions)).toBe(true);
    });

    it('keeps the first metadata-only record and reports a conflict', () => {
        const mime = new MimeExplorer({ 'x/a': { charset: 'UTF-8' } });
        const errors = failuresOf(mime, { 'x/a': { source: 'iana' } });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(MetadataConflictError);
        expect(mime.register({ 'x/a': { source: 'iana' } })).toBe(false);
        expect(mime.getMeta('x/a')).toEqual({ charset: 'UTF-8', extensions: [] });
    });

    it('removes a metadata-only record', () => {
        const mime = new MimeExplorer({ 'x/a': { charset: 'UTF-8' } });

        expect(mime.unregister('x/a')).toBe(true);
        expect(mime.getMeta('x/a')).toBeUndefined();
    });

    it('names the missing definition in its error', () => {
        expect(failuresOf(new MimeExplorer(), { 'x/a': [] })[0]?.message).toBe("'x/a' has no usable extensions or metadata.");
    });

    it('never resolves an extension to the record', () => {
        const mime = new MimeExplorer({ 'x/a': { charset: 'UTF-8' } });

        expect(mime.getType('a')).toBeUndefined();
        expect(mime.getType('')).toBeUndefined();
    });

    it('accepts its own record back unchanged', () => {
        const mime = new MimeExplorer({ 'x/a': { charset: 'UTF-8' } });

        expect(mime.register({ 'x/a': mime.getMeta('x/a') as TypeMetaInput }, { throwOnFailure: true })).toBe(true);
        expect(new MimeExplorer({ 'x/a': mime.getMeta('x/a') as TypeMetaInput }).getMeta('x/a')).toEqual(mime.getMeta('x/a'));
    });

    it('reports only the conflict when a known type gets different metadata', () => {
        const mime = new MimeExplorer({ 'x/a': { extensions: ['a'], charset: 'UTF-8' } });
        const errors = failuresOf(mime, { 'x/a': { charset: 'ASCII' } });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(MetadataConflictError);
        expect(mime.register({ 'x/a': { charset: 'ASCII' } })).toBe(false);
        expect(mime.getMeta('x/a')).toEqual({ extensions: ['a'], charset: 'UTF-8' });
    });

    it('keeps a known record when its metadata is repeated without extensions', () => {
        const mime = new MimeExplorer({ 'x/a': { extensions: ['a'], charset: 'UTF-8' } });

        expect(mime.register({ 'x/a': { charset: 'UTF-8' } }, { throwOnFailure: true })).toBe(true);
        expect(mime.getMeta('x/a')).toEqual({ extensions: ['a'], charset: 'UTF-8' });
        expect(mime.getType('a')).toBe('x/a');
    });

    it('lets extensions be added later and removes the record as usual', () => {
        const mime = new MimeExplorer({ 'x/a': { charset: 'UTF-8' } });

        expect(mime.register({ 'x/a': ['a', 'b'] })).toBe(true);
        expect(mime.getMeta('x/a')).toEqual({ extensions: ['a', 'b'], charset: 'UTF-8' });
        expect(mime.getExtension('x/a')).toBe('a');
        expect(mime.getType('b')).toBe('x/a');
        expect(mime.unregister('x/a')).toBe(true);
        expect(mime.getType('a')).toBeUndefined();
        expect(mime.getMeta('x/a')).toBeUndefined();
    });

    it('does not let an all-invalid extension list become a metadata-only record', () => {
        const mime = new MimeExplorer();

        expect(mime.register({ 'x/a': { extensions: ['*bad'], charset: 'UTF-8' } })).toBe(false);
        expect(mime.getMeta('x/a')).toBeUndefined();
    });

    it('exposes bundled types that only carry metadata', () => {
        const mime = new MimeExplorer(db);

        expect(mime.getMeta('application/vnd.api+json')).toEqual({ source: 'iana', compressible: true, extensions: [] });
        expect(mime.getExtension('application/vnd.api+json')).toBeUndefined();
    });
});

describe('constructor', () => {
    it('loads the imperfect bundled database without throwing', () => {
        expect(() => new MimeExplorer(db)).not.toThrow();
        expect(new MimeExplorer(db).getType('json')).toBe('application/json');
    });

    it('leaves strict validation of the bundled database to register()', () => {
        expect(() => new MimeExplorer().register(db, { throwOnFailure: true })).toThrow(RegistrationError);
    });
});
