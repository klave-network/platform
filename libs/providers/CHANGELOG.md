# Changelog
## [0.1.1](https://github.com/klave-network/platform/compare/providers@0.1.0...providers@0.1.1) (2024-03-19)

### Dependency Updates

* `db` updated to version `0.1.0`
* `constants` updated to version `0.1.0`

### Bug Fixes

* **providers:** Repos were never synced because of unreached code due to wrong Octokit types ([bf2e2f4](https://github.com/klave-network/platform/commit/bf2e2f45d467ce6d0b3c0284cf2947990399dbf9))

## [0.1.0](https://github.com/klave-network/platform/compare/providers@0.0.1...providers@0.1.0) (2023-12-19)

### Dependency Updates

* `db` updated to version `0.0.1`
* `constants` updated to version `0.0.1`

### Features

* **api,hubber,ui:** Provide versions at compile time ([da280b5](https://github.com/klave-network/platform/commit/da280b518d945b29c519341bc3a0755e13e2d836))
* **dispatcher:** Add version route ([8f47bf4](https://github.com/klave-network/platform/commit/8f47bf4cd88d741e995fcb80fd603e7001c1559c))
* **providers,hubber:** Guarantee a constant SCP Key ([025fae2](https://github.com/klave-network/platform/commit/025fae25c4dd6059ab9fbf86cb5d16a57c23389e))
* **providers:** Periodically sync the backend version numbers ([fdbc62c](https://github.com/klave-network/platform/commit/fdbc62cd4dc6f5e15fb84b0dd658176ea63969b2))
* **ui:** Display multiple errors in the run command window ([96ec17b](https://github.com/klave-network/platform/commit/96ec17bb7383602ee4a49e36944dd7487ecc78b2))


### Bug Fixes

* **providers:** Asynchronous tracking of Sentry event in GitHub reconciler ([e348322](https://github.com/klave-network/platform/commit/e348322e9a9eb998adeacf005ee873032ed8edd2))
