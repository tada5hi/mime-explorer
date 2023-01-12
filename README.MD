# mime-es ☂

[![npm version](https://badge.fury.io/js/mime-es.svg)](https://badge.fury.io/js/mime-es)
[![main](https://github.com/tada5hi/mime-es/actions/workflows/main.yml/badge.svg)](https://github.com/tada5hi/mime-es/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/mime-es/branch/master/graph/badge.svg?token=80LA00PIGM)](https://codecov.io/gh/tada5hi/mime-es)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/mime-es/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Tada5hi/mime-es?targetFile=package.json)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

This is a library for mime types. It provides an ESM and CJS build.

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install mime-es --save
```

## Usage

To get the mime type for a given path or extension:

```typescript
import { getType } from 'mime-es';

getType('txt');
// => 'text/plain'

getType('json');
// => 'application/json'
```

To get the file extension for a given mime type:

```typescript
import { getExtension } from 'mime-es';

getExtension('text/plain');
// => 'txt'

getExtension('application/json');
// => 'json'
```

To get meta information for a mime type:

```typescript
import { get } from 'mime-es';

get('text/plain');
/*
{
    "source": "iana",
    "compressible": true,
    "extensions": [
        "txt",
        "text",
        "conf",
        "def",
        "list",
        "log",
        "in",
        "ini"
    ]
}
 */

get('application/json');
/*
{
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": [
        "json",
        "map"
    ]
}
 */
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
