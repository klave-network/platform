# Changelog
## [1.1.4](https://github.com/klave-network/platform/compare/dispatcher@1.1.3...dispatcher@1.1.4) (2025-04-11)


### Bug Fixes

* **dispatcher:** New Fastify API requires the response builder to be only awaited once ([7951e83](https://github.com/klave-network/platform/commit/7951e83a5a9e417b3f1abbaaf6958d014375b7fd))

## [1.1.3](https://github.com/klave-network/platform/compare/dispatcher@1.1.2...dispatcher@1.1.3) (2025-04-11)

### Dependency Updates

* `constants` updated to version `1.1.2`

### Bug Fixes

* **dispatcher,hubber:** Packaging issue with CJS ([9bcf47a](https://github.com/klave-network/platform/commit/9bcf47a5c3e3124e32e3b3b6a79d8435a9aa1685))
* **dispatcher:** Reverting to `commonjs` compilation ([751a684](https://github.com/klave-network/platform/commit/751a6843732d5d0b43c12c8aec226076fc70feb9))

## [1.1.2](https://github.com/klave-network/platform/compare/dispatcher@1.1.1...dispatcher@1.1.2) (2025-04-09)

### Dependency Updates

* `constants` updated to version `1.1.1`

### Bug Fixes

* **dispatcher:** Parsing issue with usage ingest data ([0191b16](https://github.com/klave-network/platform/commit/0191b16f2654cd971bb57d5d087f915d1b6980f2))

## [1.1.1](https://github.com/klave-network/platform/compare/dispatcher@1.1.0...dispatcher@1.1.1) (2025-01-22)


### Bug Fixes

* **dispatcher:** Missing dependency for compilation ([2a63891](https://github.com/klave-network/platform/commit/2a638910bf7365c35a3e7dc0c83756c18b21ff98))

## [1.1.0](https://github.com/klave-network/platform/compare/dispatcher@1.0.1...dispatcher@1.1.0) (2025-01-22)

### Dependency Updates

* `constants` updated to version `1.0.1`

### Features

* **dispatcher:** Implement usage report recording ([86a1cef](https://github.com/klave-network/platform/commit/86a1cef1615497fa8474d80ee375ca9fa0db5a86))

## [1.0.1](https://github.com/klave-network/platform/compare/dispatcher@1.0.0...dispatcher@1.0.1) (2024-12-16)

### Dependency Updates

* `constants` updated to version `1.0.0`
## [1.0.0](https://github.com/klave-network/platform/compare/dispatcher@0.1.1...dispatcher@1.0.0) (2024-12-13)

### Dependency Updates

* `constants` updated to version `0.1.1`

### ⚠ BREAKING CHANGES

* Moving to pure ESM repo

### Features

* **dispatcher:** Enable secret broadcast filter to only send once per family ([cb903e3](https://github.com/klave-network/platform/commit/cb903e3bee96e4b729317cc420152505350deb2b))


### Bug Fixes

* Package `git-rev-sync` relies on non-ESM features so we provide explicit location ([cee72ae](https://github.com/klave-network/platform/commit/cee72ae5cd5a2fe998c987864b060f039ddb939b))


### Miscellaneous Chores

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

## [0.1.1](https://github.com/klave-network/platform/compare/dispatcher@0.1.0...dispatcher@0.1.1) (2024-08-08)


### Bug Fixes

* **dispatcher:** Fastify websocket now use `message` event in place of `data` ([79c38e7](https://github.com/klave-network/platform/commit/79c38e7dd33d7f70b7336645069c9f91739a3ad8))

## [0.1.0](https://github.com/klave-network/platform/compare/dispatcher@0.0.1...dispatcher@0.1.0) (2024-08-08)

### Dependency Updates

* `constants` updated to version `0.0.1`

### Features

* **dispatcher:** Add version route ([8f47bf4](https://github.com/klave-network/platform/commit/8f47bf4cd88d741e995fcb80fd603e7001c1559c))
* **dispatcher:** Prevent Fastify from parsing IncomingMessage ([655f5cd](https://github.com/klave-network/platform/commit/655f5cd8fca4178087974a1586a63c09ae3f2633))


### Bug Fixes

* **dispatcher:** Do not send back 500 on empty queue ([27a15d4](https://github.com/klave-network/platform/commit/27a15d43c25ea092546add4bce4414a969b73946))
