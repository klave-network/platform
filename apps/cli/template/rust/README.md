# Klave App Rust Template
Use this template to help you scaffold a new Rust application.

## Usage
Klave aims to make it easy to build and deploy WebAssembly application within Trusted Execution Environments (TEEs) and leverage the latest
developments in the [WebAssembly component model](https://github.com/WebAssembly/component-model) and [Wasmtime](https://wasmtime.dev/) runtime.
For a more detailed documentation, please read the [Klave docs](https://docs.klave.com/sdk/latest).

## Prerequisites
To use and build this template the following tools must be installed:
- The [Rust Toolchain](https://www.rust-lang.org/tools/install) (incl. rust, rustup, cargo)
- Cargo component : `cargo install cargo-component`
- `wasm32-unknown-unknown` target : `rustup target add wasm32-unknown-unknown`

## Wasm component
Klave apps are `wasm component`.
In this template, three methods are implemented, registered and exposed: 
You can see these methods exposed in the `wit` [interface](https://github.com/klave-network/rust-template/blob/master/apps/rust-template/wit/world.wit):
- `export register-routes: func();`
- `export load-from-ledger: func(cmd: string);`
- `export insert-in-ledger: func(cmd: string);`

1 - The point of entry of the App is the `lib.rs` file and must expose the guest `wasm component` implementation:

```Rust
#[allow(warnings)]
mod bindings;

use bindings::Guest;
use klave;
struct Component;

impl Guest for Component {

    fn register_routes(){
        // By convention it is better to register the route with their wit names.
        // It means replacing the `_` by `-`
        // To call your routes make sure you use the naming you have registered them with.
        klave::router::add_user_query("your-query-1");
        klave::router::add_user_transaction("your-transaction-1");
    }

    fn your_query_1(cmd: String){
        // implement your Query
    }

    fn your_transaction_1(cmd: String){
        // Implement your Transaction
    }
}

bindings::export!(Component with_types_in bindings);
```
Make sure to register each Query or Transaction you want to expose via the `register_routes` method.

2 - Expose your `wasm component` interface in the `wit` file.

```wit
package component:rust-template;

/// An example world for the component to target.
world rust-template {
    export register-routes: func();
    export load-from-ledger: func(cmd: string);
    export insert-in-ledger: func(cmd: string);
}
```
3 - Deploy Your App on Klave

[![Deploy on Klave](https://klave.com/images/deploy-on-klave.svg)](https://app.klave.com/login)

4 - You can also build locally
`cargo component build --target wasm32-unknown-unknown --release`
this also create a `target` folder with the built wasm files in  `target\wasm32-unknown-unknown\release\`

## Authors

This template is created by [Klave](https://klave.com) and [Secretarium](https://secretarium.com) team members, with contributions from:

- Jeremie Labbe ([@jlabbeklavo](https://github.com/jlabbeKlavo)) - [Klave](https://klave.com) | [Secretarium](https://secretarium.com)
- Etienne Bosse ([@Gosu14](https://github.com/Gosu14)) - [Klave](https://klave.com) | [Secretarium](https://secretarium.com)