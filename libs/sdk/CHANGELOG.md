# Changelog
## [0.8.2](https://github.com/klave-network/platform/compare/sdk@0.8.1...sdk@0.8.2) (2023-12-08)

### Dependency Updates

* `compiler` updated to version `0.8.1`

### Bug Fixes

* Revert dependencies to prevent an assemblyscript failure ([6c251f1](https://github.com/klave-network/platform/commit/6c251f15d1235e11c0bf8f9cd75ac9ebbc6ea46d))

## [0.8.1](///compare/klave-sdk@0.8.0...klave-sdk@0.8.1) (2023-09-07)

### Dependency Updates

* `klave-compiler` updated to version `0.8.0`

### Bug Fixes

* Revert change to package.json generation until Nx 17 0d72132

## [0.8.0](///compare/klave-sdk@0.7.0...klave-sdk@0.8.0) (2023-09-04)

### Dependency Updates

* `klave-compiler` updated to version `0.7.0`

### Features

* **sdk:** Add Ledger key unset method abd8959
* **sdk:** Add subscription marker 8ada39b
* **sdk:** Switching JSON package + Add new HTTP request prototypes 12d45dc


### Bug Fixes

* **sdk,create:** Linking, compilation and target issues d0da049

## [0.7.0](///compare/klave-sdk@0.6.4...klave-sdk@0.7.0) (2023-08-02)

### Dependency Updates

* `klave-compiler` updated to version `0.2.3`

### Features

* **sdk:** Add Light GBM APIs a9217f0
* **sdk:** Finalising Crypto SDK exposition 1de0c79

## [0.6.4](///compare/klave-sdk@0.6.3...klave-sdk@0.6.4) (2023-06-12)

## [0.6.3](///compare/klave-sdk@0.6.2...klave-sdk@0.6.3) (2023-06-02)

### Dependency Updates

* `klave-compiler` updated to version `0.2.1`

### Bug Fixes

* **sdk:** Use synchronous file writing to prevent incomplete writes 5f58df3

## [0.6.2](///compare/klave-sdk@0.6.1...klave-sdk@0.6.2) (2023-05-31)

### Dependency Updates

* `klave-compiler` updated to version `0.2.0`
## [0.6.1](///compare/klave-sdk@0.6.0...klave-sdk@0.6.1) (2023-05-30)


### Bug Fixes

* **sdk:** Correcting Table getArrayBuffer export 10d21fb

## [0.6.0](///compare/klave-sdk@0.5.0...klave-sdk@0.6.0) (2023-05-30)

### Dependency Updates

* `klave-compiler` updated to version `0.1.1`

### Features

* **sdk:** Add Utils API, Context API and extend Notifier API 370c746

## [0.5.0](///compare/klave-sdk@0.4.6...klave-sdk@0.5.0) (2023-05-30)

### Dependency Updates

* `klave-compiler` updated to version `0.1.0`

### Features

* **api,compiler,deployer:** Include JSON transformer for AS compilation ed72c2b

## [0.4.6](///compare/klave-sdk@0.4.5...klave-sdk@0.4.6) (2023-05-16)

### Dependency Updates

* `klave-compiler` updated to version `0.0.4`
## [0.4.5](///compare/trustless-app-sdk@0.4.4...trustless-app-sdk@0.4.5) (2023-05-11)

## [0.4.4](///compare/trustless-app-sdk@0.4.3...trustless-app-sdk@0.4.4) (2023-05-11)

### Dependency Updates

* `klave-compiler` updated to version `0.0.3`

### Bug Fixes

* **klave-compiler,klave-sdk:** Problem leading to compiler freeze + Add bailing e124be5
* **klave-compiler:** Ensure proper export of ESM bindings 147aa09

## [0.4.3](///compare/trustless-app-sdk@0.4.2...trustless-app-sdk@0.4.3) (2023-05-11)

### Dependency Updates

* `klave-compiler` updated to version `0.0.2`

## [0.4.2](///compare/trustless-app-sdk@0.4.1...trustless-app-sdk@0.4.2) (2023-05-10)

### Bug Fixes

* **klave-sdk:** Fixing crash on file absence b3c3535

## [0.4.1](///compare/trustless-app-sdk@0.4.0...trustless-app-sdk@0.4.1) (2023-05-10)

### Dependency Updates

* `klave-compiler` updated to version `0.0.1`

## [0.4.0](///compare/trustless-app-sdk@0.3.2...trustless-app-sdk@0.4.0) (2023-05-10)

### Dependency Updates

* `klave-compiler` updated to version `0.1.0`

### Features

* **klave-compiler:** Split off the wasm compiler into separate library package 36e1f02

## [0.3.2](///compare/trustless-app-sdk@0.3.1...trustless-app-sdk@0.3.2) (2023-02-24)

### Bug Fixes

* **klave-sdk:** Comply with asbuild stricter type checking edd5a20

## [0.3.1](///compare/trustless-app-sdk@0.3.0...trustless-app-sdk@0.3.1) (2023-02-24)

## [0.3.0](///compare/trustless-app-sdk@0.2.1...trustless-app-sdk@0.3.0) (2023-02-24)

### ⚠ BREAKING CHANGES

* Replace SDK structure

### Bug Fixes

* **klave-sdk:** Prevent display of peer dependency warning 59c13da

### Miscellaneous Chores

* Replace SDK structure be5add9

## [0.2.1](///compare/trustless-app-sdk@0.2.0...trustless-app-sdk@0.2.1) (2023-02-08)

### Bug Fixes

* Creator template would incorrectly validate and skeleton the config file 9778524

## 0.2.0 (2023-02-08)

### ⚠ BREAKING CHANGES

* Rename templator and TS sdk

### Miscellaneous Chores

* Rename templator and TS sdk 44903f1

## 0.1.0 (2023-01-29)

### Features

* Switching over to using asb in place of asc for sdk compilation 5157354
* **trustless-app:** Add trustless app typescript helps for developers fd78d16

## 0.0.3 (2023-01-23)

## 0.0.2 (2023-01-23)

## 0.0.1 (2023-01-23)
