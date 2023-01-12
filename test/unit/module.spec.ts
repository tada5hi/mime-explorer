/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {define, getExtension, getType, undefine} from "../../src";

describe('src/module.ts', () => {
    it('should get extension', () => {
        let extension = getExtension('application/json');
        expect(extension).toEqual('json');

        extension = getExtension('text/plain');
        expect(extension).toEqual('txt');

        extension = getExtension('text/html; charset=utf8');
        expect(extension).toEqual('html');
    });

    it('should not get extension', () => {
        const extension = getExtension('json');

        expect(extension).toBeUndefined();
    })

    it('should get type', () => {
        let type = getType('.json');
        expect(type).toEqual('application/json');

        type = getType('xxx/foo.json');
        expect(type).toEqual('application/json');

        type = getType('xxx\\foo.json');
        expect(type).toEqual('application/json');

        type = getType('txt');
        expect(type).toEqual('text/plain');
    })

    it('should not get type', () => {
        const type = getType('foo');

        expect(type).toBeUndefined();
    })

    it('should define/undefine type', () => {
        define('foo/bar', ['foo']);

        let type = getType('foo');
        expect(type).toEqual('foo/bar');

        undefine('foo/bar');

        type = getType('foo');
        expect(type).toBeUndefined();
    })
})
