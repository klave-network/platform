# Changelog
## [0.1.5](///compare/hubber@0.1.4...hubber@0.1.5) (2023-09-27)

### Dependency Updates

* `klave` updated to version `0.1.4`
* `klave-compiler` updated to version `0.1.4`
* `klave-db` updated to version `0.1.4`
* `providers` updated to version `0.1.4`
* `instrumentation` updated to version `0.1.4`
* `klave-api` updated to version `0.1.4`

### Bug Fixes

* **db,api,klave,providers,hubber:** Target correct default branch and deploy on forced commit 1a6ede1

## [0.1.4](///compare/hubber@0.1.3...hubber@0.1.4) (2023-09-01)

### Dependency Updates

* `klave` updated to version `0.1.3`
* `klave-compiler` updated to version `0.1.3`
* `klave-db` updated to version `0.1.3`
* `providers` updated to version `0.1.3`
* `instrumentation` updated to version `0.1.3`
* `klave-api` updated to version `0.1.3`
* `pruner` updated to version `0.1.3`
## [0.1.3](///compare/hubber@0.1.2...hubber@0.1.3) (2023-06-13)

### Dependency Updates

* `klave` updated to version `0.2.2`
* `klave-compiler` updated to version `0.2.2`
* `klave-api` updated to version `0.3.1`

### Bug Fixes

* Dependencies versions requiring pinning due to ESM 0a137ac

## [0.1.2](///compare/hubber@0.1.1...hubber@0.1.2) (2023-06-12)

### Dependency Updates

* `klave` updated to version `0.2.1`
* `klave-db` updated to version `0.1.0`
* `providers` updated to version `0.1.0`
* `klave-api` updated to version `0.3.0`
## [0.1.1](///compare/hubber@0.1.0...hubber@0.1.1) (2023-06-06)

### Dependency Updates

* `klave` updated to version `0.2.0`
* `klave-db` updated to version `0.1.0`
* `klave-api` updated to version `0.2.0`

### Bug Fixes

* **api,hubber:** Ensure parsing of RPID from origin in env 792cc48

## 0.1.0 (2023-06-01)

### Dependency Updates

* `klave` updated to version `0.1.0`
* `klave-compiler` updated to version `0.2.1`
* `klave-db` updated to version `0.1.0`
* `providers` updated to version `0.0.1`
* `instrumentation` updated to version `0.1.1`
* `klave-api` updated to version `0.1.0`
* `pruner` updated to version `0.1.0`

### Features

* Add run command screen to the deployments view 8b7095f
* **api,hubber:** Add optional variable to enable fetching through cache d76f626
* **dispatcher:** Adding WebSocket handling features ce7403f
* **hubber-api,hubber,klave:** Add capture of `expiresOn` date for deployments 663f854
* **hubber-compiler:** Split off the wasm compiler into separate library package 36e1f02
* **hubber,klave:** Add output storage and route extraction a7ac061
* **hubber:** Prepare sigstore signing 0b26178
* Implement identity and web merging 1e16538
* New Instrumentation package with Sentry compat 3fbde7d
* **pruner,hubber:** Adding garbage collection background task c5033e5


### Bug Fixes

* Catch exception of the octokit compare c788bcb
* **hubber,klave:** Resolve Secretarium URI and key exposition dae9c79
* **hubber:** Dockerization issue with "klave/compiler" eae4a83
* **hubber:** Ensure `visitor-as` presence in Docker image 848bb6d
* **hubber:** Ensure that every hook event is processed 642091b
* **hubber:** Fix Prisma details printed on start d5d9fd2
* **hubber:** Revert configuration change for sigstore prep 24829f4
* **hubber:** Solve typescript not present for runtime DTS analysis d60fa6b


### Reverts

* Revert "chore(klave): Move to vite for compiling/bundling" 8edc593
