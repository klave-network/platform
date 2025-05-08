# Changelog
## [1.2.1](https://github.com/klave-network/platform/compare/hubber@1.2.0...hubber@1.2.1) (2025-05-08)

### Dependency Updates

* `api` updated to version `1.2.0`
## [1.2.0](https://github.com/klave-network/platform/compare/hubber@1.1.6...hubber@1.2.0) (2025-05-08)

### Dependency Updates

* `db` updated to version `1.1.6`
* `constants` updated to version `1.1.6`
* `providers` updated to version `1.1.6`
* `api` updated to version `1.1.6`

### Features

* **db,api,providers,hubber,ui,dispatcher,constants:** Add Embedded UI Hosting ([5a748c8](https://github.com/klave-network/platform/commit/5a748c8b616ad3674058517f5bd9c040361fc3c4))

## [1.1.6](https://github.com/klave-network/platform/compare/hubber@1.1.5...hubber@1.1.6) (2025-04-30)

## [1.1.5](https://github.com/klave-network/platform/compare/hubber@1.1.4...hubber@1.1.5) (2025-04-30)

### Dependency Updates

* `db` updated to version `1.1.4`
* `constants` updated to version `1.1.4`
* `providers` updated to version `1.1.4`
* `api` updated to version `1.1.4`
## [1.1.4](https://github.com/klave-network/platform/compare/hubber@1.1.3...hubber@1.1.4) (2025-04-29)

### Dependency Updates

* `api` updated to version `1.1.3`
## [1.1.3](https://github.com/klave-network/platform/compare/hubber@1.1.2...hubber@1.1.3) (2025-04-28)

### Dependency Updates

* `constants` updated to version `1.1.2`
* `providers` updated to version `1.1.2`
* `api` updated to version `1.1.2`
* `pruner` updated to version `1.1.2`
## [1.1.2](https://github.com/klave-network/platform/compare/hubber@1.1.1...hubber@1.1.2) (2025-04-11)

### Dependency Updates

* `db` updated to version `1.1.1`
* `constants` updated to version `1.1.1`
* `providers` updated to version `1.1.1`
* `api` updated to version `1.1.1`
* `pruner` updated to version `1.1.1`

### Bug Fixes

* **dispatcher,hubber:** Packaging issue with CJS ([9bcf47a](https://github.com/klave-network/platform/commit/9bcf47a5c3e3124e32e3b3b6a79d8435a9aa1685))
* **hubber:** Sentry profiling incompatibility in node `22-alpine` ([fdbf6b3](https://github.com/klave-network/platform/commit/fdbf6b3795bbfe9fc953d2d7a189dfe2cc654c34))

## [1.1.1](https://github.com/klave-network/platform/compare/hubber@1.1.0...hubber@1.1.1) (2025-04-10)

### Dependency Updates

* `db` updated to version `1.1.0`
* `constants` updated to version `1.1.0`
* `providers` updated to version `1.1.0`
* `api` updated to version `1.1.0`
* `pruner` updated to version `1.1.0`

### Bug Fixes

* **hubber:** Dockerfile node version causes issues with `@sentry/profiling` ([59bd5af](https://github.com/klave-network/platform/commit/59bd5af6f899d19a5e75f68bb9eadf3276db4519))

## [0.3.5](https://github.com/klave-network/platform/compare/hubber@1.0.2...hubber@0.3.5) (2025-04-07)


### Bug Fixes

* **providers,api,hubber:** Align types mismatches ([e9bbf67](https://github.com/klave-network/platform/commit/e9bbf67afe7b7a05161929b53d87fd6e870e61bf))

## [1.1.0](https://github.com/klave-network/platform/compare/hubber@1.0.2...hubber@1.1.0) (2025-04-10)

### Dependency Updates

* `db` updated to version `1.0.2`
* `constants` updated to version `1.0.2`
* `providers` updated to version `1.0.2`
* `api` updated to version `1.0.2`
* `pruner` updated to version `1.0.2`

### Features

* **providers,hubber:** Adding kredit pipeline data fetching ([89afcb4](https://github.com/klave-network/platform/commit/89afcb4f0154b4acc225a12ae86657d9752c0084))


### Bug Fixes

* **hubber:** Resolving bug in `owner` resolution in deployment ([7783a9b](https://github.com/klave-network/platform/commit/7783a9bf561bce9bbf156f123f39faaedca686c8))

## [1.1.0](https://github.com/klave-network/platform/compare/hubber@0.3.3...hubber@1.1.0) (2025-03-03)

### ⚠ BREAKING CHANGES

* Short-circuiting the `develop` track to provide release for non-compilable ESM format

## [1.0.2](https://github.com/klave-network/platform/compare/hubber@1.0.1...hubber@1.0.2) (2025-02-20)

### Dependency Updates

* `api` updated to version `1.0.1`
* `pruner` updated to version `1.0.1`
## [1.0.1](https://github.com/klave-network/platform/compare/hubber@1.0.0...hubber@1.0.1) (2025-02-20)

### Dependency Updates

* `db` updated to version `1.0.0`
* `constants` updated to version `1.0.0`
* `providers` updated to version `1.0.0`
* `api` updated to version `1.0.0`
* `pruner` updated to version `1.0.0`
## [1.0.0](https://github.com/klave-network/platform/compare/hubber@0.3.4...hubber@1.0.0) (2025-01-23)

### Dependency Updates

* `db` updated to version `0.3.4`
* `providers` updated to version `0.3.4`
* `constants` updated to version `0.3.4`
* `api` updated to version `0.3.4`
* `pruner` updated to version `0.3.4`

### ⚠ BREAKING CHANGES

* Moving to pure ESM repo

### Features

* **ui,hubber,providers:** Filter node name through ([620d41b](https://github.com/klave-network/platform/commit/620d41b14324e777bf40fe275decbf890458954f))


### Bug Fixes

* **hubber:** Add explicit externals for ESBuild ([09d6847](https://github.com/klave-network/platform/commit/09d6847b35558dd12b75e4a4f74cfbe9bf08789b))
* Package `git-rev-sync` relies on non-ESM features so we provide explicit location ([cee72ae](https://github.com/klave-network/platform/commit/cee72ae5cd5a2fe998c987864b060f039ddb939b))


### Miscellaneous Chores

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

## [0.3.6](https://github.com/klave-network/platform/compare/hubber@0.3.5...hubber@0.3.6) (2025-04-07)

### Bug Fixes

* **api:** Change timeout determination model ([2695861f](https://github.com/klave-network/platform/commit/2695861f5f66ef7665ba1eb933c1c859fca6753a))

## [0.3.5](https://github.com/klave-network/platform/compare/hubber@0.3.4...hubber@0.3.5) (2025-04-07)

### Features

* **api,hubber:** Enable Secretarium Connector chunking ([2e916d3f](https://github.com/klave-network/platform/commit/2e916d3f1b42c4d823eb1fef11b2ce353c16321c))

## [0.3.4](https://github.com/klave-network/platform/compare/hubber@0.3.3...hubber@0.3.4) (2024-08-02)

### Dependency Updates

* `api` updated to version `0.3.3`
* `pruner` updated to version `0.3.3`

## [0.3.3](https://github.com/klave-network/platform/compare/hubber@0.3.2...hubber@0.3.3) (2024-07-25)

### Dependency Updates

* `db` updated to version `0.3.2`
* `providers` updated to version `0.3.2`
* `constants` updated to version `0.3.2`
* `api` updated to version `0.3.2`
* `pruner` updated to version `0.3.2`

## [0.3.2](https://github.com/klave-network/platform/compare/hubber@0.3.1...hubber@0.3.2) (2024-07-24)

### Dependency Updates

* `db` updated to version `0.3.1`
* `providers` updated to version `0.3.1`
* `constants` updated to version `0.3.1`
* `api` updated to version `0.3.1`
* `pruner` updated to version `0.3.1`

### Bug Fixes

* **hubber:** Sentry sourcemap ESBuild configuration ([d0f2b87](https://github.com/klave-network/platform/commit/d0f2b87c9887a26cf58aeab53ee6a80d17aa9f92))

## [0.3.1](https://github.com/klave-network/platform/compare/hubber@0.3.0...hubber@0.3.1) (2024-07-03)

### Dependency Updates

* `db` updated to version `0.3.0`
* `providers` updated to version `0.3.0`
* `constants` updated to version `0.3.0`
* `api` updated to version `0.3.0`
* `pruner` updated to version `0.3.0`

## [0.3.0](https://github.com/klave-network/platform/compare/hubber@0.2.5...hubber@0.3.0) (2024-05-31)

### Dependency Updates

* `db` updated to version `0.2.5`
* `providers` updated to version `0.2.5`
* `constants` updated to version `0.2.5`
* `api` updated to version `0.2.5`
* `pruner` updated to version `0.2.5`

### Features

* **api,compiler,hubber:** Do compilation over full repo clone ([d68d7dd](https://github.com/klave-network/platform/commit/d68d7ddc26815900489d529b502f30495546f0b5))
* **api,hubber:** Add Rust compilation support ([66b2a1d](https://github.com/klave-network/platform/commit/66b2a1de8ca5f660c09086c4c163fb4994638f4d))

### Bug Fixes

* **api,hubber:** Message streaming and Dockerfile Rust setup ([a66676f](https://github.com/klave-network/platform/commit/a66676fdc66a92002e5b8f6e02a15eba946e64b9))
* **hubber:** Filter undefined values in ESBuild compilation plugins ([3c34f9b](https://github.com/klave-network/platform/commit/3c34f9bc3b36f8f636d08460d2d46680adb19890))

## [0.2.6](https://github.com/klave-network/platform/compare/hubber@0.2.5...hubber@0.2.6) (2024-05-08)

### Dependency Updates

* `api` updated to version `0.2.5`
* `pruner` updated to version `0.2.5`

## [0.2.5](https://github.com/klave-network/platform/compare/hubber@0.2.4...hubber@0.2.5) (2024-05-08)

### Dependency Updates

* `api` updated to version `0.2.4`
* `pruner` updated to version `0.2.4`

## [0.2.4](https://github.com/klave-network/platform/compare/hubber@0.2.3...hubber@0.2.4) (2024-05-02)

### Dependency Updates

* `api` updated to version `0.2.3`
* `pruner` updated to version `0.2.3`

## [0.2.3](https://github.com/klave-network/platform/compare/hubber@0.2.2...hubber@0.2.3) (2024-04-25)

### Dependency Updates

* `db` updated to version `0.2.2`
* `providers` updated to version `0.2.2`
* `constants` updated to version `0.2.2`
* `api` updated to version `0.2.2`
* `pruner` updated to version `0.2.2`

## [0.2.2](https://github.com/klave-network/platform/compare/hubber@0.2.1...hubber@0.2.2) (2024-03-19)

### Dependency Updates

* `api` updated to version `0.2.1`
* `pruner` updated to version `0.2.1`

## [0.2.1](https://github.com/klave-network/platform/compare/hubber@0.2.0...hubber@0.2.1) (2024-03-19)

### Dependency Updates

* `db` updated to version `0.2.0`
* `providers` updated to version `0.2.0`
* `constants` updated to version `0.2.0`
* `api` updated to version `0.2.0`
* `pruner` updated to version `0.2.0`

### Bug Fixes

* **hubber:** Updated Probot defaults requires override ([cf06205](https://github.com/klave-network/platform/commit/cf062053de89df446d79a98d2657badc366f5bc0))

## [0.2.0](https://github.com/klave-network/platform/compare/hubber@0.1.5...hubber@0.2.0) (2023-12-19)

### Dependency Updates

* `db` updated to version `0.1.5`
* `providers` updated to version `0.1.5`
* `constants` updated to version `0.1.5`
* `api` updated to version `0.1.5`
* `pruner` updated to version `0.1.5`

### Features

* Add Stripe payment for credits ([2a7d7ff](https://github.com/klave-network/platform/commit/2a7d7ff011649c2ae81b97989cd45625326e0776))
* **api,hubber,ui:** Provide versions at compile time ([da280b5](https://github.com/klave-network/platform/commit/da280b518d945b29c519341bc3a0755e13e2d836))
* **db,constants,api,ui:** Add tracking of commit signatures ([a39311d](https://github.com/klave-network/platform/commit/a39311d03d2f8fa50983958d4a829ec3ab09565f))
* **providers,hubber:** Guarantee a constant SCP Key ([025fae2](https://github.com/klave-network/platform/commit/025fae25c4dd6059ab9fbf86cb5d16a57c23389e))

### Bug Fixes

* **api,constants:** Ensure the API packages only exposes types to the UI ([d325251](https://github.com/klave-network/platform/commit/d325251033fd05fa895f5058ef97e15b5ff89d51))
* **api,hubber:** Correct forced deployment misfire ([96dbc77](https://github.com/klave-network/platform/commit/96dbc7794da36d1c8070fac3dd7a6e283e8ecfed))
* **hubber,compiler:** Compiler in k8s pods could not locate dependencies in wrong CWD ([9785517](https://github.com/klave-network/platform/commit/978551798e0f0707d30e593d5c624f45b2b39030))
* **hubber:** Cannot use both esbuildOptions and esbuildConfig ([9cc194a](https://github.com/klave-network/platform/commit/9cc194a07c157ce1dba5ec5f0a6dc555524a153a))
* **hubber:** Check correctly the Probot proxy initialisation ([cce34de](https://github.com/klave-network/platform/commit/cce34de2355442c911a02dcfa24ea16ef3ac0376))
* **hubber:** Ensure Prisma client is imported from the correct package ([720de2f](https://github.com/klave-network/platform/commit/720de2fe26d3efa86524e12423b5b04cb2a59340))
* **hubber:** Ensure to test the MongoDB connection works at start ([4f37dd2](https://github.com/klave-network/platform/commit/4f37dd2a052db7d0ee6d2ce498e3f9ad7cf33e10))
* **hubber:** Error middleware not wired correctly ([9aa718b](https://github.com/klave-network/platform/commit/9aa718b42e0d03a5ec63414de669d417b13edee3))
* **hubber:** Initialise Environment before anything else ([b4065e7](https://github.com/klave-network/platform/commit/b4065e7f5bd8195b28746bc8d7ab85014a9ba6eb))
* **hubber:** Make sure Sentry boots later to capture the environment ([9883d5b](https://github.com/klave-network/platform/commit/9883d5b847ae98c3a453c02454260c0753bef6e4))

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
