/*
 * Copyright (c) 2023-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { TypeMap, TypeMeta } from './type';
import db from './db.json';

const map : Record<string, TypeMeta> = {};
const extensionMap : Record<string, string> = {};

/**
 * Define meta information/extensions for a mime type.
 *
 * @param key
 * @param value
 */
export function define(key: string, value: string[] | TypeMeta) {
    let meta : TypeMeta = {
        extensions: [],
    };

    if (Array.isArray(value)) {
        meta.extensions = value;
    } else {
        meta = {
            ...meta,
            ...value,
        };
    }

    if (meta.extensions.length === 0) {
        return;
    }

    meta.extensions = meta.extensions.map((t) => t.toLowerCase());

    key = key.toLowerCase();

    for (let j = 0; j < meta.extensions.length; j++) {
        const ext = meta.extensions[j] as string;

        if (!Object.prototype.hasOwnProperty.call(extensionMap, ext)) {
            extensionMap[ext] = key;
        }
    }

    // Use first extension as default
    if (!Object.prototype.hasOwnProperty.call(map, key)) {
        map[key] = meta;
    }
}

/**
 * Remove meta information.
 *
 * @param input
 */
export function undefine(input: string) {
    if (!Object.prototype.hasOwnProperty.call(map, input)) {
        return;
    }

    delete map[input];

    const keys = Object.keys(extensionMap);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i] as string;

        if (extensionMap[key] === input) {
            delete extensionMap[key];
        }
    }
}

/**
 * Define multiple mime type -> extension/meta mappings.
 *
 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
 */
export function defineMany(typeMap: TypeMap) {
    const keys : string[] = Object.keys(typeMap);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key) {
            define(key, typeMap[key] as string[] | TypeMeta);
        }
    }
}

/**
 * Lookup a mime type based on extension
 *
 * @param input
 */
export function getType(input: string) : string | undefined {
    const last = input.replace(/^.*[/\\]/, '').toLowerCase();
    const ext = last.replace(/^.*\./, '').toLowerCase();

    const hasPath = last.length < input.length;
    const hasDot = ext.length < last.length - 1;

    if (hasDot || !hasPath) {
        return extensionMap[ext];
    }

    return undefined;
}

/**
 * Get the file extension associated with a mime type.
 *
 * @param input
 */
export function getExtension(input: string) : string | undefined {
    const meta = get(input);
    if (meta) {
        const ext = meta.extensions[0] as string;
        return (ext[0] !== '*') ? ext : ext.slice(1);
    }

    return undefined;
}

/**
 * Get metae information associated with a mime type.
 *
 * @param input
 */
export function get(input: string) : TypeMeta | undefined {
    const type = /^\s*([^;\s]*)/.test(input) && RegExp.$1;
    if (!type) {
        return undefined;
    }

    return map[type.toLowerCase()];
}

defineMany(db);
