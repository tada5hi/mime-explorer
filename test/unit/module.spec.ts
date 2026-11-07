/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { describe, expect, it } from 'vitest';

import { MimeExplorer } from '../../src';
import db from '../../src/db';

describe('src/module.ts', () => {
    it('should get extension', () => {
        const mime = new MimeExplorer(db);
        let extension = mime.getExtensionByType('application/json');

        expect(extension).toEqual('json');

        extension = mime.getExtensionByType('text/plain');
        expect(extension).toEqual('txt');

        extension = mime.getExtensionByType('text/html; charset=utf8');
        expect(extension).toEqual('html');
    });

    it('should not get extension', () => {
        const extension = new MimeExplorer(db).getExtensionByType('json');

        expect(extension).toBeUndefined();
    });

    it('should get type', () => {
        const mime = new MimeExplorer(db);
        let type = mime.getTypeByExtension('.json');

        expect(type).toEqual('application/json');

        type = mime.getTypeByExtension('xxx/foo.json');
        expect(type).toEqual('application/json');

        type = mime.getTypeByExtension('xxx\\foo.json');
        expect(type).toEqual('application/json');

        type = mime.getTypeByExtension('txt');
        expect(type).toEqual('text/plain');
    });

    it('should not get type', () => {
        const type = new MimeExplorer(db).getTypeByExtension('foo');

        expect(type).toBeUndefined();
    });

    it('should define/undefine type', () => {
        const mime = new MimeExplorer();
        mime.defineType('foo/bar', ['foo']);

        let type = mime.getTypeByExtension('foo');

        expect(type).toEqual('foo/bar');

        mime.undefineType('foo/bar');

        type = mime.getTypeByExtension('foo');
        expect(type).toBeUndefined();
        expect(mime.getMetaByType('foo/bar')).toBeUndefined();
    });
});

it('accepts explicitly undefined extensions in a partial type map', () => {
    const mime = new MimeExplorer();
    expect(() => mime.defineTypes({ 'application/x-empty-test': { extensions: undefined } })).not.toThrow();
    expect(mime.getMetaByType('application/x-empty-test')).toBeUndefined();
});

it.each([
    ['js', 'application/javascript'],
    ['mp4', 'application/mp4'],
    ['exe', 'application/octet-stream'],
])('preserves the first bundled mapping for %s', (extension, type) => {
    expect(new MimeExplorer(db).getTypeByExtension(extension)).toBe(type);
});

it('keeps the first metadata and extension owners while adding new aliases', () => {
    const mime = new MimeExplorer({
        'application/x-first': { extensions: ['shared', 'first'], charset: 'UTF-8' },
        'application/x-second': ['shared', 'second'],
    });

    mime.defineType('APPLICATION/X-FIRST', { extensions: ['NEW'], charset: 'ASCII' });

    expect(mime.getMetaByType('application/x-first')).toEqual({
        extensions: ['shared', 'first'], charset: 'UTF-8',
    });
    expect(mime.getTypeByExtension('shared')).toBe('application/x-first');
    expect(mime.getTypeByExtension('new')).toBe('application/x-first');
    expect(mime.getTypeByExtension('second')).toBe('application/x-second');
});

it('removes all owned aliases and preserves other types', () => {
    const mime = new MimeExplorer({
        'application/x-first': ['shared', 'first'],
        'application/x-second': ['shared', 'second'],
    });
    mime.defineType('application/x-first', ['alias']);

    mime.undefineType('APPLICATION/X-FIRST');

    expect(mime.getMetaByType('application/x-first')).toBeUndefined();
    expect(mime.getTypeByExtension('shared')).toBeUndefined();
    expect(mime.getTypeByExtension('first')).toBeUndefined();
    expect(mime.getTypeByExtension('alias')).toBeUndefined();
    expect(mime.getTypeByExtension('second')).toBe('application/x-second');
    expect(() => mime.undefineType('application/x-missing')).not.toThrow();
});

it('strips a leading marker from the default extension', () => {
    const mime = new MimeExplorer({ 'application/x-marked': ['*marked'] });

    expect(mime.getExtensionByType('application/x-marked')).toBe('marked');
});

it('starts empty and keeps instances independent', () => {
    const first = new MimeExplorer();
    const second = new MimeExplorer();
    first.defineType('application/x-custom', ['CUSTOM']);

    expect(first.getTypeByExtension('custom')).toBe('application/x-custom');
    expect(second.getTypeByExtension('custom')).toBeUndefined();
    expect(second.getTypeByExtension('json')).toBeUndefined();
});

