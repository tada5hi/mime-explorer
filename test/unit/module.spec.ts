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

    mime.undefineType('application/x-first');

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
