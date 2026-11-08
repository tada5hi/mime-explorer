# [1.1.0](https://github.com/Tada5hi/mime-explorer/compare/v1.0.0...v1.1.0) (2023-11-26)


### Features

* bump (dev-) dependencies ([6d0915f](https://github.com/Tada5hi/mime-explorer/commit/6d0915fb4136eeb686c0e15d9c761dbec0ce8b00))

# 1.0.0 (2023-01-12)


### Bug Fixes

* extended type information + added README.md section ([d0fc503](https://github.com/Tada5hi/mime-explorer/commit/d0fc503a50151e895f7ed38c48654554e9bad4a5))
* typescript type generation ([238d3b6](https://github.com/Tada5hi/mime-explorer/commit/238d3b67d8fef2c05709d90ad09575422ab6b19c))


### Features

* bump version ([501294f](https://github.com/Tada5hi/mime-explorer/commit/501294fe010a96bd6360b720260a0b132444d8b3))

## [2.0.0](https://github.com/tada5hi/mime-explorer/compare/v1.1.0...v2.0.0) (2026-11-08)


### ⚠ BREAKING CHANGES

* getMeta() can return a record with empty extensions, so extensions[0] can be undefined for a known type. A bundled metadata-only type now holds its metadata first, so registering different metadata for it reports a conflict unless it is unregistered first. Definitions with valid metadata but no extensions no longer fail registration.
* 17 contested extensions now resolve differently, for example js to text/javascript, mp4 to video/mp4 and mp3 to audio/mpeg.
* the package is ESM-only. require() needs Node.js 20.19, 22.12 or newer, and require('mime-explorer/db') now returns a namespace whose default property holds the database.
* getTypeByExtension, getExtensionByType and getMetaByType are now getType, getExtension and getMeta. defineType and defineTypes are replaced by register, and undefineType by unregister. Records are read-only, protected maps are removed, and a leading * marks an invalid extension.
* Uppercase MIME-key removal now deletes the normalized record and its owned extensions. Path parsing now handles line terminators and Unicode dotfiles according to the documented final-segment rules. Protected registry dictionaries no longer inherit Object.prototype.
* Replace standalone lookup and registration functions with MimeExplorer instance methods. Import the bundled data from mime-explorer/db and pass it to the constructor.

### Features

* expose instance registry and separate database export ([075b582](https://github.com/tada5hi/mime-explorer/commit/075b5826d09582e400554fb8cc58fc48e0d6d1ad))
* keep types known only by their metadata ([#158](https://github.com/tada5hi/mime-explorer/issues/158)) ([94e2e78](https://github.com/tada5hi/mime-explorer/commit/94e2e780e6f8248210ec67f322f207744d594373))
* publish as ESM only ([#156](https://github.com/tada5hi/mime-explorer/issues/156)) ([3f09e4c](https://github.com/tada5hi/mime-explorer/commit/3f09e4c0cd4be6f921d3877a9c10d3eea4d0dff8))
* rank the bundled database by lookup preference ([#157](https://github.com/tada5hi/mime-explorer/issues/157)) ([1cdef3d](https://github.com/tada5hi/mime-explorer/commit/1cdef3d276a3bc1e005e0ba7fbef76169df21a71))
* redesign the registry interface ([#155](https://github.com/tada5hi/mime-explorer/issues/155)) ([74e86ec](https://github.com/tada5hi/mime-explorer/commit/74e86ecec06daf349fd8a1377169d2781b210e0a))


### Bug Fixes

* **deps:** refresh MIME database and compatible development tooling ([2adcc30](https://github.com/tada5hi/mime-explorer/commit/2adcc3011159896253f192c302a24f451bc8a51b))
* enforce registry ownership and speed up path lookups ([#153](https://github.com/tada5hi/mime-explorer/issues/153)) ([2fc54d5](https://github.com/tada5hi/mime-explorer/commit/2fc54d544428bfc1b97a500bb433b04f203e8b26))

## [1.0.2](https://github.com/Tada5hi/mime-es/compare/v1.0.1...v1.0.2) (2023-01-12)


### Bug Fixes

* typescript type generation ([238d3b6](https://github.com/Tada5hi/mime-es/commit/238d3b67d8fef2c05709d90ad09575422ab6b19c))

## [1.0.1](https://github.com/Tada5hi/mime-es/compare/v1.0.0...v1.0.1) (2023-01-12)


### Bug Fixes

* extended type information + added README.md section ([d0fc503](https://github.com/Tada5hi/mime-es/commit/d0fc503a50151e895f7ed38c48654554e9bad4a5))

# 1.0.0 (2023-01-12)


### Features

* bump version ([501294f](https://github.com/Tada5hi/mime-es/commit/501294fe010a96bd6360b720260a0b132444d8b3))
