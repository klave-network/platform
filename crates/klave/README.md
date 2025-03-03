# The Klave Rust SDK
Klave is a cloud application platform (PaaS) providing privacy-enabling and zero-trust characteristics for WebAssembly-based applications.
The Klave Rust SDK makes it easy to build Klave applications in Rust.

## Overview

This crate provides the necessary SDK and bindings for the development of Rust application to deploy on Klave.

It covers:
- Using the ledger database
- Making HTTPs outcall
- Making notification
- Using hardware accelerated Cryptography
- and more...

## Getting Started

### Bootstrap
You can start from scratch with `cargo add klave` or
Fork the Rust template app [repository](https://github.com/klave-network/rust-template).

### Develop
Develop your app in Rust with the Klave SDK. Ensure the Rust package you are using are compatible with `wasm`.

### Build
`cargo component build --target wasm32-unknown-unknown --release`

### Deploy
Deploy your app on [Klave](https://klave.com).

## Usage

For detailed usage instructions and SDK reference, please refer to the [documentation](https://docs.klave.com).
```rust
use klave::SCP;

fn main() {
    // Example code demonstrating usage of Secretarium crate
    let secure_channel = SCP::new("gw.klave.network:443");
    // Your code here...
}
```

## Contributing

Contributions to this crate are welcome! If you encounter any bugs or have suggestions for improvements, please open an issue on the GitHub [repository](https://github.com/klave-network/platform.git).

## License

This crate is licensed under the terms detailed in [LICENSE.md](https://github.com/klave-network/platform/blob/main/crates/klave/LICENSE.md)
