# @klave/compiler

The `@klave/compiler` is a Node.js package designed to facilitate the development and deployment of honest applications on the Klave platform. It streamlines the process of compiling AssemblyScript code into WebAssembly (WASM), ensuring seamless integration with Klave's secure and privacy-focused infrastructure.

## Features

- **AssemblyScript to WASM Compilation**: Transforms your AssemblyScript code into optimized WebAssembly binaries suitable for deployment on Klave.
- **Integration with Klave SDK**: Works in tandem with the Klave SDK to provide a cohesive development experience.
- **Command-Line Interface (CLI)**: Offers a straightforward CLI for compiling and managing your projects.

## Installation

To install `@klave/compiler`, use your preferred package manager:

```bash
# Using npm
npm install @klave/compiler --save-dev

# Using yarn
yarn add @klave/compiler --dev
```

## Usage

This package is meant to be used by the Klave platform and is unlikely to find widespread use out of that.

### Programmatic API

You can also use `@klave/compiler` programmatically within your Node.js scripts:

```javascript
const { createCompiler } = require('@klave/compiler');

createCompiler()
  .then((compiler: CompilerHost) => {
    console.log('Handle compilation...');
  })
  .catch((error) => {
    console.error('Compilation failed:', error);
  });
```

## Prerequisites

- **Node.js**: Ensure that Node.js is installed on your system. You can download it from the [official website](https://nodejs.org/).
- **AssemblyScript**: Familiarity with AssemblyScript is recommended for developing applications on Klave. Learn more about AssemblyScript [here](https://www.assemblyscript.org/).

## Resources

- **Klave Documentation**: For comprehensive guides and tutorials on developing and deploying applications on Klave, visit the [Klave Documentation](https://docs.klave.com/).
- **Klave Platform Repository**: Explore the source code and contribute to the Klave platform on GitHub: [klave-network/platform](https://github.com/klave-network/platform).

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/klave-network/platform/blob/main/LICENSE.md) file for details.

---

For any questions or support, please refer to the [Klave Documentation](https://docs.klave.com/) or contact the maintainers through the [Klave Platform Repository](https://github.com/klave-network/platform).
