# Changelog
## [0.13.0](https://github.com/klave-network/platform/compare/api@0.12.0...api@0.13.0) (2024-08-02)


### Features

* **api,ui:** Add the ability to add a custom cluster ([fcc3c5f](https://github.com/klave-network/platform/commit/fcc3c5f0f9b76f4e8a5a7826ef64327061b1d096))
* **api,ui:** Allow editing of permission grants for organisations ([e2bd7d2](https://github.com/klave-network/platform/commit/e2bd7d2097b773e2a7151594ee837950298cfe2d)), closes [#KN-232](https://github.com/klave-network/platform/issues/KN-232)


### Bug Fixes

* **api:** Ensure permission checks on org deletion ([ee905eb](https://github.com/klave-network/platform/commit/ee905eb9daf4981741d4d7f5f0eab7e45176ddc8))
* **api:** Ensure to query apps based on accessible orgs ([97932cf](https://github.com/klave-network/platform/commit/97932cfd0f9cf66be70a72531e4f80f6cd9bf281))
* **api:** Guarantee app fetch over accessible organisations ([259d666](https://github.com/klave-network/platform/commit/259d6660abb9b472469a5c72f83de7764eeafe02))

## [0.12.0](https://github.com/klave-network/platform/compare/api@0.11.0...api@0.12.0) (2024-07-25)

### Dependency Updates

* `db` updated to version `0.11.0`
* `constants` updated to version `0.11.0`
* `providers` updated to version `0.11.0`

### Features

* **api,ui:** Add cluster listing in Organisation view ([fbdedfb](https://github.com/klave-network/platform/commit/fbdedfb5162390b242c6a8365a12bf8242dfb702))


### Bug Fixes

* **api:** Error code 13548 on Prisma invokation ([90df0bd](https://github.com/klave-network/platform/commit/90df0bd9c755dd0acc244d436b482cf42e8d722c))
* **api:** Perform config snapshot earlier with deploying ([dfaf562](https://github.com/klave-network/platform/commit/dfaf562b06cc28b10264033ac7d03dfaa6ed516a))
* **db,api,ui:** Correct typo in cluster structure declaration ([5fe9160](https://github.com/klave-network/platform/commit/5fe91607dec8aee57d9cb367715d10231169b83a))

## [0.11.0](https://github.com/klave-network/platform/compare/api@0.10.1...api@0.11.0) (2024-07-24)

### Dependency Updates

* `db` updated to version `0.10.1`
* `constants` updated to version `0.10.1`
* `providers` updated to version `0.10.1`

### Features

* **db,api,providers,constants,ui:** Adding custom deployment target cluster configuration ([6829edd](https://github.com/klave-network/platform/commit/6829edd447621c4c479ba0d687ebdc5f1533272c))

## [0.10.1](https://github.com/klave-network/platform/compare/api@0.10.0...api@0.10.1) (2024-06-07)

### Dependency Updates

* `db` updated to version `0.10.0`
* `constants` updated to version `0.10.0`
* `providers` updated to version `0.10.0`
## [0.10.0](https://github.com/klave-network/platform/compare/api@0.9.0...api@0.10.0) (2024-05-31)

### Dependency Updates

* `db` updated to version `0.9.0`
* `constants` updated to version `0.9.0`
* `providers` updated to version `0.9.0`

### Features

* **api,compiler,hubber:** Do compilation over full repo clone ([d68d7dd](https://github.com/klave-network/platform/commit/d68d7ddc26815900489d529b502f30495546f0b5))
* **api,hubber:** Add Rust compilation support ([66b2a1d](https://github.com/klave-network/platform/commit/66b2a1de8ca5f660c09086c4c163fb4994638f4d))
* **db,api,ui:** Add source type/language logo indicator ([d07a296](https://github.com/klave-network/platform/commit/d07a296d29aae51e1d8645786aba736a04aa69b0))
* **db,api,ui:** Provide application options to deploy every commit ([f2e5ac3](https://github.com/klave-network/platform/commit/f2e5ac33fe7fc302c8c25d590c83508b7b05e906))
* **db,constants,api,ui:** Provide full build tracing in UI ([6e6cc10](https://github.com/klave-network/platform/commit/6e6cc10fa13c8c266d78b99697687d8ca1622b8a))


### Bug Fixes

* **api,hubber:** Message streaming and Dockerfile Rust setup ([a66676f](https://github.com/klave-network/platform/commit/a66676fdc66a92002e5b8f6e02a15eba946e64b9))
* **api,ui:** Setting button for out-of-branch commit deployment has wrong target ([523dc27](https://github.com/klave-network/platform/commit/523dc276a543333537d3c49ec36d35b323a4529a))

## [0.9.0](https://github.com/klave-network/platform/compare/api@0.8.2...api@0.9.0) (2024-05-08)

### Dependency Updates

* `compiler` updated to version `0.8.2`

### Features

* **compiler,sdk,api:** Bring ASC and compiler versions forward ([520ae67](https://github.com/klave-network/platform/commit/520ae67a6ae630e9c2d9c75d05ea13a175bf7273))


### Bug Fixes

* **api:** We should not require `package.json` for WASM only deployment ([abdfbaf](https://github.com/klave-network/platform/commit/abdfbaf1929d5e62f77a21afa215713ea5f13519))

## [0.8.2](https://github.com/klave-network/platform/compare/api@0.8.1...api@0.8.2) (2024-05-08)

### Dependency Updates

* `compiler` updated to version `0.8.1`
## [0.8.1](https://github.com/klave-network/platform/compare/api@0.8.0...api@0.8.1) (2024-05-02)

### Dependency Updates

* `compiler` updated to version `0.8.0`
## [0.8.0](https://github.com/klave-network/platform/compare/api@0.7.3...api@0.8.0) (2024-04-25)

### Dependency Updates

* `db` updated to version `0.7.3`
* `providers` updated to version `0.7.3`
* `constants` updated to version `0.7.3`

### Features

* **db,api,ui:** Add support for deploying pre-compiled WASM binaries ([47b7f6f](https://github.com/klave-network/platform/commit/47b7f6f738561f4f1c588452c25b3a6a23141cba))

## [0.7.3](https://github.com/klave-network/platform/compare/api@0.7.2...api@0.7.3) (2024-04-08)

### Dependency Updates

* `db` updated to version `0.7.2`
* `compiler` updated to version `0.7.2`
* `providers` updated to version `0.7.2`
* `constants` updated to version `0.7.2`
## [0.7.2](https://github.com/klave-network/platform/compare/api@0.7.1...api@0.7.2) (2024-04-05)

### Dependency Updates

* `db` updated to version `0.7.1`
* `compiler` updated to version `0.7.1`
* `providers` updated to version `0.7.1`
* `constants` updated to version `0.7.1`

### Bug Fixes

* **api,ui:** Githup Tokens need stronger nudge to be recreated ([ae47b8a](https://github.com/klave-network/platform/commit/ae47b8a92a4d0713e2472433d2151ac426e86a2e))
* **api:** Issue with existing FQDN on registration ([0f59ea4](https://github.com/klave-network/platform/commit/0f59ea4013b02b0e7e598c18b0e6e3cafeeceada))

## [0.7.1](https://github.com/klave-network/platform/compare/api@0.7.0...api@0.7.1) (2024-03-19)


### Bug Fixes

* **api:** Deleting non-existing object crashes Prisma ([eaa87a0](https://github.com/klave-network/platform/commit/eaa87a0acefa7639b59fb389d61414550c27038a))

## [0.7.0](https://github.com/klave-network/platform/compare/api@0.6.0...api@0.7.0) (2024-03-19)

### Dependency Updates

* `db` updated to version `0.6.0`
* `compiler` updated to version `0.6.0`
* `providers` updated to version `0.6.0`
* `constants` updated to version `0.6.0`

### Features

* **api,ui:** Add new application listing page for admin + Supplement existing dashboard ([8540fd5](https://github.com/klave-network/platform/commit/8540fd563644e39547b9a9732bed9dc9017d9072))
* **api,ui:** Add view for current running configuration ([c971c65](https://github.com/klave-network/platform/commit/c971c654f858fe249d154e516fc1218fee9efea4))
* **constants,db,api,ui:** Add system dashboard for users and organisations listing ([e3c118f](https://github.com/klave-network/platform/commit/e3c118f1b59b88f5293b4904e704c6e88cbd665a))


### Bug Fixes

* **api,ui:** Parse config from repo scan not returning the correct result ([d0eac7f](https://github.com/klave-network/platform/commit/d0eac7f79e038d50508d87570d960cf45601995e))
* **api:** App configuration incorrectly derived + Add deployment filtering ([46fff53](https://github.com/klave-network/platform/commit/46fff5348e00c1fa1a2e22a7c0cd85a05b82459d))
* **api:** Re-insert randomness in FQDN to avoid backend naming conflict ([b627b11](https://github.com/klave-network/platform/commit/b627b1111fa74f7aed8fab98bd15b5767ff5e41b))
* **ui:** FQDN naming would not select first element from UUID split ([d236358](https://github.com/klave-network/platform/commit/d23635830d4f392da87085d2a5dadc3d69998462))

## [0.6.0](https://github.com/klave-network/platform/compare/api@0.5.0...api@0.6.0) (2023-12-19)

### Dependency Updates

* `db` updated to version `0.5.0`
* `compiler` updated to version `0.5.0`
* `providers` updated to version `0.5.0`
* `constants` updated to version `0.5.0`

### Features

* Add disk caching to circumvent proxy HTTPS limitation ([4b19771](https://github.com/klave-network/platform/commit/4b19771980930cef48aaea3dd4c991ac11b57fc4))
* Add Stripe payment for credits ([2a7d7ff](https://github.com/klave-network/platform/commit/2a7d7ff011649c2ae81b97989cd45625326e0776))
* Add support for Organisations ([b4400ce](https://github.com/klave-network/platform/commit/b4400ce5b9603178e8d59d4f6e09f8b0e21eafef))
* **api,hubber,ui:** Provide versions at compile time ([da280b5](https://github.com/klave-network/platform/commit/da280b518d945b29c519341bc3a0755e13e2d836))
* **api,ui:** Provide filtering of disposable email domains ([9357e73](https://github.com/klave-network/platform/commit/9357e73132ef6a79204dcd79ef0ad8b1e08969a2))
* **api,ui:** Provide screen for setting users' own slug ([0d28ecb](https://github.com/klave-network/platform/commit/0d28ecb3bbfe42abacfa2e014a0f647ec6358452))
* **api:** Ensure the release mechanism redeploys from database ([b488b79](https://github.com/klave-network/platform/commit/b488b79bc39cfd4e5ffd5e672a89e1c608b735ee))
* **db,api,ui:** Add new permission panel for app settings ([ecca8b6](https://github.com/klave-network/platform/commit/ecca8b62f6247871c2742ee7a420c90f3dad5479))
* **db,api,ui:** Add screen for coupon redeeming ([7f0742e](https://github.com/klave-network/platform/commit/7f0742ed6934725a2e504a8cbfc2a9679a34914b))
* **db,api,ui:** Add transaction spending limit selector ([8b9368b](https://github.com/klave-network/platform/commit/8b9368ba18cd6d0af5c6b18c0d2fda9513080fa4))
* **db,api,ui:** Trigger deployments based on commit signature filter ([7562f89](https://github.com/klave-network/platform/commit/7562f89b533eae5996be563e2637ff06893856e1))
* **db,constants,api,ui:** Add tracking of commit signatures ([a39311d](https://github.com/klave-network/platform/commit/a39311d03d2f8fa50983958d4a829ec3ab09565f))


### Bug Fixes

* **api,constants:** Ensure the API packages only exposes types to the UI ([d325251](https://github.com/klave-network/platform/commit/d325251033fd05fa895f5058ef97e15b5ff89d51))
* **api,hubber:** Correct forced deployment misfire ([96dbc77](https://github.com/klave-network/platform/commit/96dbc7794da36d1c8070fac3dd7a6e283e8ecfed))
* **api:** Application and deployment must be marked by appId + User session check ([4bf4160](https://github.com/klave-network/platform/commit/4bf41600aaee23122ef1f6cac706e6b96ce5db06))
* **api:** Create personal organisation separately to bypass Prisma bug ([c0e803d](https://github.com/klave-network/platform/commit/c0e803d1121a0875d27b57329b019a984cb82437))
* **api:** Ensure an override on user exist to permit calls from hooks processors ([51587cb](https://github.com/klave-network/platform/commit/51587cbc5d0e6da893025875010dd393f6b553f5))
* **api:** Make sure rpID is set post initialization ([c8ea7bb](https://github.com/klave-network/platform/commit/c8ea7bba2f04b9727869bfa703ab3df3900b198f))
* **api:** Make the slug available through the session API ([a2a2d5e](https://github.com/klave-network/platform/commit/a2a2d5efefb5cb45b36d2f4eace07d3b028e18fc))
* **api:** Optimise deployment query size for listing ([6e6e042](https://github.com/klave-network/platform/commit/6e6e0420e7ff39f631204a5134ead151e223748b))
* **db,api:** User creation did not set the grants appropriately ([bbf60d4](https://github.com/klave-network/platform/commit/bbf60d4508803ca89a647846c89736b0287791b3))

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
