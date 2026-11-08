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
        let extension = mime.getExtension('application/json');

        expect(extension).toEqual('json');

        extension = mime.getExtension('text/plain');
        expect(extension).toEqual('txt');

        extension = mime.getExtension('text/html; charset=utf8');
        expect(extension).toEqual('html');
    });

    it('should not get extension', () => {
        const extension = new MimeExplorer(db).getExtension('json');

        expect(extension).toBeUndefined();
    });

    it('should get type', () => {
        const mime = new MimeExplorer(db);
        let type = mime.getType('.json');

        expect(type).toEqual('application/json');

        type = mime.getType('xxx/foo.json');
        expect(type).toEqual('application/json');

        type = mime.getType('xxx\\foo.json');
        expect(type).toEqual('application/json');

        type = mime.getType('txt');
        expect(type).toEqual('text/plain');
    });

    it('should not get type', () => {
        const type = new MimeExplorer(db).getType('foo');

        expect(type).toBeUndefined();
    });

    it('should define/undefine type', () => {
        const mime = new MimeExplorer();
        mime.register({ 'foo/bar': ['foo'] });

        let type = mime.getType('foo');

        expect(type).toEqual('foo/bar');

        mime.unregister('foo/bar');

        type = mime.getType('foo');
        expect(type).toBeUndefined();
        expect(mime.getMeta('foo/bar')).toBeUndefined();
    });
});

it('accepts explicitly undefined extensions in a partial type map', () => {
    const mime = new MimeExplorer();
    expect(() => mime.register({ 'application/x-empty-test': { extensions: undefined } })).not.toThrow();
    expect(mime.getMeta('application/x-empty-test')).toBeUndefined();
});

it.each([
    ['js', 'application/javascript'],
    ['mp4', 'application/mp4'],
    ['exe', 'application/octet-stream'],
])('preserves the first bundled mapping for %s', (extension, type) => {
    expect(new MimeExplorer(db).getType(extension)).toBe(type);
});

it('keeps the first metadata and extension owners while adding new aliases', () => {
    const mime = new MimeExplorer({
        'application/x-first': { extensions: ['shared', 'first'], charset: 'UTF-8' },
        'application/x-second': ['shared', 'second'],
    });

    mime.register({ 'APPLICATION/X-FIRST': { extensions: ['NEW'], charset: 'ASCII' } });

    expect(mime.getMeta('application/x-first')).toEqual({
        extensions: ['shared', 'first', 'new'], charset: 'UTF-8',
    });
    expect(mime.getType('shared')).toBe('application/x-first');
    expect(mime.getType('new')).toBe('application/x-first');
    expect(mime.getType('second')).toBe('application/x-second');
});

it('removes all owned aliases and preserves other types', () => {
    const mime = new MimeExplorer({
        'application/x-first': ['shared', 'first'],
        'application/x-second': ['shared', 'second'],
    });
    mime.register({ 'application/x-first': ['alias'] });

    mime.unregister('APPLICATION/X-FIRST');

    expect(mime.getMeta('application/x-first')).toBeUndefined();
    expect(mime.getType('shared')).toBeUndefined();
    expect(mime.getType('first')).toBeUndefined();
    expect(mime.getType('alias')).toBeUndefined();
    expect(mime.getType('second')).toBe('application/x-second');
    expect(() => mime.unregister('application/x-missing')).not.toThrow();
});

it('returns read-only records so callers cannot change the registry', () => {
    const mime = new MimeExplorer({ 'application/x-a': { extensions: ['aaa'], charset: 'UTF-8' } });
    const record = mime.getMeta('application/x-a') as { charset: string, extensions: string[] };

    expect(() => { record.charset = 'ASCII'; }).toThrow(TypeError);
    expect(() => { record.extensions[0] = 'bbb'; }).toThrow(TypeError);
    expect(() => record.extensions.push('bbb')).toThrow(TypeError);

    expect(mime.getMeta('application/x-a')).toEqual({ extensions: ['aaa'], charset: 'UTF-8' });
    expect(mime.getExtension('application/x-a')).toBe('aaa');
});

