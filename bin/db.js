/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

const fs = require('node:fs');
const mimeDb = require('mime-db');
const path = require("node:path");

// The registry gives a contested extension to the first type declaring it,
// so the order of the generated keys is the lookup precedence.
const SUBTYPE_SCORES = [['prs.', 100], ['x-', 200], ['x.', 300], ['vnd.', 400]];
const SOURCE_SCORES = { iana: 40, apache: 20, nginx: 10 };
const TOP_LEVEL_SCORES = { video: 3, font: 2, audio: 2, application: 1 };
const DEFAULT_SUBTYPE_SCORE = 900;
const DEFAULT_SOURCE_SCORE = 30;
const DEFAULT_TOP_LEVEL_SCORE = 0;

function score(type) {
    const [topLevel, subtype] = type.split('/');
    const [, subtypeScore = DEFAULT_SUBTYPE_SCORE] = SUBTYPE_SCORES.find(([prefix]) => subtype.startsWith(prefix)) || [];

    return subtypeScore + (SOURCE_SCORES[mimeDb[type].source] ?? DEFAULT_SOURCE_SCORE) + (TOP_LEVEL_SCORES[topLevel] ?? DEFAULT_TOP_LEVEL_SCORE);
}

function compareTypes(a, b) {
    return score(b) - score(a) || a.length - b.length || (a < b ? -1 : 1);
}

const ranked = Object.fromEntries(Object.keys(mimeDb).sort(compareTypes).map((type) => [type, mimeDb[type]]));

fs.writeFileSync(path.join(__dirname, '..', 'src', 'db.json'), JSON.stringify(ranked, undefined, 4), {
    encoding: 'utf-8'
});