it('normalizes MIME headers and ignores definitions without extensions', () => {
    const mime = new MimeExplorer({ 'text/x-custom': { extensions: ['custom'], charset: 'UTF-8' } });
    mime.defineTypes({
        'application/x-missing': { charset: 'UTF-8' },
        'application/x-empty': [],
    });

    expect(mime.getMetaByType('  TEXT/X-CUSTOM; charset=ASCII')?.charset).toBe('UTF-8');
    expect(mime.getMetaByType(' ')).toBeUndefined();
    expect(mime.getMetaByType('application/x-missing')).toBeUndefined();
    expect(mime.getMetaByType('application/x-empty')).toBeUndefined();
});

it.each(['/uploads/json', '/uploads/.json', 'unknown-extension'])('does not find a type for %s', (input) => {
    expect(new MimeExplorer(db).getTypeByExtension(input)).toBeUndefined();
});

it.each(['constructor', '__proto__', 'hasOwnProperty'])('does not resolve an unregistered object key: %s', (key) => {
    const mime = new MimeExplorer();

    expect(mime.getMetaByType(key)).toBeUndefined();
    expect(mime.getExtensionByType(key)).toBeUndefined();
    expect(mime.getTypeByExtension(key)).toBeUndefined();
});

it.each([
    ['constructor', 'constructor'],
    ['__proto__', '__proto__'],
    ['hasOwnProperty', 'hasownproperty'],
])('registers and removes a computed object key: %s', (key, normalized) => {
    const mime = new MimeExplorer({ [key]: { extensions: [key], charset: 'UTF-8' } });
    mime.defineType(key.toUpperCase(), { extensions: ['alias'], charset: 'ASCII' });
    mime.defineType('application/x-other', [key, 'other']);

    expect(mime.getMetaByType(key)).toEqual({ extensions: [normalized], charset: 'UTF-8' });
    expect(mime.getTypeByExtension(key)).toBe(normalized);
    expect(mime.getTypeByExtension('alias')).toBe(normalized);

    mime.undefineType(key.toUpperCase());

    expect(mime.getMetaByType(key)).toBeUndefined();
    expect(mime.getTypeByExtension(key)).toBeUndefined();
    expect(mime.getTypeByExtension('alias')).toBeUndefined();
    expect(mime.getTypeByExtension('other')).toBe('application/x-other');
});

it.each([
    ['.JSON', 'application/json'],
    ['/uploads/report.final.JSON', 'application/json'],
    ['C:\\uploads\\report.final.JSON', 'application/json'],
    ['/a\nb.json', 'application/json'],
    ['/uploads/json', undefined],
    ['/uploads/.json', undefined],
    ['/uploads/', undefined],
    ['C:\\uploads\\', undefined],
    ['report.unknown-extension', undefined],
    ['report.json?download=1', undefined],
    ['report.json#section', undefined],
])('uses the final path segment and suffix for %j', (input, type) => {
    expect(new MimeExplorer(db).getTypeByExtension(input)).toBe(type);
});

it('distinguishes Unicode extensions from paths when lowercasing expands a character', () => {
    const mime = new MimeExplorer({ 'application/x-unicode': ['i\u0307'] });

    expect(mime.getTypeByExtension('.İ')).toBe('application/x-unicode');
    expect(mime.getTypeByExtension('/.İ')).toBeUndefined();
    expect(mime.getTypeByExtension('/İ')).toBeUndefined();
});

it('lowercases the whole basename to preserve contextual Greek sigma', () => {
    const mime = new MimeExplorer({ 'application/x-sigma': ['ς'] });

    expect(mime.getTypeByExtension('a.Σ')).toBe('application/x-sigma');
    expect(mime.getTypeByExtension('/uploads/a.Σ')).toBe('application/x-sigma');
});

it.each([
    [' \tAPPLICATION/JSON; charset=ASCII', 'json'],
    ['application/json ignored-text', 'json'],
    ['', undefined],
    [' ; charset=UTF-8', undefined],
    ['application/x-unknown-demo; charset=UTF-8', undefined],
])('normalizes the MIME header %j', (header, extension) => {
    expect(new MimeExplorer(db).getExtensionByType(header)).toBe(extension);
});