it('does not expose registry state on the instance', () => {
    expect(Object.keys(new MimeExplorer({ 'application/x-a': ['aaa'] }))).toEqual([]);
});

it('copies definitions so later input changes do not reach the registry', () => {
    const extensions = ['aaa'];
    const mime = new MimeExplorer({ 'application/x-a': extensions });

    extensions[0] = 'bbb';

    expect(mime.getExtension('application/x-a')).toBe('aaa');
});

it('keeps a returned record unchanged when an alias is registered later', () => {
    const mime = new MimeExplorer({ 'application/x-a': ['aaa'] });
    const before = mime.getMeta('application/x-a');

    mime.register({ 'application/x-a': ['alias'] });

    expect(before?.extensions).toEqual(['aaa']);
    expect(mime.getMeta('application/x-a')?.extensions).toEqual(['aaa', 'alias']);
    expect(mime.getType('alias')).toBe('application/x-a');
});

it('lists each extension once', () => {
    const mime = new MimeExplorer({ 'application/x-a': ['aaa', 'AAA'] });
    mime.register({ 'application/x-a': ['aaa'] });

    expect(mime.getMeta('application/x-a')?.extensions).toEqual(['aaa']);
});

it('reports whether unregister removed a record', () => {
    const mime = new MimeExplorer({ 'application/x-a': ['aaa'] });

    expect(mime.unregister('application/x-missing')).toBe(false);
    expect(mime.unregister('application/x-a')).toBe(true);
    expect(mime.unregister('application/x-a')).toBe(false);
});

it.each([
    ['text/x; charset=utf8', 'text/x'],
    [' text/y', 'text/y'],
    ['TEXT/Z ignored', 'text/z'],
])('finds a type registered as %j under the same rule as lookups', (input, type) => {
    const mime = new MimeExplorer();
    mime.register({ [input]: ['ext'] });

    expect(mime.getMeta(input)).toEqual({ extensions: ['ext'] });
    expect(mime.getMeta(type)).toEqual({ extensions: ['ext'] });
    expect(mime.getType('ext')).toBe(type);
    expect(mime.unregister(input)).toBe(true);
    expect(mime.getType('ext')).toBeUndefined();
});

it('removes a type named by a Content-Type header', () => {
    const mime = new MimeExplorer({ 'text/x': ['ext'] });

    expect(mime.unregister('  TEXT/X; charset=utf8')).toBe(true);
});

it('accepts a leading dot on a registered extension', () => {
    const mime = new MimeExplorer({ 'application/x-a': ['.DOT'] });

    expect(mime.getType('dot')).toBe('application/x-a');
    expect(mime.getType('.dot')).toBe('application/x-a');
    expect(mime.getType('file.dot')).toBe('application/x-a');
    expect(mime.getExtension('application/x-a')).toBe('dot');
});

it.each(['*marked', 'tar.gz', 'a/b', 'a\\b', '', '.', '..x'])('skips the unusable extension %j', (extension) => {
    const mime = new MimeExplorer({
        'application/x-only': [extension],
        'application/x-mixed': [extension, 'good'],
    });

    expect(mime.getMeta('application/x-only')).toBeUndefined();
    expect(mime.getMeta('application/x-mixed')).toEqual({ extensions: ['good'] });
});

it.each(['', ' ', '; charset=utf8'])('skips the unusable MIME key %j', (key) => {
    const mime = new MimeExplorer({ [key]: ['ext'] });

    expect(mime.getType('ext')).toBeUndefined();
});

it('starts empty and keeps instances independent', () => {
    const first = new MimeExplorer();
    const second = new MimeExplorer();
    first.register({ 'application/x-custom': ['CUSTOM'] });

    expect(first.getType('custom')).toBe('application/x-custom');
    expect(second.getType('custom')).toBeUndefined();
    expect(second.getType('json')).toBeUndefined();
});

