# Changelog
## [0.17.1](https://github.com/klave-network/platform/compare/sdk@0.17.0...sdk@0.17.1) (2025-06-16)

### Dependency Updates

* `compiler` updated to version `0.17.0`
## [0.17.0](https://github.com/klave-network/platform/compare/sdk@0.16.0...sdk@0.17.0) (2025-06-12)

## [0.16.0](https://github.com/klave-network/platform/compare/sdk@0.15.0...sdk@0.16.0) (2025-06-12)

### Dependency Updates

* `compiler` updated to version `0.15.0`
* `constants` updated to version `0.15.0`

### Features

* **sdk:** Add deriveKey method in AS SDK ([#350](https://github.com/klave-network/platform/issues/350)) ([506d331](https://github.com/klave-network/platform/commit/506d331294d21e3c5661623b7353b19ba16cdf2e))
* **sdk:** Add listKeys and keyExists ledger methods ([ce2b08e](https://github.com/klave-network/platform/commit/ce2b08ef4ce0d319cc42c5f3fd39de802cfdc065))
* **sdk:** Add parse_quote method ([05fb1cd](https://github.com/klave-network/platform/commit/05fb1cd7d79eaa6248690a119362ec02ddac6d47))
* **sdk:** Add qlqereportinfo management in Attestation ([24bd468](https://github.com/klave-network/platform/commit/24bd468ed04924ebc662c625e5886adaf8cc5082))
* **sdk:** KN-307 - Add HMAC in AssemblyScript SDK ([#337](https://github.com/klave-network/platform/issues/337)) ([9df8dad](https://github.com/klave-network/platform/commit/9df8dad8a9148cde1aedc35f05495b0749da5040))
* **sdk:** Update Quote version attribute from int to string to reflect Rust SDK ([af4878a](https://github.com/klave-network/platform/commit/af4878aeb5d48310c6dddd42c807631c18bb1fd0))

### Bug Fixes

* **compiler,sdk,ui-kit:** Wrong dependencies synching done ([f85c41e](https://github.com/klave-network/platform/commit/f85c41eebeeec291692b2c45579ede4f89d6ac94))
* **sdk:** Crypto entry was not cleaned up properly ([bae04eb](https://github.com/klave-network/platform/commit/bae04eb8db33d718186a6acbe04bead21caed29f))
* **sdk:** Revert SWC compiling to ESbuild ([7838266](https://github.com/klave-network/platform/commit/78382661b557cd71894ec3097031f9be2a334ab7))
* **sdk:** Revert to earlier version of `@klave/as-json` ([5ab7f67](https://github.com/klave-network/platform/commit/5ab7f672af061b00c0dcad6b649c3173cd6f443a))

## [0.16.0](https://github.com/klave-network/platform/compare/sdk@0.15.0...sdk@0.16.0) (2025-04-10)

## [0.15.0](https://github.com/klave-network/platform/compare/sdk@0.14.5...sdk@0.15.0) (2025-04-09)

### Dependency Updates

* `compiler` updated to version `0.14.5`
* `constants` updated to version `0.14.5`

### Features

* **sdk:** Add attestation management ([0374250](https://github.com/klave-network/platform/commit/037425065f064ed96a5678174c6142634e946cb6))
* **sdk:** Add current_time parameters to verify_quote ([6acbc93](https://github.com/klave-network/platform/commit/6acbc93ba69e978cbfe4ac23b3ad41c77ac83dcf))

## [0.14.4](https://github.com/klave-network/platform/compare/sdk@0.14.3...sdk@0.14.4) (2025-01-24)

### ⚠ BREAKING CHANGES

* Realigning version with NPM latest published package

### Bug Fixes

* Downgrade `chalk` because of incompatibility with `@klave/sdk` ([35c4e7b](https://github.com/klave-network/platform/commit/35c4e7bd2d8cf8c7634221ad0887edcd158c3c9b))

## [0.14.3](https://github.com/klave-network/platform/compare/sdk@0.14.2...sdk@0.14.3) (2025-01-23)

### Bug Fixes

* **sdk:** Missing dependency for compilation ([a1ee1c8](https://github.com/klave-network/platform/commit/a1ee1c8a9aa4d4c925a014185eac97675aeb3a51))

## [0.14.2](https://github.com/klave-network/platform/compare/sdk@0.14.1...sdk@0.14.2) (2025-01-23)

### Dependency Updates

* `compiler` updated to version `0.14.1`

## [0.14.1](https://github.com/klave-network/platform/compare/sdk@0.14.0...sdk@0.14.1) (2025-01-23)

### Dependency Updates

* `compiler` updated to version `0.14.0`
* `constants` updated to version `0.14.0`

### Bug Fixes

* **sdk:** Fixing up some ESLint configuration ([4bdb53e](https://github.com/klave-network/platform/commit/4bdb53e250aba6f694cf6dd14444bd361ccf432e))

## [0.14.0](https://github.com/klave-network/platform/compare/sdk@0.13.0...sdk@0.14.0) (2024-12-19)

### ⚠ BREAKING CHANGES

* Moving to pure ESM repo

### Features

* **sdk:** Adapt to new wasm native calls ([8b965ef](https://github.com/klave-network/platform/commit/8b965efe55ecfd41962418b9e78bdf89a3328eba))
* **sdk:** Add [@alias](https://github.com/alias) to keep snake_case on backend side ([26a02b2](https://github.com/klave-network/platform/commit/26a02b246c16fd795fd3e4251a736d90d83acfdd))
* **sdk:** Add ABI method that persist ([cde329a](https://github.com/klave-network/platform/commit/cde329a237213eb12eda2d6f46281a8e66177a88))
* **sdk:** Add Crypto_subtle IDL ([cffeecb](https://github.com/klave-network/platform/commit/cffeecb38147d768f0698fa8b23ba065655516fe))
* **sdk:** Add Export of Simple Crypto lib ([e9a8cb1](https://github.com/klave-network/platform/commit/e9a8cb104528dcca809ab3b21a398c840ea7a7b5))
* **sdk:** Add ExportPublicKey and ExportPrivateKey for simple RSA ([ccf7bca](https://github.com/klave-network/platform/commit/ccf7bca712de6dcd4d6e45fa70587652f6c551c4))
* **sdk:** Add getPublicKeyAsCryptoKey and rollback getPublicKey ([7d958a1](https://github.com/klave-network/platform/commit/7d958a1030337ecda2a4381a4da1b9e8370c9dca))
* **sdk:** Add httpVersion and method in HttpRequest ([2c52fcc](https://github.com/klave-network/platform/commit/2c52fcc4e25c029c1a18fbb9c66a970c99db4a2a))
* **sdk:** Add id and alias key management ([9e37da4](https://github.com/klave-network/platform/commit/9e37da42e4c49c784e72dc5e08a4c475e5770941))
* **sdk:** Add keyType in keyPersistParams to be able to save pk ([53c34db](https://github.com/klave-network/platform/commit/53c34dbf1f1ccf785334aa57251de2b278fa06a3))
* **sdk:** Add Parameter Object Type ([97b001d](https://github.com/klave-network/platform/commit/97b001dedf9b1a85a679d1635a33bc627041e8a5))
* **sdk:** Add persistKey method to keep retrocompatibility with saveKey ([2bda249](https://github.com/klave-network/platform/commit/2bda24981bdf4eaf043bad57e489c2207b4d9912))
* **sdk:** Add Result object and modify HttpRequest HttpResponse object ([2551a6d](https://github.com/klave-network/platform/commit/2551a6dc37a5e22a0c76fffb88e226253ffa0e7c))
* **sdk:** Add RSA simple Crypto ([cfcda42](https://github.com/klave-network/platform/commit/cfcda42320ff9a03995ecba47b1599b0e8dc3775))
* **sdk:** Add Simple AES ([7187f9f](https://github.com/klave-network/platform/commit/7187f9f394cc0581fdf3bff0ee1f76d56d7c8ee8))
* **sdk:** Add Simple ECC ([cae44f7](https://github.com/klave-network/platform/commit/cae44f796cc9b59ff5b090515c6cb3e551ecdfd5))
* **sdk:** Add Simple Sha ([7a967fb](https://github.com/klave-network/platform/commit/7a967fb95caa162719f7f15e1439b3371dfc9df8))
* **sdk:** Correct build issue for Crypto_Subtle ([0261270](https://github.com/klave-network/platform/commit/0261270a55dcd74bf2c83558c5959e51437e6342))
* **sdk:** Expose Crypto ECDSA ([13cee5c](https://github.com/klave-network/platform/commit/13cee5c47027e6163db5e0fb3b984369dad85024))
* **sdk:** Fix more issues ([1e65436](https://github.com/klave-network/platform/commit/1e65436a8d9559e289aebe2199e71c25b438f046))
* **sdk:** Fix more issues ([42c8e57](https://github.com/klave-network/platform/commit/42c8e5793a6aa8fb95ec1052e16b0bc568e2b1db))
* **sdk:** Fix more issues with Simple Crypto ([3d9298b](https://github.com/klave-network/platform/commit/3d9298b612f5c33c199ac67e55e1777268ed3807))
* **sdk:** Fix more issues with Subtle Crypto ([9c55ccf](https://github.com/klave-network/platform/commit/9c55ccf64f6e001e9a55a0647b2fddd03b816e44))
* **sdk:** Fix some build issue ([ceebb64](https://github.com/klave-network/platform/commit/ceebb6448ac1e929655943f27fc59c2f2873d1bb))
* **sdk:** Migrate Decrypt ([4561093](https://github.com/klave-network/platform/commit/4561093dc2580f6dc621a1f7d99b536701deee89))
* **sdk:** Migrate digest and generateKey to new format ([b848bbf](https://github.com/klave-network/platform/commit/b848bbf81754a9655f863ab8af082a1ab1e74aa6))
* **sdk:** Migrate Encrypt ([07fbbaf](https://github.com/klave-network/platform/commit/07fbbafac6c24ac78cea81f892e9235f4603fd3a))
* **sdk:** Migrate Import/Export and clean unused method ([ee9efce](https://github.com/klave-network/platform/commit/ee9efce3260dfd0e7e8961ec884fc764c17c1dfc))
* **sdk:** Migrate Sign ([e7652e0](https://github.com/klave-network/platform/commit/e7652e04009f06fe28df2fb51ff32b18dbe93e6c))
* **sdk:** Migrate UnwrapKey ([470e44d](https://github.com/klave-network/platform/commit/470e44de1a11f177461ec20410738cf3b88662b3))
* **sdk:** Migrate Verify ([8a770cc](https://github.com/klave-network/platform/commit/8a770ccd91be2f230156688e20ddaecf5778239f))
* **sdk:** Migrate WrapKey ([c693a90](https://github.com/klave-network/platform/commit/c693a90b2047907437cbdbaa244c990ce2891ab2))
* **sdk:** Rearrange import/export ([1345b04](https://github.com/klave-network/platform/commit/1345b04210a79ff5c47d8e8f7e7acf109d6558f8))
* **sdk:** Return CryptoKey json object and update saveKey method ([acf33f1](https://github.com/klave-network/platform/commit/acf33f1249d9a9aefb08db4bf85516bcc6acce15))
* **sdk:** Simplify Simple Crypto by managing only single key size and reoming import/export ([32e8ad1](https://github.com/klave-network/platform/commit/32e8ad12f4c498542e35e9f3cd3601a8255c3fbc))
* **sdk:** Split Crypto SDK ([11fd900](https://github.com/klave-network/platform/commit/11fd900451dfdfdb5fcf87209ef2200297184c82))
* **sdk:** Update return type of unwrap_key, generate_key and import_key ([c887075](https://github.com/klave-network/platform/commit/c887075aeb3a98e6976bed809057240a13c3de81))
* **sdk:** Use new result-based native calls ([ea08eb9](https://github.com/klave-network/platform/commit/ea08eb937cbcc46219780f9081a540432b4ed531))

### Bug Fixes

* **sdk:** Add missing type in Object declaration, Remove useless import ([36de49a](https://github.com/klave-network/platform/commit/36de49a28e69b8cdc7b777d5240e538d35bc1675))
* **sdk:** Compilation would include wrong `index.ts` via TSConfig ([66a21bf](https://github.com/klave-network/platform/commit/66a21bfa1868a4343ee16a9bd4e56e6ffb39b353))
* **sdk:** Ensuring there are no circular dependencies ([954e522](https://github.com/klave-network/platform/commit/954e522dc87746ca0063b51e89bf303df54429ce))
* **sdk:** Fix [@json](https://github.com/json) decorator casing ([1bfdb6b](https://github.com/klave-network/platform/commit/1bfdb6be8b084a824d7c9470e2ed26aae54a3d79))
* **sdk:** Fix check on returned object type ([eb09880](https://github.com/klave-network/platform/commit/eb0988078a99e25025a973785d5636a8131d7883))
* **sdk:** Fix ECC crypto signature verification result ([08621b9](https://github.com/klave-network/platform/commit/08621b9da9d32e7e2625ecc8096feb5a0c51a5d0))
* **sdk:** Fix incorrect call to slice() ([6dec34f](https://github.com/klave-network/platform/commit/6dec34f2f00194fa18e846c036d3decc556298b9))
* **sdk:** Fix sdk build issues ([0cd5e20](https://github.com/klave-network/platform/commit/0cd5e2006df60f4e0c1f8d86e57b45f88aa850a3))
* **sdk:** Fix serialisation Uint8Array serialisation issue ([9babd5d](https://github.com/klave-network/platform/commit/9babd5d27d39845d07a748499958e54c099a685b))
* **sdk:** Fix string encoding ([16fa53e](https://github.com/klave-network/platform/commit/16fa53e06a06f07fdbdcd4a065251add84935f44))
* **sdk:** Remove debug notification ([5fa2806](https://github.com/klave-network/platform/commit/5fa2806db39ef6ecb401def4dc64026bffa86879))
* **sdk:** Remove useless algoName in Crypto.Subtle ([2364c48](https://github.com/klave-network/platform/commit/2364c4854c2202903a1f4115d0434ca2f6ce2efc))
* **sdk:** Revert configuration change leading to failed package ([cef5f1b](https://github.com/klave-network/platform/commit/cef5f1b3970ded0ba3a6e377638a02a1fbe37a65))

### Miscellaneous Chores

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

## [0.13.0](https://github.com/klave-network/platform/compare/sdk@0.12.0...sdk@0.13.0) (2024-12-19)

### ⚠ BREAKING CHANGES

* Moving to pure ESM repo

### Features

* **sdk:** Adapt to new wasm native calls ([8b965ef](https://github.com/klave-network/platform/commit/8b965efe55ecfd41962418b9e78bdf89a3328eba))
* **sdk:** Add [@alias](https://github.com/alias) to keep snake_case on backend side ([26a02b2](https://github.com/klave-network/platform/commit/26a02b246c16fd795fd3e4251a736d90d83acfdd))
* **sdk:** Add ABI method that persist ([cde329a](https://github.com/klave-network/platform/commit/cde329a237213eb12eda2d6f46281a8e66177a88))
* **sdk:** Add Crypto_subtle IDL ([cffeecb](https://github.com/klave-network/platform/commit/cffeecb38147d768f0698fa8b23ba065655516fe))
* **sdk:** Add Export of Simple Crypto lib ([e9a8cb1](https://github.com/klave-network/platform/commit/e9a8cb104528dcca809ab3b21a398c840ea7a7b5))
* **sdk:** Add ExportPublicKey and ExportPrivateKey for simple RSA ([ccf7bca](https://github.com/klave-network/platform/commit/ccf7bca712de6dcd4d6e45fa70587652f6c551c4))
* **sdk:** Add getPublicKeyAsCryptoKey and rollback getPublicKey ([7d958a1](https://github.com/klave-network/platform/commit/7d958a1030337ecda2a4381a4da1b9e8370c9dca))
* **sdk:** Add httpVersion and method in HttpRequest ([2c52fcc](https://github.com/klave-network/platform/commit/2c52fcc4e25c029c1a18fbb9c66a970c99db4a2a))
* **sdk:** Add id and alias key management ([9e37da4](https://github.com/klave-network/platform/commit/9e37da42e4c49c784e72dc5e08a4c475e5770941))
* **sdk:** Add keyType in keyPersistParams to be able to save pk ([53c34db](https://github.com/klave-network/platform/commit/53c34dbf1f1ccf785334aa57251de2b278fa06a3))
* **sdk:** Add Parameter Object Type ([97b001d](https://github.com/klave-network/platform/commit/97b001dedf9b1a85a679d1635a33bc627041e8a5))
* **sdk:** Add persistKey method to keep retrocompatibility with saveKey ([2bda249](https://github.com/klave-network/platform/commit/2bda24981bdf4eaf043bad57e489c2207b4d9912))
* **sdk:** Add Result object and modify HttpRequest HttpResponse object ([2551a6d](https://github.com/klave-network/platform/commit/2551a6dc37a5e22a0c76fffb88e226253ffa0e7c))
* **sdk:** Add RSA simple Crypto ([cfcda42](https://github.com/klave-network/platform/commit/cfcda42320ff9a03995ecba47b1599b0e8dc3775))
* **sdk:** Add Simple AES ([7187f9f](https://github.com/klave-network/platform/commit/7187f9f394cc0581fdf3bff0ee1f76d56d7c8ee8))
* **sdk:** Add Simple ECC ([cae44f7](https://github.com/klave-network/platform/commit/cae44f796cc9b59ff5b090515c6cb3e551ecdfd5))
* **sdk:** Add Simple Sha ([7a967fb](https://github.com/klave-network/platform/commit/7a967fb95caa162719f7f15e1439b3371dfc9df8))
* **sdk:** Correct build issue for Crypto_Subtle ([0261270](https://github.com/klave-network/platform/commit/0261270a55dcd74bf2c83558c5959e51437e6342))
* **sdk:** Expose Crypto ECDSA ([13cee5c](https://github.com/klave-network/platform/commit/13cee5c47027e6163db5e0fb3b984369dad85024))
* **sdk:** Fix more issues ([1e65436](https://github.com/klave-network/platform/commit/1e65436a8d9559e289aebe2199e71c25b438f046))
* **sdk:** Fix more issues ([42c8e57](https://github.com/klave-network/platform/commit/42c8e5793a6aa8fb95ec1052e16b0bc568e2b1db))
* **sdk:** Fix more issues with Simple Crypto ([3d9298b](https://github.com/klave-network/platform/commit/3d9298b612f5c33c199ac67e55e1777268ed3807))
* **sdk:** Fix more issues with Subtle Crypto ([9c55ccf](https://github.com/klave-network/platform/commit/9c55ccf64f6e001e9a55a0647b2fddd03b816e44))
* **sdk:** Fix some build issue ([ceebb64](https://github.com/klave-network/platform/commit/ceebb6448ac1e929655943f27fc59c2f2873d1bb))
* **sdk:** Migrate Decrypt ([4561093](https://github.com/klave-network/platform/commit/4561093dc2580f6dc621a1f7d99b536701deee89))
* **sdk:** Migrate digest and generateKey to new format ([b848bbf](https://github.com/klave-network/platform/commit/b848bbf81754a9655f863ab8af082a1ab1e74aa6))
* **sdk:** Migrate Encrypt ([07fbbaf](https://github.com/klave-network/platform/commit/07fbbafac6c24ac78cea81f892e9235f4603fd3a))
* **sdk:** Migrate Import/Export and clean unused method ([ee9efce](https://github.com/klave-network/platform/commit/ee9efce3260dfd0e7e8961ec884fc764c17c1dfc))
* **sdk:** Migrate Sign ([e7652e0](https://github.com/klave-network/platform/commit/e7652e04009f06fe28df2fb51ff32b18dbe93e6c))
* **sdk:** Migrate UnwrapKey ([470e44d](https://github.com/klave-network/platform/commit/470e44de1a11f177461ec20410738cf3b88662b3))
* **sdk:** Migrate Verify ([8a770cc](https://github.com/klave-network/platform/commit/8a770ccd91be2f230156688e20ddaecf5778239f))
* **sdk:** Migrate WrapKey ([c693a90](https://github.com/klave-network/platform/commit/c693a90b2047907437cbdbaa244c990ce2891ab2))
* **sdk:** Rearrange import/export ([1345b04](https://github.com/klave-network/platform/commit/1345b04210a79ff5c47d8e8f7e7acf109d6558f8))
* **sdk:** Return CryptoKey json object and update saveKey method ([acf33f1](https://github.com/klave-network/platform/commit/acf33f1249d9a9aefb08db4bf85516bcc6acce15))
* **sdk:** Simplify Simple Crypto by managing only single key size and reoming import/export ([32e8ad1](https://github.com/klave-network/platform/commit/32e8ad12f4c498542e35e9f3cd3601a8255c3fbc))
* **sdk:** Split Crypto SDK ([11fd900](https://github.com/klave-network/platform/commit/11fd900451dfdfdb5fcf87209ef2200297184c82))
* **sdk:** Update return type of unwrap_key, generate_key and import_key ([c887075](https://github.com/klave-network/platform/commit/c887075aeb3a98e6976bed809057240a13c3de81))
* **sdk:** Use new result-based native calls ([ea08eb9](https://github.com/klave-network/platform/commit/ea08eb937cbcc46219780f9081a540432b4ed531))

### Bug Fixes

* **sdk:** Add missing type in Object declaration, Remove useless import ([36de49a](https://github.com/klave-network/platform/commit/36de49a28e69b8cdc7b777d5240e538d35bc1675))
* **sdk:** Compilation would include wrong `index.ts` via TSConfig ([66a21bf](https://github.com/klave-network/platform/commit/66a21bfa1868a4343ee16a9bd4e56e6ffb39b353))
* **sdk:** Ensuring there are no circular dependencies ([954e522](https://github.com/klave-network/platform/commit/954e522dc87746ca0063b51e89bf303df54429ce))
* **sdk:** Fix [@json](https://github.com/json) decorator casing ([1bfdb6b](https://github.com/klave-network/platform/commit/1bfdb6be8b084a824d7c9470e2ed26aae54a3d79))
* **sdk:** Fix check on returned object type ([eb09880](https://github.com/klave-network/platform/commit/eb0988078a99e25025a973785d5636a8131d7883))
* **sdk:** Fix ECC crypto signature verification result ([08621b9](https://github.com/klave-network/platform/commit/08621b9da9d32e7e2625ecc8096feb5a0c51a5d0))
* **sdk:** Fix incorrect call to slice() ([6dec34f](https://github.com/klave-network/platform/commit/6dec34f2f00194fa18e846c036d3decc556298b9))
* **sdk:** Fix sdk build issues ([0cd5e20](https://github.com/klave-network/platform/commit/0cd5e2006df60f4e0c1f8d86e57b45f88aa850a3))
* **sdk:** Fix serialisation Uint8Array serialisation issue ([9babd5d](https://github.com/klave-network/platform/commit/9babd5d27d39845d07a748499958e54c099a685b))
* **sdk:** Fix string encoding ([16fa53e](https://github.com/klave-network/platform/commit/16fa53e06a06f07fdbdcd4a065251add84935f44))
* **sdk:** Remove debug notification ([5fa2806](https://github.com/klave-network/platform/commit/5fa2806db39ef6ecb401def4dc64026bffa86879))
* **sdk:** Remove useless algoName in Crypto.Subtle ([2364c48](https://github.com/klave-network/platform/commit/2364c4854c2202903a1f4115d0434ca2f6ce2efc))
* **sdk:** Revert configuration change leading to failed package ([cef5f1b](https://github.com/klave-network/platform/commit/cef5f1b3970ded0ba3a6e377638a02a1fbe37a65))

### Miscellaneous Chores

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

## [0.13.0](https://github.com/klave-network/platform/compare/sdk@0.12.0...sdk@0.13.0) (2024-12-19)

### ⚠ BREAKING CHANGES

* Moving to pure ESM repo

### Features

* **sdk:** Adapt to new wasm native calls ([8b965ef](https://github.com/klave-network/platform/commit/8b965efe55ecfd41962418b9e78bdf89a3328eba))
* **sdk:** Add [@alias](https://github.com/alias) to keep snake_case on backend side ([26a02b2](https://github.com/klave-network/platform/commit/26a02b246c16fd795fd3e4251a736d90d83acfdd))
* **sdk:** Add ABI method that persist ([cde329a](https://github.com/klave-network/platform/commit/cde329a237213eb12eda2d6f46281a8e66177a88))
* **sdk:** Add Crypto_subtle IDL ([cffeecb](https://github.com/klave-network/platform/commit/cffeecb38147d768f0698fa8b23ba065655516fe))
* **sdk:** Add Export of Simple Crypto lib ([e9a8cb1](https://github.com/klave-network/platform/commit/e9a8cb104528dcca809ab3b21a398c840ea7a7b5))
* **sdk:** Add ExportPublicKey and ExportPrivateKey for simple RSA ([ccf7bca](https://github.com/klave-network/platform/commit/ccf7bca712de6dcd4d6e45fa70587652f6c551c4))
* **sdk:** Add getPublicKeyAsCryptoKey and rollback getPublicKey ([7d958a1](https://github.com/klave-network/platform/commit/7d958a1030337ecda2a4381a4da1b9e8370c9dca))
* **sdk:** Add httpVersion and method in HttpRequest ([2c52fcc](https://github.com/klave-network/platform/commit/2c52fcc4e25c029c1a18fbb9c66a970c99db4a2a))
* **sdk:** Add id and alias key management ([9e37da4](https://github.com/klave-network/platform/commit/9e37da42e4c49c784e72dc5e08a4c475e5770941))
* **sdk:** Add keyType in keyPersistParams to be able to save pk ([53c34db](https://github.com/klave-network/platform/commit/53c34dbf1f1ccf785334aa57251de2b278fa06a3))
* **sdk:** Add Parameter Object Type ([97b001d](https://github.com/klave-network/platform/commit/97b001dedf9b1a85a679d1635a33bc627041e8a5))
* **sdk:** Add persistKey method to keep retrocompatibility with saveKey ([2bda249](https://github.com/klave-network/platform/commit/2bda24981bdf4eaf043bad57e489c2207b4d9912))
* **sdk:** Add Result object and modify HttpRequest HttpResponse object ([2551a6d](https://github.com/klave-network/platform/commit/2551a6dc37a5e22a0c76fffb88e226253ffa0e7c))
* **sdk:** Add RSA simple Crypto ([cfcda42](https://github.com/klave-network/platform/commit/cfcda42320ff9a03995ecba47b1599b0e8dc3775))
* **sdk:** Add Simple AES ([7187f9f](https://github.com/klave-network/platform/commit/7187f9f394cc0581fdf3bff0ee1f76d56d7c8ee8))
* **sdk:** Add Simple ECC ([cae44f7](https://github.com/klave-network/platform/commit/cae44f796cc9b59ff5b090515c6cb3e551ecdfd5))
* **sdk:** Add Simple Sha ([7a967fb](https://github.com/klave-network/platform/commit/7a967fb95caa162719f7f15e1439b3371dfc9df8))
* **sdk:** Correct build issue for Crypto_Subtle ([0261270](https://github.com/klave-network/platform/commit/0261270a55dcd74bf2c83558c5959e51437e6342))
* **sdk:** Expose Crypto ECDSA ([13cee5c](https://github.com/klave-network/platform/commit/13cee5c47027e6163db5e0fb3b984369dad85024))
* **sdk:** Fix more issues ([1e65436](https://github.com/klave-network/platform/commit/1e65436a8d9559e289aebe2199e71c25b438f046))
* **sdk:** Fix more issues ([42c8e57](https://github.com/klave-network/platform/commit/42c8e5793a6aa8fb95ec1052e16b0bc568e2b1db))
* **sdk:** Fix more issues with Simple Crypto ([3d9298b](https://github.com/klave-network/platform/commit/3d9298b612f5c33c199ac67e55e1777268ed3807))
* **sdk:** Fix more issues with Subtle Crypto ([9c55ccf](https://github.com/klave-network/platform/commit/9c55ccf64f6e001e9a55a0647b2fddd03b816e44))
* **sdk:** Fix some build issue ([ceebb64](https://github.com/klave-network/platform/commit/ceebb6448ac1e929655943f27fc59c2f2873d1bb))
* **sdk:** Migrate Decrypt ([4561093](https://github.com/klave-network/platform/commit/4561093dc2580f6dc621a1f7d99b536701deee89))
* **sdk:** Migrate digest and generateKey to new format ([b848bbf](https://github.com/klave-network/platform/commit/b848bbf81754a9655f863ab8af082a1ab1e74aa6))
* **sdk:** Migrate Encrypt ([07fbbaf](https://github.com/klave-network/platform/commit/07fbbafac6c24ac78cea81f892e9235f4603fd3a))
* **sdk:** Migrate Import/Export and clean unused method ([ee9efce](https://github.com/klave-network/platform/commit/ee9efce3260dfd0e7e8961ec884fc764c17c1dfc))
* **sdk:** Migrate Sign ([e7652e0](https://github.com/klave-network/platform/commit/e7652e04009f06fe28df2fb51ff32b18dbe93e6c))
* **sdk:** Migrate UnwrapKey ([470e44d](https://github.com/klave-network/platform/commit/470e44de1a11f177461ec20410738cf3b88662b3))
* **sdk:** Migrate Verify ([8a770cc](https://github.com/klave-network/platform/commit/8a770ccd91be2f230156688e20ddaecf5778239f))
* **sdk:** Migrate WrapKey ([c693a90](https://github.com/klave-network/platform/commit/c693a90b2047907437cbdbaa244c990ce2891ab2))
* **sdk:** Rearrange import/export ([1345b04](https://github.com/klave-network/platform/commit/1345b04210a79ff5c47d8e8f7e7acf109d6558f8))
* **sdk:** Return CryptoKey json object and update saveKey method ([acf33f1](https://github.com/klave-network/platform/commit/acf33f1249d9a9aefb08db4bf85516bcc6acce15))
* **sdk:** Simplify Simple Crypto by managing only single key size and reoming import/export ([32e8ad1](https://github.com/klave-network/platform/commit/32e8ad12f4c498542e35e9f3cd3601a8255c3fbc))
* **sdk:** Split Crypto SDK ([11fd900](https://github.com/klave-network/platform/commit/11fd900451dfdfdb5fcf87209ef2200297184c82))
* **sdk:** Update return type of unwrap_key, generate_key and import_key ([c887075](https://github.com/klave-network/platform/commit/c887075aeb3a98e6976bed809057240a13c3de81))
* **sdk:** Use new result-based native calls ([ea08eb9](https://github.com/klave-network/platform/commit/ea08eb937cbcc46219780f9081a540432b4ed531))

### Bug Fixes

* **sdk:** Add missing type in Object declaration, Remove useless import ([36de49a](https://github.com/klave-network/platform/commit/36de49a28e69b8cdc7b777d5240e538d35bc1675))
* **sdk:** Compilation would include wrong `index.ts` via TSConfig ([66a21bf](https://github.com/klave-network/platform/commit/66a21bfa1868a4343ee16a9bd4e56e6ffb39b353))
* **sdk:** Ensuring there are no circular dependencies ([954e522](https://github.com/klave-network/platform/commit/954e522dc87746ca0063b51e89bf303df54429ce))
* **sdk:** Fix [@json](https://github.com/json) decorator casing ([1bfdb6b](https://github.com/klave-network/platform/commit/1bfdb6be8b084a824d7c9470e2ed26aae54a3d79))
* **sdk:** Fix check on returned object type ([eb09880](https://github.com/klave-network/platform/commit/eb0988078a99e25025a973785d5636a8131d7883))
* **sdk:** Fix ECC crypto signature verification result ([08621b9](https://github.com/klave-network/platform/commit/08621b9da9d32e7e2625ecc8096feb5a0c51a5d0))
* **sdk:** Fix incorrect call to slice() ([6dec34f](https://github.com/klave-network/platform/commit/6dec34f2f00194fa18e846c036d3decc556298b9))
* **sdk:** Fix sdk build issues ([0cd5e20](https://github.com/klave-network/platform/commit/0cd5e2006df60f4e0c1f8d86e57b45f88aa850a3))
* **sdk:** Fix serialisation Uint8Array serialisation issue ([9babd5d](https://github.com/klave-network/platform/commit/9babd5d27d39845d07a748499958e54c099a685b))
* **sdk:** Fix string encoding ([16fa53e](https://github.com/klave-network/platform/commit/16fa53e06a06f07fdbdcd4a065251add84935f44))
* **sdk:** Remove debug notification ([5fa2806](https://github.com/klave-network/platform/commit/5fa2806db39ef6ecb401def4dc64026bffa86879))
* **sdk:** Remove useless algoName in Crypto.Subtle ([2364c48](https://github.com/klave-network/platform/commit/2364c4854c2202903a1f4115d0434ca2f6ce2efc))
* **sdk:** Revert configuration change leading to failed package ([cef5f1b](https://github.com/klave-network/platform/commit/cef5f1b3970ded0ba3a6e377638a02a1fbe37a65))

### Miscellaneous Chores

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

# **Changelog**

## [**0.13.0**](https://github.com/klave-network/platform/compare/sdk@0.12.0...sdk@0.13.0)**(2024-11-12)**

### **⚠ BREAKING CHANGES**

* Moving to pure ESM repo

### **Features**

* **sdk:** Adapt to new wasm native calls ([8b965ef](https://github.com/klave-network/platform/commit/8b965efe55ecfd41962418b9e78bdf89a3328eba))

* **sdk:** Add ABI method that persist ([cde329a](https://github.com/klave-network/platform/commit/cde329a237213eb12eda2d6f46281a8e66177a88))

* **sdk:** Add Crypto_subtle IDL ([cffeecb](https://github.com/klave-network/platform/commit/cffeecb38147d768f0698fa8b23ba065655516fe))

* **sdk:** Add Export of Simple Crypto lib ([e9a8cb1](https://github.com/klave-network/platform/commit/e9a8cb104528dcca809ab3b21a398c840ea7a7b5))

* **sdk:** Add ExportPublicKey and ExportPrivateKey for simple RSA ([ccf7bca](https://github.com/klave-network/platform/commit/ccf7bca712de6dcd4d6e45fa70587652f6c551c4))

* **sdk:** Add httpVersion and method in HttpRequest ([2c52fcc](https://github.com/klave-network/platform/commit/2c52fcc4e25c029c1a18fbb9c66a970c99db4a2a))

* **sdk:** Add Parameter Object Type ([97b001d](https://github.com/klave-network/platform/commit/97b001dedf9b1a85a679d1635a33bc627041e8a5))

* **sdk:** Add Result object and modify HttpRequest HttpResponse object ([2551a6d](https://github.com/klave-network/platform/commit/2551a6dc37a5e22a0c76fffb88e226253ffa0e7c))

* **sdk:** Add RSA simple Crypto ([cfcda42](https://github.com/klave-network/platform/commit/cfcda42320ff9a03995ecba47b1599b0e8dc3775))

* **sdk:** Add Simple AES ([7187f9f](https://github.com/klave-network/platform/commit/7187f9f394cc0581fdf3bff0ee1f76d56d7c8ee8))

* **sdk:** Add Simple ECC ([cae44f7](https://github.com/klave-network/platform/commit/cae44f796cc9b59ff5b090515c6cb3e551ecdfd5))

* **sdk:** Add Simple Sha ([7a967fb](https://github.com/klave-network/platform/commit/7a967fb95caa162719f7f15e1439b3371dfc9df8))

* **sdk:** Correct build issue for Crypto_Subtle ([0261270](https://github.com/klave-network/platform/commit/0261270a55dcd74bf2c83558c5959e51437e6342))

* **sdk:** Expose Crypto ECDSA ([13cee5c](https://github.com/klave-network/platform/commit/13cee5c47027e6163db5e0fb3b984369dad85024))

* **sdk:** Fix more issues ([1e65436](https://github.com/klave-network/platform/commit/1e65436a8d9559e289aebe2199e71c25b438f046))

* **sdk:** Fix more issues ([42c8e57](https://github.com/klave-network/platform/commit/42c8e5793a6aa8fb95ec1052e16b0bc568e2b1db))

* **sdk:** Fix more issues with Simple Crypto ([3d9298b](https://github.com/klave-network/platform/commit/3d9298b612f5c33c199ac67e55e1777268ed3807))

* **sdk:** Fix more issues with Subtle Crypto ([9c55ccf](https://github.com/klave-network/platform/commit/9c55ccf64f6e001e9a55a0647b2fddd03b816e44))

* **sdk:** Fix some build issue ([ceebb64](https://github.com/klave-network/platform/commit/ceebb6448ac1e929655943f27fc59c2f2873d1bb))

* **sdk:** Migrate Decrypt ([4561093](https://github.com/klave-network/platform/commit/4561093dc2580f6dc621a1f7d99b536701deee89))

* **sdk:** Migrate digest and generateKey to new format ([b848bbf](https://github.com/klave-network/platform/commit/b848bbf81754a9655f863ab8af082a1ab1e74aa6))

* **sdk:** Migrate Encrypt ([07fbbaf](https://github.com/klave-network/platform/commit/07fbbafac6c24ac78cea81f892e9235f4603fd3a))

* **sdk:** Migrate Import/Export and clean unused method ([ee9efce](https://github.com/klave-network/platform/commit/ee9efce3260dfd0e7e8961ec884fc764c17c1dfc))

* **sdk:** Migrate Sign ([e7652e0](https://github.com/klave-network/platform/commit/e7652e04009f06fe28df2fb51ff32b18dbe93e6c))

* **sdk:** Migrate UnwrapKey ([470e44d](https://github.com/klave-network/platform/commit/470e44de1a11f177461ec20410738cf3b88662b3))

* **sdk:** Migrate Verify ([8a770cc](https://github.com/klave-network/platform/commit/8a770ccd91be2f230156688e20ddaecf5778239f))

* **sdk:** Migrate WrapKey ([c693a90](https://github.com/klave-network/platform/commit/c693a90b2047907437cbdbaa244c990ce2891ab2))

* **sdk:** Rearrange import/export ([1345b04](https://github.com/klave-network/platform/commit/1345b04210a79ff5c47d8e8f7e7acf109d6558f8))

* **sdk:** Simplify Simple Crypto by managing only single key size and reoming import/export ([32e8ad1](https://github.com/klave-network/platform/commit/32e8ad12f4c498542e35e9f3cd3601a8255c3fbc))

* **sdk:** Split Crypto SDK ([11fd900](https://github.com/klave-network/platform/commit/11fd900451dfdfdb5fcf87209ef2200297184c82))

* **sdk:** Use new result-based native calls ([ea08eb9](https://github.com/klave-network/platform/commit/ea08eb937cbcc46219780f9081a540432b4ed531))

### **Bug Fixes**

* **sdk:** Add missing type in Object declaration, Remove useless import ([36de49a](https://github.com/klave-network/platform/commit/36de49a28e69b8cdc7b777d5240e538d35bc1675))

* **sdk:** Compilation would include wrong `index.ts` via TSConfig ([66a21bf](https://github.com/klave-network/platform/commit/66a21bfa1868a4343ee16a9bd4e56e6ffb39b353))

* **sdk:** Ensuring there are no circular dependencies ([954e522](https://github.com/klave-network/platform/commit/954e522dc87746ca0063b51e89bf303df54429ce))

* **sdk:** Fix [@json](https://github.com/json) decorator casing ([1bfdb6b](https://github.com/klave-network/platform/commit/1bfdb6be8b084a824d7c9470e2ed26aae54a3d79))

* **sdk:** Fix check on returned object type ([eb09880](https://github.com/klave-network/platform/commit/eb0988078a99e25025a973785d5636a8131d7883))

* **sdk:** Fix ECC crypto signature verification result ([08621b9](https://github.com/klave-network/platform/commit/08621b9da9d32e7e2625ecc8096feb5a0c51a5d0))

* **sdk:** Fix incorrect call to slice() ([6dec34f](https://github.com/klave-network/platform/commit/6dec34f2f00194fa18e846c036d3decc556298b9))

* **sdk:** Fix sdk build issues ([0cd5e20](https://github.com/klave-network/platform/commit/0cd5e2006df60f4e0c1f8d86e57b45f88aa850a3))

* **sdk:** Fix serialisation Uint8Array serialisation issue ([9babd5d](https://github.com/klave-network/platform/commit/9babd5d27d39845d07a748499958e54c099a685b))

* **sdk:** Fix string encoding ([16fa53e](https://github.com/klave-network/platform/commit/16fa53e06a06f07fdbdcd4a065251add84935f44))

* **sdk:** Remove debug notification ([5fa2806](https://github.com/klave-network/platform/commit/5fa2806db39ef6ecb401def4dc64026bffa86879))

* **sdk:** Remove useless algoName in Crypto.Subtle ([2364c48](https://github.com/klave-network/platform/commit/2364c4854c2202903a1f4115d0434ca2f6ce2efc))

* **sdk:** Revert configuration change leading to failed package ([cef5f1b](https://github.com/klave-network/platform/commit/cef5f1b3970ded0ba3a6e377638a02a1fbe37a65))

### **Miscellaneous Chores**

* Moving to pure ESM repo ([377c0e7](https://github.com/klave-network/platform/commit/377c0e7413441ad3fbca90ec5967d668d871a98b))

## [**0.12.0**](https://github.com/klave-network/platform/compare/sdk@0.11.0...sdk@0.12.0)**(2024-06-06)**

### **Dependency Updates**

* `compiler` updated to version `0.11.0`

* `constants` updated to version `0.11.0`

### **Features**

* **sdk:** Add format to get_public_key and modify formats ([606017d](https://github.com/klave-network/platform/commit/606017d0363f4458843b4d086c18f5e036ee03bd))

* **sdk:** Adding SubtleCrypto ([628e5e8](https://github.com/klave-network/platform/commit/628e5e8f1c91b763198fe4f1b598e88458923b25))

* **sdk:** Rename derive_key into derive_public_key ([d06fe72](https://github.com/klave-network/platform/commit/d06fe72daed7fc97e9d09dfac5805c6b49e496fe))

### **Bug Fixes**

* **sdk:** Add backward compatibility for algorithm ([04b0e71](https://github.com/klave-network/platform/commit/04b0e7181e7216969baf77e9b0701d03da88a337))

* **sdk:** Pass `byteLength` for `importKey` and sort out `usages` buffer size ([1d4c708](https://github.com/klave-network/platform/commit/1d4c708d1978af3607ee403f30b21b63ab9e9790))

* **sdk:** Refactor using SubtleCrypto ([06273fd](https://github.com/klave-network/platform/commit/06273fdacffe7c4ae12c2683e056efe77840d0db))

* **sdk:** Remove unnecessary console import ([5080a21](https://github.com/klave-network/platform/commit/5080a2180818439dcbad9f5f65e8782bbef771c6))

* **sdk:** Remove useless derive_public_key method ([c0c8240](https://github.com/klave-network/platform/commit/c0c8240d94542eba5b3029b002b9ecc4135f5d73))

* **sdk:** Rename deriveKey in derivePublicKey to match Core SDK current impl ([96225d4](https://github.com/klave-network/platform/commit/96225d41eb45cf26e7936a54ac05125b6c0c4857))

* **sdk:** Rename get_public_key into get_public_key_format for retrocompatibility ([4a78c62](https://github.com/klave-network/platform/commit/4a78c624da2df1d5515ad53e8cc1da061314e560))

* **sdk:** Rename get_public_key_format to get_formatted_public_key ([23423d5](https://github.com/klave-network/platform/commit/23423d54ae17a0513c9ee32cc02279bb52346174))

* **sdk:** Return empty u8[]instead of null in digest method ([bb36ca0](https://github.com/klave-network/platform/commit/bb36ca0be15e0727d2ad71e629a0d3804024b87a))

## [**0.11.0**](https://github.com/klave-network/platform/compare/sdk@0.10.2...sdk@0.11.0)**(2024-05-08)**

### **Dependency Updates**

* `compiler` updated to version `0.10.2`

### **Features**

* **compiler,sdk,api:** Bring ASC and compiler versions forward ([520ae67](https://github.com/klave-network/platform/commit/520ae67a6ae630e9c2d9c75d05ea13a175bf7273))

## [**0.10.2**](https://github.com/klave-network/platform/compare/sdk@0.10.1...sdk@0.10.2)**(2024-05-08)**

### **Dependency Updates**

* `compiler` updated to version `0.10.1`

### **Bug Fixes**

* **compiler:** Update `@klave/as-json` to solve private member issue ([4483859](https://github.com/klave-network/platform/commit/4483859f96de8174041e23856f0078282589d11d))

## [**0.10.1**](https://github.com/klave-network/platform/compare/sdk@0.10.0...sdk@0.10.1)**(2024-05-02)**

### **Bug Fixes**

* **sdk:** Missing usage parameter length for `generate_key` calls ([016b67e](https://github.com/klave-network/platform/commit/016b67e6083631055d5aa1abd7c2e52e60d83c86))

## [**0.10.0**](https://github.com/klave-network/platform/compare/sdk@0.9.3...sdk@0.10.0)**(2024-05-02)**

### **Dependency Updates**

* `compiler` updated to version `0.9.3`

* `constants` updated to version `0.9.3`

### **Features**

* **sdk:** Add `import_key` function to the crypto SDK ([0a7190c](https://github.com/klave-network/platform/commit/0a7190cb7240864bcb08fc49c004765615582f43))

## [**0.9.3**](https://github.com/klave-network/platform/compare/sdk@0.9.2...sdk@0.9.3)**(2024-04-08)**

### **Reverts**

* Revert "fix(sdk): Embed SWC helpers" ([75196d2](https://github.com/klave-network/platform/commit/75196d24dc09d384359d61ab371a15ae6664a466))

## [**0.9.2**](https://github.com/klave-network/platform/compare/sdk@0.9.1...sdk@0.9.2)**(2024-04-08)**

### **Dependency Updates**

* `compiler` updated to version `0.9.1`

### **Bug Fixes**

* **sdk:** Embed SWC helpers ([88cb152](https://github.com/klave-network/platform/commit/88cb152e696b3ee97bc5ec7b57adafdc463618ee))

## [**0.9.1**](https://github.com/klave-network/platform/compare/sdk@0.9.0...sdk@0.9.1)**(2024-04-08)**

### **Bug Fixes**

* **sdk:** Treating constants package as internal ([82c26a1](https://github.com/klave-network/platform/commit/82c26a1c5e2ecbc538bcc4191fd43829eaf2e642))

## [**0.9.0**](https://github.com/klave-network/platform/compare/sdk@0.8.3...sdk@0.9.0)**(2024-04-05)**

### **Dependency Updates**

* `compiler` updated to version `0.8.3`

* `constants` updated to version `0.8.3`

### **Features**

* **sdk:** Add abort_transaction() method in SDK ([ea26482](https://github.com/klave-network/platform/commit/ea264823c8f4f7e91d5f9648bc59650df6efa6e7))

## [**0.8.3**](https://github.com/klave-network/platform/compare/sdk@0.8.2...sdk@0.8.3)**(2023-12-12)**

### **Dependency Updates**

* `compiler` updated to version `0.8.2`

## [**0.8.2**](https://github.com/klave-network/platform/compare/sdk@0.8.1...sdk@0.8.2)**(2023-12-08)**

### **Dependency Updates**

* `compiler` updated to version `0.8.1`

### **Bug Fixes**

* Revert dependencies to prevent an assemblyscript failure ([6c251f1](https://github.com/klave-network/platform/commit/6c251f15d1235e11c0bf8f9cd75ac9ebbc6ea46d))

## [**0.8.1**](https://///compare/klave-sdk@0.8.0...klave-sdk@0.8.1)**(2023-09-07)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.8.0`

### **Bug Fixes**

* Revert change to package.json generation until Nx 17 0d72132

## [**0.8.0**](https://///compare/klave-sdk@0.7.0...klave-sdk@0.8.0)**(2023-09-04)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.7.0`

### **Features**

* **sdk:** Add Ledger key unset method abd8959

* **sdk:** Add subscription marker 8ada39b

* **sdk:** Switching JSON package + Add new HTTP request prototypes 12d45dc

### **Bug Fixes**

* **sdk,create:** Linking, compilation and target issues d0da049

## [**0.7.0**](https://///compare/klave-sdk@0.6.4...klave-sdk@0.7.0)**(2023-08-02)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.2.3`

### **Features**

* **sdk:** Add Light GBM APIs a9217f0

* **sdk:** Finalising Crypto SDK exposition 1de0c79

## [**0.6.4**](https://///compare/klave-sdk@0.6.3...klave-sdk@0.6.4)**(2023-06-12)**

## [**0.6.3**](https://///compare/klave-sdk@0.6.2...klave-sdk@0.6.3)**(2023-06-02)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.2.1`

### **Bug Fixes**

* **sdk:** Use synchronous file writing to prevent incomplete writes 5f58df3

## [**0.6.2**](https://///compare/klave-sdk@0.6.1...klave-sdk@0.6.2)**(2023-05-31)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.2.0`

## [**0.6.1**](https://///compare/klave-sdk@0.6.0...klave-sdk@0.6.1)**(2023-05-30)**

### **Bug Fixes**

* **sdk:** Correcting Table getArrayBuffer export 10d21fb

## [**0.6.0**](https://///compare/klave-sdk@0.5.0...klave-sdk@0.6.0)**(2023-05-30)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.1.1`

### **Features**

* **sdk:** Add Utils API, Context API and extend Notifier API 370c746

## [**0.5.0**](https://///compare/klave-sdk@0.4.6...klave-sdk@0.5.0)**(2023-05-30)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.1.0`

### **Features**

* **api,compiler,deployer:** Include JSON transformer for AS compilation ed72c2b

## [**0.4.6**](https://///compare/klave-sdk@0.4.5...klave-sdk@0.4.6)**(2023-05-16)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.0.4`

## [**0.4.5**](https://///compare/trustless-app-sdk@0.4.4...trustless-app-sdk@0.4.5)**(2023-05-11)**

## [**0.4.4**](https://///compare/trustless-app-sdk@0.4.3...trustless-app-sdk@0.4.4)**(2023-05-11)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.0.3`

### **Bug Fixes**

* **klave-compiler,klave-sdk:** Problem leading to compiler freeze + Add bailing e124be5

* **klave-compiler:** Ensure proper export of ESM bindings 147aa09

## [**0.4.3**](https://///compare/trustless-app-sdk@0.4.2...trustless-app-sdk@0.4.3)**(2023-05-11)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.0.2`

## [**0.4.2**](https://///compare/trustless-app-sdk@0.4.1...trustless-app-sdk@0.4.2)**(2023-05-10)**

### **Bug Fixes**

* **klave-sdk:** Fixing crash on file absence b3c3535

## [**0.4.1**](https://///compare/trustless-app-sdk@0.4.0...trustless-app-sdk@0.4.1)**(2023-05-10)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.0.1`

## [**0.4.0**](https://///compare/trustless-app-sdk@0.3.2...trustless-app-sdk@0.4.0)**(2023-05-10)**

### **Dependency Updates**

* `klave-compiler` updated to version `0.1.0`

### **Features**

* **klave-compiler:** Split off the wasm compiler into separate library package 36e1f02

## [**0.3.2**](https://///compare/trustless-app-sdk@0.3.1...trustless-app-sdk@0.3.2)**(2023-02-24)**

### **Bug Fixes**

* **klave-sdk:** Comply with asbuild stricter type checking edd5a20

## [**0.3.1**](https://///compare/trustless-app-sdk@0.3.0...trustless-app-sdk@0.3.1)**(2023-02-24)**

## [**0.3.0**](https://///compare/trustless-app-sdk@0.2.1...trustless-app-sdk@0.3.0)**(2023-02-24)**

### **⚠ BREAKING CHANGES**

* Replace SDK structure

### **Bug Fixes**

* **klave-sdk:** Prevent display of peer dependency warning 59c13da

### **Miscellaneous Chores**

* Replace SDK structure be5add9

## [**0.2.1**](https://///compare/trustless-app-sdk@0.2.0...trustless-app-sdk@0.2.1)**(2023-02-08)**

### **Bug Fixes**

* Creator template would incorrectly validate and skeleton the config file 9778524

## **0.2.0 (2023-02-08)**

### **⚠ BREAKING CHANGES**

* Rename templator and TS sdk

### **Miscellaneous Chores**

* Rename templator and TS sdk 44903f1

## **0.1.0 (2023-01-29)**

### **Features**

* Switching over to using asb in place of asc for sdk compilation 5157354

* **trustless-app:** Add trustless app typescript helps for developers fd78d16

## **0.0.3 (2023-01-23)**

## **0.0.2 (2023-01-23)**

## **0.0.1 (2023-01-23)**
