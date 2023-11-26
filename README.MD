# mime-explorer ☂

[![npm version](https://badge.fury.io/js/mime-explorer.svg)](https://badge.fury.io/js/mime-explorer)
[![main](https://github.com/tada5hi/mime-explorer/actions/workflows/main.yml/badge.svg)](https://github.com/tada5hi/mime-explorer/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/mime-explorer/branch/master/graph/badge.svg?token=80LA00PIGM)](https://codecov.io/gh/tada5hi/mime-explorer)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/mime-explorer/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Tada5hi/mime-explorer?targetFile=package.json)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

A versatile library that simplifies MIME type management,
providing a user-friendly interface to effortlessly retrieve MIME types
based on file paths/extensions, gather comprehensive meta information,
and obtain standard file extensions for a given MIME type.

It is well-suited for a variety of tasks,
including seamless interaction with HTTP headers and general operations involving files.

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install mime-explorer --save
```

## Usage

To get the mime type for a given path or extension:

```typescript
import { getType } from 'mime-explorer';

getType('txt');
// => 'text/plain'

getType('json');
// => 'application/json'
```

To get the file extension for a given mime type:

```typescript
import { getExtension } from 'mime-explorer';

getExtension('text/plain');
// => 'txt'

getExtension('application/json');
// => 'json'
```

To get meta information for a mime type:

```typescript
import { get } from 'mime-explorer';

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
