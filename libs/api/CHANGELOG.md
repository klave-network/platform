# Changelog
## [0.5.0](///compare/klave-api@0.4.0...klave-api@0.5.0) (2023-09-27)

### Dependency Updates

* `klave-db` updated to version `0.4.0`
* `connector` updated to version `0.4.0`
* `klave-compiler` updated to version `0.4.0`
* `providers` updated to version `0.4.0`

### Features

* **db,api,klave,deployer:** Add deployment FQDN leaping 221f9a2


### Bug Fixes

* **db,api,klave,providers,hubber:** Target correct default branch and deploy on forced commit 1a6ede1

## [0.4.0](///compare/klave-api@0.3.1...klave-api@0.4.0) (2023-09-01)

### Dependency Updates

* `klave-db` updated to version `0.3.1`
* `connector` updated to version `0.3.1`
* `klave-compiler` updated to version `0.3.1`
* `providers` updated to version `0.3.1`

### Features

* **db,api:** Add compilation dependencies manifest tracking 6e51f29


### Bug Fixes

* **api,klave:** Forcefully expel bad cached credentials 90c1274
* **api:** Compilation is non-function when importing SDK af188ed
* **api:** Tweak building path resolution for cross-platform 6bf8af2

## [0.3.1](///compare/klave-api@0.3.0...klave-api@0.3.1) (2023-06-13)

### Dependency Updates

* `klave-compiler` updated to version `0.2.2`
## [0.3.0](///compare/klave-api@0.2.0...klave-api@0.3.0) (2023-06-12)

### Dependency Updates

* `klave-db` updated to version `0.1.0`
* `providers` updated to version `0.1.0`

### Features

* **providers,api:** Enable Sentry breadcrumb on logging with parent tracing f535496


### Bug Fixes

* **api,klave:** Ensure WebAuthn enrollement is triggered by default 2009c38

## [0.2.0](///compare/klave-api@0.1.0...klave-api@0.2.0) (2023-06-06)

### Dependency Updates

* `klave-db` updated to version `0.1.0`

### Features

* **db,api,klave:** Add support for Webauthn enrollement 85aabab


### Bug Fixes

* **api,hubber:** Ensure parsing of RPID from origin in env 792cc48

## 0.1.0 (2023-06-01)

### Dependency Updates

* `klave-db` updated to version `0.1.0`
* `klave-compiler` updated to version `0.2.1`
* `providers` updated to version `0.0.1`
* `connector` updated to version `0.13.1`

### Features

* **api,compiler,deployer:** Include JSON transformer for AS compilation ed72c2b
* **api,hubber:** Add optional variable to enable fetching through cache d76f626
* **api:** Allow resolution of relative files in github repos 8ca71f4
* **db,api,klave:** Provide feedback Klave has no GitHub App access 2d9bfa2
* **klave:** Add repository information in the Application settings page f1580b2


### Bug Fixes

* **api:** Looking for configuration in the wrong location following `fb636234` fd967b5
* **klave:** Unable to view deployments when logged out 78d3a45