it('normalizes MIME headers and ignores definitions with neither extensions nor metadata', () => {
    const mime = new MimeExplorer({ 'text/x-custom': { extensions: ['custom'], charset: 'UTF-8' } });
    mime.register({
        'application/x-missing': { extensions: undefined },
        'application/x-empty': [],
    });

    expect(mime.getMeta('  TEXT/X-CUSTOM; charset=ASCII')?.charset).toBe('UTF-8');
    expect(mime.getMeta(' ')).toBeUndefined();
    expect(mime.getMeta('application/x-missing')).toBeUndefined();
    expect(mime.getMeta('application/x-empty')).toBeUndefined();
});

it.each(['/uploads/json', '/uploads/.json', 'unknown-extension'])('does not find a type for %s', (input) => {
    expect(new MimeExplorer(db).getType(input)).toBeUndefined();
});

it.each(['constructor', '__proto__', 'hasOwnProperty'])('does not resolve an unregistered object key: %s', (key) => {
    const mime = new MimeExplorer();

    expect(mime.getMeta(key)).toBeUndefined();
    expect(mime.getExtension(key)).toBeUndefined();
    expect(mime.getType(key)).toBeUndefined();
});

it.each([
    ['constructor', 'constructor'],
    ['__proto__', '__proto__'],
    ['hasOwnProperty', 'hasownproperty'],
])('registers and removes a computed object key: %s', (key, normalized) => {
    const mime = new MimeExplorer({ [key]: { extensions: [key], charset: 'UTF-8' } });
    mime.register({ [key.toUpperCase()]: { extensions: ['alias'], charset: 'ASCII' } });
    mime.register({ 'application/x-other': [key, 'other'] });

    expect(mime.getMeta(key)).toEqual({ extensions: [normalized, 'alias'], charset: 'UTF-8' });
    expect(mime.getType(key)).toBe(normalized);
    expect(mime.getType('alias')).toBe(normalized);

    mime.unregister(key.toUpperCase());

    expect(mime.getMeta(key)).toBeUndefined();
    expect(mime.getType(key)).toBeUndefined();
    expect(mime.getType('alias')).toBeUndefined();
    expect(mime.getType('other')).toBe('application/x-other');
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
    expect(new MimeExplorer(db).getType(input)).toBe(type);
});

it('distinguishes Unicode extensions from paths when lowercasing expands a character', () => {
    const mime = new MimeExplorer({ 'application/x-unicode': ['i\u0307'] });

    expect(mime.getType('.İ')).toBe('application/x-unicode');
    expect(mime.getType('/.İ')).toBeUndefined();
    expect(mime.getType('/İ')).toBeUndefined();
});

it.each(['Σ', 'σ'])('normalizes the extracted extension consistently with registration: %s', (extension) => {
    const mime = new MimeExplorer({ 'application/x-sigma': [extension] });

    expect(mime.getType('Σ')).toBe('application/x-sigma');
    expect(mime.getType('.Σ')).toBe('application/x-sigma');
    expect(mime.getType('a.Σ')).toBe('application/x-sigma');
    expect(mime.getType('/uploads/a.Σ')).toBe('application/x-sigma');
    expect(mime.getType('C:\\uploads\\a.Σ')).toBe('application/x-sigma');
});

it('keeps ordinary and final Greek sigma extension owners independent', () => {
    const mime = new MimeExplorer({
        'application/x-sigma': ['σ'],
        'application/x-final-sigma': ['ς'],
    });

    expect(mime.getType('a.Σ')).toBe('application/x-sigma');
    expect(mime.getType('a.ς')).toBe('application/x-final-sigma');
});

it('resolves a literal final Greek sigma without an uppercase sigma alias', () => {
    const mime = new MimeExplorer({ 'application/x-final-sigma': ['ς'] });

    expect(mime.getType('a.ς')).toBe('application/x-final-sigma');
    expect(mime.getType('a.Σ')).toBeUndefined();
});

it.each([
    [' \tAPPLICATION/JSON; charset=ASCII', 'json'],
    ['application/json ignored-text', 'json'],
    ['', undefined],
    [' ; charset=UTF-8', undefined],
    ['application/x-unknown-demo; charset=UTF-8', undefined],
])('normalizes the MIME header %j', (header, extension) => {
    expect(new MimeExplorer(db).getExtension(header)).toBe(extension);
});
