/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export type TypeMap = Record<string, string[] | TypeMetaInput>;

export type TypeMeta = {
    source?: string,
    extensions: string[],
    charset?: string,
    compressible?: boolean,
};

export type TypeMetaInput = Partial<TypeMeta>;
