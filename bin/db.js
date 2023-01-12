/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

const fs = require('node:fs');
const mimeDb = require('mime-db');
const path = require("node:path");

fs.writeFileSync(path.join(__dirname, '..', 'assets', 'db.json'), JSON.stringify(mimeDb, undefined, 4), {
    encoding: 'utf-8'
});
