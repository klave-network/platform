# Changelog
## [0.2.6](https://github.com/klave-network/platform/compare/compiler@0.2.5...compiler@0.2.6) (2023-12-08)


### Bug Fixes

* **compiler:** Bundled compilation would not yield similar minification of Worker code ([5ea7390](https://github.com/klave-network/platform/commit/5ea73904c5b553115dbacbf187695168255db868))
* **hubber,compiler:** Compiler in k8s pods could not locate dependencies in wrong CWD ([9785517](https://github.com/klave-network/platform/commit/978551798e0f0707d30e593d5c624f45b2b39030))

## [0.2.5](///compare/klave-compiler@0.2.4...klave-compiler@0.2.5) (2023-09-07)


### Bug Fixes

* Revert change to package.json generation until Nx 17 0d72132

## [0.2.4](///compare/klave-compiler@0.2.3...klave-compiler@0.2.4) (2023-09-01)

## [0.2.3](///compare/klave-compiler@0.2.2...klave-compiler@0.2.3) (2023-08-02)


### Bug Fixes

* **compiler:** Passthrough existing `register_routes` function 1e02877


### Reverts

* Revert "chore(compiler): Disable compiler optimisation" 8dd8aca

## [0.2.2](///compare/klave-compiler@0.2.1...klave-compiler@0.2.2) (2023-06-13)

## [0.2.1](///compare/klave-compiler@0.2.0...klave-compiler@0.2.1) (2023-06-01)


### Bug Fixes

* **compiler:** Provide protection for entry file not being resolved on first trial 07fcd5e

## [0.2.1](///compare/klave-compiler@0.2.0...klave-compiler@0.2.1) (2023-06-01)


### Bug Fixes

* **compiler:** Provide protection for entry file not being resolved on first trial 07fcd5e

## [0.2.0](///compare/klave-compiler@0.1.1...klave-compiler@0.2.0) (2023-05-31)


### Features

* **compiler:** Enable function rewrite to automate JSON input parsing 0226474

## [0.1.1](///compare/klave-compiler@0.1.0...klave-compiler@0.1.1) (2023-05-30)


### Bug Fixes

* **compiler:** Ensure `typescript` is installed with the compiler d71e835

## [0.1.0](///compare/klave-compiler@0.0.5...klave-compiler@0.1.0) (2023-05-30)


### Features

* **api,compiler,deployer:** Include JSON transformer for AS compilation ed72c2b


### Bug Fixes

* **compiler:** Error output not directed appropriately 8e4eb75

## [0.0.5](///compare/klave-compiler@0.0.4...klave-compiler@0.0.5) (2023-05-16)

## [0.0.4](///compare/klave-compiler@0.0.3...klave-compiler@0.0.4) (2023-05-16)

## [0.0.3](///compare/hubber-compiler@0.0.2...hubber-compiler@0.0.3) (2023-05-11)

### Bug Fixes

* **klave-compiler,klave-sdk:** Problem leading to compiler freeze + Add bailing e124be5
* **klave-compiler:** Ensure proper export of ESM bindings 147aa09

## [0.0.2](///compare/hubber-compiler@0.0.1...hubber-compiler@0.0.2) (2023-05-11)

### Bug Fixes

* **klave-compiler:** Fix dependencies export issues adeef67

## 0.0.1 (2023-05-10)

### Features

* **klave-compiler:** Split off the wasm compiler into separate library package 36e1f02
