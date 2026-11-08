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
import type { TypeMetaCollection } from '../../src';
import db from '../../src/db';

describe('register() failures', () => {
    const seed = { 'text/plain': { extensions: ['txt'], charset: 'UTF-8' } };

    it.each([
        ['invalid MIME key', { ' ; a=b': ['ext'] }, InvalidTypeError, 'INVALID_TYPE_ERROR', { type: ' ; a=b' }],
        ['no extensions', { 'x/a': [] }, MissingExtensionsError, 'MISSING_EXTENSIONS_ERROR', { type: 'x/a' }],
        ['undefined extensions', { 'x/a': { charset: 'UTF-8' } }, MissingExtensionsError, 'MISSING_EXTENSIONS_ERROR', { type: 'x/a' }],
        ['invalid extension', { 'x/a': ['*bad'] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: '*bad' }],
        ['multi-part extension', { 'x/a': ['tar.gz'] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: 'tar.gz' }],
        ['marker after the leading dot', { 'x/a': ['.*bad'] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: '.*bad' }],
        ['whitespace in an extension', { 'x/a': [' txt '] }, InvalidExtensionError, 'INVALID_EXTENSION_ERROR', { type: 'x/a', extension: ' txt ' }],
        ['owned extension', { 'x/a': ['TXT'] }, ExtensionConflictError, 'EXTENSION_CONFLICT_ERROR', { type: 'x/a', extension: 'txt', owner: 'text/plain' }],
        ['different metadata', { 'TEXT/PLAIN': { extensions: ['txt'], charset: 'ASCII' } }, MetadataConflictError, 'METADATA_CONFLICT_ERROR', { type: 'text/plain' }],
    ])('returns a typed error for %s', (_label, definitions, errorClass, code, fields) => {
        const errors = new MimeExplorer(seed).register(definitions);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(errorClass);
        expect(errors[0]).toBeInstanceOf(MimeExplorerError);
        expect(errors[0]).toBeInstanceOf(BaseError);
        expect(errors[0]).toMatchObject({ code, ...fields });
    });

    it('applies everything it can by default', () => {
        const mime = new MimeExplorer({ 'text/plain': ['txt'] });

        mime.register({ 'x/note': ['txt', 'note'], 'x/other': ['other'] });

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

    it('returns no errors when everything applies or repeats', () => {
        const mime = new MimeExplorer(seed);

        expect(mime.register({ 'x/a': ['aaa'] })).toEqual([]);
        expect(mime.register({ 'x/a': ['aaa', 'alias'] })).toEqual([]);
        expect(mime.register({ 'text/plain': { extensions: ['txt'], charset: 'UTF-8' } })).toEqual([]);
        expect(mime.register({ 'text/plain': { extensions: ['txt'], charset: undefined } })).toEqual([]);
    });

    it('detects conflicts inside one batch', () => {
        const errors = new MimeExplorer().register({ 'x/a': ['same'], 'x/b': ['same'] });

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

        expect(mime.register({ 'x/a': ['aaa'] }, { throwOnFailure: true })).toEqual([]);
        expect(mime.getType('aaa')).toBe('x/a');
    });
});

describe('malformed input from untyped callers', () => {
    it.each([
        [null], [undefined], [1], ['txt'], [{ extensions: 'txt' }],
    ])('reports a definition of %j as having no extensions', (value) => {
        const definitions = { 'x/a': value } as unknown as TypeMetaCollection;

        expect(new MimeExplorer(definitions).getMeta('x/a')).toBeUndefined();
        expect(new MimeExplorer().register(definitions)[0]).toBeInstanceOf(MissingExtensionsError);
    });

    it('reports non-string extensions and applies the rest', () => {
        const definitions = { 'x/a': [1, null, 'good'] } as unknown as TypeMetaCollection;
        const mime = new MimeExplorer();
        const errors = mime.register(definitions);

        expect(errors).toHaveLength(2);
        expect(errors[0]).toBeInstanceOf(InvalidExtensionError);
        expect(errors[0]).toMatchObject({ extension: '1' });
        expect(mime.getMeta('x/a')).toEqual({ extensions: ['good'] });
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

describe('constructor', () => {
    it('loads the imperfect bundled database without throwing', () => {
        expect(() => new MimeExplorer(db)).not.toThrow();
        expect(new MimeExplorer(db).getType('json')).toBe('application/json');
    });

    it('leaves strict validation of the bundled database to register()', () => {
        expect(() => new MimeExplorer().register(db, { throwOnFailure: true })).toThrow(RegistrationError);
    });
});
