# Changelog
## [1.4.3](https://github.com/klave-network/platform/compare/ui@1.4.2...ui@1.4.3) (2025-05-11)

### Dependency Updates

* `api` updated to version `1.4.2`

### Bug Fixes

* **ui:** Ensure Tailwind is wired up correctly ([cb70f25](https://github.com/klave-network/platform/commit/cb70f259068285b1b70312b8b99a7c0b4cd3612d))

## [1.4.2](https://github.com/klave-network/platform/compare/ui@1.4.1...ui@1.4.2) (2025-05-09)

### Dependency Updates

* `constants` updated to version `1.4.1`
* `db` updated to version `1.4.1`
* `api` updated to version `1.4.1`
## [1.4.1](https://github.com/klave-network/platform/compare/ui@1.4.0...ui@1.4.1) (2025-05-08)

## [1.4.0](https://github.com/klave-network/platform/compare/ui@1.3.5...ui@1.4.0) (2025-05-08)

### Dependency Updates

* `constants` updated to version `1.3.5`
* `db` updated to version `1.3.5`
* `api` updated to version `1.3.5`

### Features

* **db,api,providers,hubber,ui,dispatcher,constants:** Add Embedded UI Hosting ([5a748c8](https://github.com/klave-network/platform/commit/5a748c8b616ad3674058517f5bd9c040361fc3c4))

## [1.3.5](https://github.com/klave-network/platform/compare/ui@1.3.4...ui@1.3.5) (2025-05-02)


### Bug Fixes

* **ui:** Attempt to sort out the flickering issue in usage table ([e08bfb9](https://github.com/klave-network/platform/commit/e08bfb96d999fab1dd8719162f58ff773f2254ad))
* **ui:** Change price calculation basis ([2d1f41b](https://github.com/klave-network/platform/commit/2d1f41b9b70cb70a78e7aa67beb9809657a716d6))
* **ui:** Provide usage with total currency amounts ([54c33f6](https://github.com/klave-network/platform/commit/54c33f6eb1c911fb2a3c7c715febb7084fd9fb3a))

## [1.3.4](https://github.com/klave-network/platform/compare/ui@1.3.3...ui@1.3.4) (2025-04-30)

### Dependency Updates

* `constants` updated to version `1.3.3`
* `db` updated to version `1.3.3`
* `api` updated to version `1.3.3`

### Bug Fixes

* **ui,api:** Realign after `simplewebauthn` revert ([e61157e](https://github.com/klave-network/platform/commit/e61157e3834b2cb85d301cc2edbd8fd262b8c4ee))
* **ui:** Display item costs in usages ([99b135e](https://github.com/klave-network/platform/commit/99b135e1dcc56e324402366ad3dbed87f335c925))
* **ui:** Make sure the argDigest is not a Promise object ([70e293b](https://github.com/klave-network/platform/commit/70e293bdb9ea4ce9fc83b308340c6532010e2144))
* **ui:** Manually remove usage duplicates in infinite usage map ([d02e0ff](https://github.com/klave-network/platform/commit/d02e0ff2578f8ec3a676d296f1c029ee6d92fcac))

## [1.3.3](https://github.com/klave-network/platform/compare/ui@1.3.2...ui@1.3.3) (2025-04-29)


### Bug Fixes

* **ui:** Primer CSS import is included higher ([ed6e520](https://github.com/klave-network/platform/commit/ed6e5201a63ef96836dc6dbbca4919926fa9af79))

## [1.3.2](https://github.com/klave-network/platform/compare/ui@1.3.1...ui@1.3.2) (2025-04-28)

### Dependency Updates

* `constants` updated to version `1.3.1`
* `api` updated to version `1.3.1`

### Bug Fixes

* **ui:** Correct a few icons height anchorage ([8321397](https://github.com/klave-network/platform/commit/8321397740c2dc264231048bb39e9bd7f904f526))
* **ui:** Pulsing flask icon not correctly coloured ([a7a084f](https://github.com/klave-network/platform/commit/a7a084fe8a765811b57b3e9716abd3fef354c71b))
* **ui:** Usage table would not display correct cost ([ac0d471](https://github.com/klave-network/platform/commit/ac0d471c622840be9679ec22cc3c0f67102f2b6a))

## [1.3.1](https://github.com/klave-network/platform/compare/ui@1.3.0...ui@1.3.1) (2025-04-11)

### Dependency Updates

* `constants` updated to version `1.3.0`
* `db` updated to version `1.3.0`
* `api` updated to version `1.3.0`

### Bug Fixes

* **db,api,ui:** Upgrade `[@simplewebauthn](https://github.com/simplewebauthn)` and remove padding addition on `credentialID` ([70eb2e1](https://github.com/klave-network/platform/commit/70eb2e1493781e3774c5b7428343e4da510e92d3))
* **ui:** Add required `title` attributes in `RunCommand` ([02b3b59](https://github.com/klave-network/platform/commit/02b3b59e7c20244b2f30e0a8874c98feaef62365))

## [1.3.0](https://github.com/klave-network/platform/compare/ui@1.2.0...ui@1.3.0) (2025-04-10)

### Dependency Updates

* `constants` updated to version `1.2.0`
* `db` updated to version `1.2.0`
* `api` updated to version `1.2.0`

### Bug Fixes

* **ui:** Prevent overactive autoscroll ([7febf66](https://github.com/klave-network/platform/commit/7febf66d553908ea9cf1119dca287097a82bac31))

## [0.13.1](https://github.com/klave-network/platform/compare/ui@1.1.0...ui@0.13.1) (2025-04-07)


### Features

* **db,api,ui:** Preserve deleted deployments and application, recycling bin style ([e32637a](https://github.com/klave-network/platform/commit/e32637a44f2f0c1e4897f05be08d571306d78df9))


### Bug Fixes

* **ui:** Avoid systematic `Unexpected end of JSON input` ([c784c74](https://github.com/klave-network/platform/commit/c784c74426aed5520a04f0815ea697b3bd05deb6))
* **ui:** Prevent UI scroll of doom during compilation ([bd20197](https://github.com/klave-network/platform/commit/bd2019796000188fc9750392c591cfc189b0e5ef))

## [1.2.0](https://github.com/klave-network/platform/compare/ui@1.1.0...ui@1.2.0) (2025-04-10)

### Dependency Updates

* `constants` updated to version `1.1.0`
* `db` updated to version `1.1.0`
* `api` updated to version `1.1.0`

### Features

* **db,api,ui:** Add credit consumption screens ([5452408](https://github.com/klave-network/platform/commit/5452408ac3999d1bef4c20c3cdad82624d96d03a))
* **db,api,ui:** Add new usage format support ([e0910c3](https://github.com/klave-network/platform/commit/e0910c34bf6a6519db1e3ed274845b80e0b9dc11))


### Bug Fixes

* **api:** Rewire kredit setting for queries ([25e4e7c](https://github.com/klave-network/platform/commit/25e4e7c01ce2852665668323a08b5f9ef73dfd3f))
* **ui:** Change inputs font color in darkmode ([1810064](https://github.com/klave-network/platform/commit/1810064eb4114e4fa6707436230dd77fb030d29e))
* **ui:** Prevent overactive autoscroll ([e34e1f9](https://github.com/klave-network/platform/commit/e34e1f9233107c852e6654cdeb98e4d1ca836437))

## [1.1.0](https://github.com/klave-network/platform/compare/ui@1.0.1...ui@1.1.0) (2025-01-23)

### Dependency Updates

* `constants` updated to version `1.0.1`
* `db` updated to version `1.0.1`
* `api` updated to version `1.0.1`

### Features

* **api,ui:** Adding support for setting query spending limits ([928392c](https://github.com/klave-network/platform/commit/928392c28f9d9db92482360befac7db9c6231745))
* **ui,hubber,providers:** Filter node name through ([620d41b](https://github.com/klave-network/platform/commit/620d41b14324e777bf40fe275decbf890458954f))


### Bug Fixes

* **ui:** Correct impossible nesting ([ae2909f](https://github.com/klave-network/platform/commit/ae2909f0699a09e4f687e49255fd86f812486de3))
* **ui:** Explicitly set spinner heights ([27a65bf](https://github.com/klave-network/platform/commit/27a65bfc8e2a966f064c0a5ffa961f31fab6fe97))
* **ui:** Header new logo dimension ([06b8737](https://github.com/klave-network/platform/commit/06b8737b64e6883dc3da08cbe44fe40231ee6d75))

## [1.0.1](https://github.com/klave-network/platform/compare/ui@1.0.0...ui@1.0.1) (2024-10-04)

## [1.0.0](https://github.com/klave-network/platform/compare/ui@0.13.0...ui@1.0.0) (2024-10-04)

### Dependency Updates

* `api` updated to version `0.13.0`
* `constants` updated to version `0.13.0`
* `db` updated to version `0.13.0`

### ⚠ BREAKING CHANGES

* Moving to pure ESM repo

### Bug Fixes

* Package `git-rev-sync` relies on non-ESM features so we provide explicit location ([cee72ae](https://github.com/klave-network/platform/commit/cee72ae5cd5a2fe998c987864b060f039ddb939b))


### Miscellaneous Chores

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

## [0.13.2](https://github.com/klave-network/platform/compare/ui@0.13.2...ui@0.13.2) (2025-04-07)

### Bug Fixes

* **ui:** Prevent overactive autoscroll ([7febf66d](https://github.com/klave-network/platform/commit/7febf66d553908ea9cf1119dca287097a82bac31))

## [0.13.1](https://github.com/klave-network/platform/compare/ui@0.13.0...ui@0.13.1) (2025-04-07)

### Features

* **api,hubber:** Enable Secretarium Connector chunking ([2e916d3f](https://github.com/klave-network/platform/commit/2e916d3f1b42c4d823eb1fef11b2ce353c16321c))

## [0.13.0](https://github.com/klave-network/platform/compare/ui@0.12.0...ui@0.13.0) (2024-08-02)

### Dependency Updates

* `api` updated to version `0.12.0`

### Features

* **api,ui:** Add the ability to add a custom cluster ([fcc3c5f](https://github.com/klave-network/platform/commit/fcc3c5f0f9b76f4e8a5a7826ef64327061b1d096))
* **api,ui:** Allow editing of permission grants for organisations ([e2bd7d2](https://github.com/klave-network/platform/commit/e2bd7d2097b773e2a7151594ee837950298cfe2d)), closes [#KN-232](https://github.com/klave-network/platform/issues/KN-232)


### Bug Fixes

* **ui:** Fix wrong text on members page + Cleanup ([ff6aa83](https://github.com/klave-network/platform/commit/ff6aa83272699bc3fa550322ae323506f0d1f0a6))
* **ui:** Run attestation check again the correct custom cluster ([aa5c2fe](https://github.com/klave-network/platform/commit/aa5c2fe1366cd8ca6a83b82af624eb3741e30eb4))


### Reverts

* Revert "chore(ui): Hide organisation creation button" ([bd3bc9d](https://github.com/klave-network/platform/commit/bd3bc9dc888b4cb98617ca4d3835ccc914c3c596))

## [0.12.0](https://github.com/klave-network/platform/compare/ui@0.11.0...ui@0.12.0) (2024-07-25)

### Dependency Updates

* `constants` updated to version `0.11.0`
* `db` updated to version `0.11.0`
* `api` updated to version `0.11.0`

### Features

* **api,ui:** Add cluster listing in Organisation view ([fbdedfb](https://github.com/klave-network/platform/commit/fbdedfb5162390b242c6a8365a12bf8242dfb702))


### Bug Fixes

* **db,api,ui:** Correct typo in cluster structure declaration ([5fe9160](https://github.com/klave-network/platform/commit/5fe91607dec8aee57d9cb367715d10231169b83a))
* **ui:** Ensure the RunCommand component targets the `wss` protocol ([05a1bec](https://github.com/klave-network/platform/commit/05a1bece3839933ab6bab69319c571038648de57))

## [0.11.0](https://github.com/klave-network/platform/compare/ui@0.10.2...ui@0.11.0) (2024-07-24)

### Dependency Updates

* `constants` updated to version `0.10.2`
* `db` updated to version `0.10.2`
* `api` updated to version `0.10.2`

### Features

* **db,api,providers,constants,ui:** Adding custom deployment target cluster configuration ([6829edd](https://github.com/klave-network/platform/commit/6829edd447621c4c479ba0d687ebdc5f1533272c))

## [0.10.2](https://github.com/klave-network/platform/compare/ui@0.10.1...ui@0.10.2) (2024-07-03)

## [0.10.1](https://github.com/klave-network/platform/compare/ui@0.10.0...ui@0.10.1) (2024-06-07)

### Dependency Updates

* `constants` updated to version `0.10.0`
* `db` updated to version `0.10.0`
* `api` updated to version `0.10.0`
## [0.10.0](https://github.com/klave-network/platform/compare/ui@0.9.2...ui@0.10.0) (2024-05-31)

### Dependency Updates

* `constants` updated to version `0.9.2`
* `db` updated to version `0.9.2`
* `api` updated to version `0.9.2`

### Features

* **db,api,ui:** Add source type/language logo indicator ([d07a296](https://github.com/klave-network/platform/commit/d07a296d29aae51e1d8645786aba736a04aa69b0))
* **db,api,ui:** Provide application options to deploy every commit ([f2e5ac3](https://github.com/klave-network/platform/commit/f2e5ac33fe7fc302c8c25d590c83508b7b05e906))
* **db,constants,api,ui:** Provide full build tracing in UI ([6e6cc10](https://github.com/klave-network/platform/commit/6e6cc10fa13c8c266d78b99697687d8ca1622b8a))
* **ui:** Add Rust non-determinism warning ([76d1417](https://github.com/klave-network/platform/commit/76d14174ebfa387821f8b35603a8a4c2eb3214dc))


### Bug Fixes

* **api,ui:** Setting button for out-of-branch commit deployment has wrong target ([523dc27](https://github.com/klave-network/platform/commit/523dc276a543333537d3c49ec36d35b323a4529a))
* **ui:** Adjust refresh timings for deployment and add auto-scroll for compilations ([f9164e3](https://github.com/klave-network/platform/commit/f9164e363bdc05cbeae01e0900bbded3bbdc86a4))
* **ui:** Ensure registration checks are done against guaranteed strings ([98578b3](https://github.com/klave-network/platform/commit/98578b37baac35cdf7867d139614bd015f55a701)), closes [#KLAVE-PLATFORM-HUBBER-39](https://github.com/klave-network/platform/issues/KLAVE-PLATFORM-HUBBER-39)

## [0.9.2](https://github.com/klave-network/platform/compare/ui@0.9.1...ui@0.9.2) (2024-05-03)

## [0.9.1](https://github.com/klave-network/platform/compare/ui@0.9.0...ui@0.9.1) (2024-05-02)

### Dependency Updates

* `api` updated to version `0.9.0`
## [0.9.0](https://github.com/klave-network/platform/compare/ui@0.8.0...ui@0.9.0) (2024-04-25)

### Dependency Updates

* `constants` updated to version `0.8.0`
* `db` updated to version `0.8.0`
* `api` updated to version `0.8.0`

### Features

* **db,api,ui:** Add support for deploying pre-compiled WASM binaries ([47b7f6f](https://github.com/klave-network/platform/commit/47b7f6f738561f4f1c588452c25b3a6a23141cba))
* **ui:** Add preview map for deployment locations ([153dbcf](https://github.com/klave-network/platform/commit/153dbcf1da9408c0255155b64e2b97374337e748))

## [0.8.0](https://github.com/klave-network/platform/compare/ui@0.7.0...ui@0.8.0) (2024-04-08)

### Dependency Updates

* `constants` updated to version `0.7.0`
* `db` updated to version `0.7.0`
* `api` updated to version `0.7.0`

### Features

* **ui:** Add ability to release from a terminated contract ([28276fe](https://github.com/klave-network/platform/commit/28276fed3c22cf5edadc16f756536a8498380fdc))
* **ui:** Add link to deploy from template on landing page ([dd9ba31](https://github.com/klave-network/platform/commit/dd9ba31ffcf80fbc418f9e1505a750ec4bf685e4))


### Bug Fixes

* **ui:** Typo in expiry timestamps ([389aea6](https://github.com/klave-network/platform/commit/389aea60c947ef0e6dd056927844116a84d3350c))

## [0.7.0](https://github.com/klave-network/platform/compare/ui@0.6.0...ui@0.7.0) (2024-04-05)

### Dependency Updates

* `constants` updated to version `0.6.0`
* `db` updated to version `0.6.0`
* `api` updated to version `0.6.0`

### Features

* **ui:** Add location information ([898b83d](https://github.com/klave-network/platform/commit/898b83d33ebade8296b0d03f9bcc246fef0d08ba))
* **ui:** Adding run-command key basic management ([a3d2414](https://github.com/klave-network/platform/commit/a3d24145b096f27f7dc9c9dc22d329b5aa79b9b4))


### Bug Fixes

* **api,ui:** Githup Tokens need stronger nudge to be recreated ([ae47b8a](https://github.com/klave-network/platform/commit/ae47b8a92a4d0713e2472433d2151ac426e86a2e))
* **ui:** Redirect to the first app page upon creation ([c24eb9c](https://github.com/klave-network/platform/commit/c24eb9c638a7a46f346c9343d4e56d492dc864ae))

## [0.6.0](https://github.com/klave-network/platform/compare/ui@0.5.0...ui@0.6.0) (2024-03-19)

### Dependency Updates

* `constants` updated to version `0.5.0`
* `db` updated to version `0.5.0`
* `api` updated to version `0.5.0`

### Features

* **api,ui:** Add new application listing page for admin + Supplement existing dashboard ([8540fd5](https://github.com/klave-network/platform/commit/8540fd563644e39547b9a9732bed9dc9017d9072))
* **api,ui:** Add view for current running configuration ([c971c65](https://github.com/klave-network/platform/commit/c971c654f858fe249d154e516fc1218fee9efea4))
* **constants,db,api,ui:** Add system dashboard for users and organisations listing ([e3c118f](https://github.com/klave-network/platform/commit/e3c118f1b59b88f5293b4904e704c6e88cbd665a))


### Bug Fixes

* **api,ui:** Parse config from repo scan not returning the correct result ([d0eac7f](https://github.com/klave-network/platform/commit/d0eac7f79e038d50508d87570d960cf45601995e))
* **ui:** Correct application registration issue ([a4919bf](https://github.com/klave-network/platform/commit/a4919bf9e89f492800a0905897a9dc33a8d30ee4))
* **ui:** Disable form default submit for slug updates + Remove extraneous variable tripping Prisma ([218fd2e](https://github.com/klave-network/platform/commit/218fd2e1969412697e894b2662f107568c57757d))
* **ui:** Ensure form are prevented from HTML submitting ([be6a1aa](https://github.com/klave-network/platform/commit/be6a1aafacbf002a6457b14b5441a8c88eef8f34))
* **ui:** Prevent high-level errors from killing saved addresses ([a4d4078](https://github.com/klave-network/platform/commit/a4d4078b8e0e8f1eed4ebc8796b705e7d0bbac66))
* **ui:** Send empty object if args are empty ([c22d70f](https://github.com/klave-network/platform/commit/c22d70f33a4b624bcc6252b1b5eb530a44be247b))
* **ui:** Using `styled-components` v6 for GitHub Primer requires configuration ([62330b3](https://github.com/klave-network/platform/commit/62330b31fcff4d5554ba287c811f6c68d283c800))

## [0.5.0](https://github.com/klave-network/platform/compare/ui@0.4.0...ui@0.5.0) (2023-12-19)

### Dependency Updates

* `db` updated to version `0.4.0`
* `api` updated to version `0.4.0`
* `constants` updated to version `0.4.0`

### Features

* Add Stripe payment for credits ([2a7d7ff](https://github.com/klave-network/platform/commit/2a7d7ff011649c2ae81b97989cd45625326e0776))
* Add support for Organisations ([b4400ce](https://github.com/klave-network/platform/commit/b4400ce5b9603178e8d59d4f6e09f8b0e21eafef))
* **api,hubber,ui:** Provide versions at compile time ([da280b5](https://github.com/klave-network/platform/commit/da280b518d945b29c519341bc3a0755e13e2d836))
* **api,ui:** Provide filtering of disposable email domains ([9357e73](https://github.com/klave-network/platform/commit/9357e73132ef6a79204dcd79ef0ad8b1e08969a2))
* **api,ui:** Provide screen for setting users' own slug ([0d28ecb](https://github.com/klave-network/platform/commit/0d28ecb3bbfe42abacfa2e014a0f647ec6358452))
* **db,api,ui:** Add new permission panel for app settings ([ecca8b6](https://github.com/klave-network/platform/commit/ecca8b62f6247871c2742ee7a420c90f3dad5479))
* **db,api,ui:** Add screen for coupon redeeming ([7f0742e](https://github.com/klave-network/platform/commit/7f0742ed6934725a2e504a8cbfc2a9679a34914b))
* **db,api,ui:** Add transaction spending limit selector ([8b9368b](https://github.com/klave-network/platform/commit/8b9368ba18cd6d0af5c6b18c0d2fda9513080fa4))
* **db,api,ui:** Trigger deployments based on commit signature filter ([7562f89](https://github.com/klave-network/platform/commit/7562f89b533eae5996be563e2637ff06893856e1))
* **db,constants,api,ui:** Add tracking of commit signatures ([a39311d](https://github.com/klave-network/platform/commit/a39311d03d2f8fa50983958d4a829ec3ab09565f))
* **ui:** Add new IFrame-based Secretarium ID ([ba04f40](https://github.com/klave-network/platform/commit/ba04f40873095cc7340440a6827c3c7293dafaba))
* **ui:** Add new useSecretariumQuery hook which support parallel queries ([18d14be](https://github.com/klave-network/platform/commit/18d14bec5687d78ee850be2a1d02789d06d3ce76))
* **ui:** Display multiple errors in the run command window ([96ec17b](https://github.com/klave-network/platform/commit/96ec17bb7383602ee4a49e36944dd7487ecc78b2))


### Bug Fixes

* **api,constants:** Ensure the API packages only exposes types to the UI ([d325251](https://github.com/klave-network/platform/commit/d325251033fd05fa895f5058ef97e15b5ff89d51))
* **ui:** After 96ec17bb the Attestation UI was not updated ([6a0f720](https://github.com/klave-network/platform/commit/6a0f720a72d211cd1c1a143958abe5075c517223))
* **ui:** Application selection for deployment ([19007be](https://github.com/klave-network/platform/commit/19007beaeb5113e39e0e7ea9c512abff8a18ca0b))
* **ui:** Component couldn't be updated while rendering another ([6027b6a](https://github.com/klave-network/platform/commit/6027b6a7b4e492d23e02d2d6e9118267ec34e468))
* **ui:** Component couldn't be updated while rendering another ([ea9a9af](https://github.com/klave-network/platform/commit/ea9a9af653a822ebeb8fa481a40b4716887a4757))
* **ui:** Display correct version numbers in page footer ([55b4f8a](https://github.com/klave-network/platform/commit/55b4f8a14dc75c156c26f4d276a3b164e8491294))
* **ui:** Enable Organisation button in org selection ([ae8cad4](https://github.com/klave-network/platform/commit/ae8cad40bd307f29d7194eb67fd74486f58e17fc))
* **ui:** Ensure immediate redirect when username is set ([c3e38b9](https://github.com/klave-network/platform/commit/c3e38b9173f181741888a39763e343e638a86da6))
* **ui:** Increase refresh interval for application listing ([9289350](https://github.com/klave-network/platform/commit/9289350a540054919f1c5884863b45c0c7caab2b))
* **ui:** Invalidate getByOrganisation when deleting an application ([0ac951a](https://github.com/klave-network/platform/commit/0ac951a29257761ce8f5b612b3bdf6dd14173bb8))
* **ui:** Make sure login can take more than one Webauthn credential ([e0fa7ce](https://github.com/klave-network/platform/commit/e0fa7ce59c051d3aba26e5795bb6662ba2eb49e8))
* **ui:** Perform email check prior to Webauthn enroll ([5dd39ea](https://github.com/klave-network/platform/commit/5dd39ea8ec45af303c46dfdf8a720d3d0664044d))
* **ui:** Remove the credential reference if error occurred ([9950c4f](https://github.com/klave-network/platform/commit/9950c4faad72007761d60dc48984ccfe80ca4cc9))
* **ui:** Send user to the right URL on organisation pages ([5c674e2](https://github.com/klave-network/platform/commit/5c674e2efc042f1e11594ab2dc694d4b89f49eb5))
* **ui:** Wrong date use for expiry display ([212b326](https://github.com/klave-network/platform/commit/212b326046b5eb318cd83ec92e53b7993bfd1486))
* **ui:** Wrong redirection when creating new organisation ([eab2677](https://github.com/klave-network/platform/commit/eab2677075bc8697bcfd58a1752419218e92b226))

## [0.4.0](///compare/klave@0.3.0...klave@0.4.0) (2023-09-27)

### Dependency Updates

* `connector` updated to version `0.3.0`
* `klave-api` updated to version `0.3.0`
* `crypto` updated to version `0.3.0`
* `instrumentation` updated to version `0.3.0`

### Features

* **db,api,klave,deployer:** Add deployment FQDN leaping 221f9a2

### Bug Fixes

* **db,api,klave,providers,hubber:** Target correct default branch and deploy on forced commit 1a6ede1

## [0.3.0](///compare/klave@0.2.2...klave@0.3.0) (2023-09-01)

### Dependency Updates

* `connector` updated to version `0.2.2`
* `klave-api` updated to version `0.2.2`
* `crypto` updated to version `0.2.2`
* `instrumentation` updated to version `0.2.2`

### Features

* **klave:** Add Dependencies and Attestation tabs in Deployment interface 04a10a9
* **klave:** Beautify UI with klave colors + dark theme 689aa60

### Bug Fixes

* **api,klave:** Forcefully expel bad cached credentials 90c1274
* **klave:** Revert style from 689aa601 f489e04

## [0.2.2](///compare/klave@0.2.1...klave@0.2.2) (2023-06-13)

### Dependency Updates

* `klave-api` updated to version `0.3.1`

## [0.2.1](///compare/klave@0.2.0...klave@0.2.1) (2023-06-12)

### Dependency Updates

* `klave-api` updated to version `0.3.0`

### Bug Fixes

* **api,klave:** Ensure WebAuthn enrollement is triggered by default 2009c38

## [0.2.0](///compare/klave@0.1.0...klave@0.2.0) (2023-06-06)

### Dependency Updates

* `klave-api` updated to version `0.2.0`

### Features

* **db,api,klave:** Add support for Webauthn enrollement 85aabab

## 0.1.0 (2023-06-01)

### Dependency Updates

* `klave-api` updated to version `0.1.0`
* `crypto` updated to version `0.1.2`
* `connector` updated to version `0.13.1`
* `instrumentation` updated to version `0.1.1`

### Features

* Add run command screen to the deployments view 8b7095f
* **db,api,klave:** Provide feedback Klave has no GitHub App access 2d9bfa2
* **hubber-api,hubber,klave:** Add capture of `expiresOn` date for deployments 663f854
* **hubber-api,klave:** Implement SCP node info fetching from backend 60d1f8a
* **hubber,klave:** Add output storage and route extraction a7ac061
* Implement identity and web merging 1e16538
* **klave:** Add new setup reception page for app installation 0951d99
* **klave:** Add repository information in the Application settings page f1580b2
* **klave:** Add SHA256 computation of the contract base64 07bdf95
* **klave:** Making application deletion safer 7c1bda2
* New Instrumentation package with Sentry compat 3fbde7d

### Bug Fixes

* **hubber,klave:** Resolve Secretarium URI and key exposition dae9c79
* **klave:** Display error message on /deploy/select route screen fdec8a0
* **klave:** Form submission would trigger double submission d4c9401
* **klave:** Issue with wrong state in the query builder console c163867
* **klave:** Pause the user flow to wait for the repository to be ready d66a28b
* **klave:** Websocket protocol targeting 5ab8486

### Reverts

* Revert "chore(klave): Move to vite for compiling/bundling" 8edc593
