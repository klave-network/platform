export const dummyMap: Record<string, string | null> = {
    'asconfig.json': `
        {
            "options": {
                "bindings": "esm",
                "disable": "bulk-memory"
            }
        }`,
    'node_modules/@klave/sdk/package.json': `
        {
            "name": "@klave/sdk",
            "description": "Secretarium Trustless Apps helpers and definitions",
            "version": "0.4.1",
            "license": "MIT",
            "private": false,
            "author": {
                "email": "florian@secretarium.com",
                "name": "Florian Guitton"
            },
            "bin": {
                "stac": "./bin/stac"
            },
            "type": "commonjs",
            "main": "assembly/index.ts",
            "types": "assembly/index.ts",
            "exports": {
                ".": {
                "require": "./src/index.js"
                },
                "./stac": {
                "default": "./src/compile.js",
                "require": "./src/compile.js"
                }
            },
            "dependencies": {
                "assemblyscript": "^0.27.14",
                "chalk": "4.1.2",
                "fs-extra": "11.1.1",
            },
            "devDependencies": {
                "@types/fs-extra": "11.0.1"
            }
        }`,
    'node_modules/@klave/sdk/index.ts': `
        /**
         * Environment definitions for compiling Klave Trustless Application.
         * @module trustless/sdk
         */

        @external("env", "add_user_query")
        declare function runtime_add_user_query(s: ArrayBuffer): void;
        @external("env", "add_user_transaction")
        declare function runtime_add_user_transaction(s: ArrayBuffer): void;
        @external("env", "notify")
        declare function runtime_notify(s: ArrayBuffer): i32;
        @external("env", "read_ledger")
        declare function runtime_read_ledger_raw(table: ArrayBuffer, key: ArrayBuffer, key_size: i32, value: ArrayBuffer, value_size: i32): i32;
        @external("env", "write_ledger")
        declare function runtime_write_ledger_raw(table: ArrayBuffer, key: ArrayBuffer, key_size: i32, value: ArrayBuffer, value_size: i32): i32;

        export class Router {
            static addQuery(queryFunctionName: ArrayBuffer): void {
                runtime_add_user_query(queryFunctionName);
            }
            static addTransaction(transactionFunctionName: ArrayBuffer): void {
                runtime_add_user_transaction(transactionFunctionName);
            }
        }

        export class Table {
            tableName: ArrayBuffer;
            constructor(table: ArrayBuffer) {
                this.tableName = table;
            }
            get(key: ArrayBuffer): i32 {
                const value = new ArrayBuffer(64);
                const result = Ledger.readFromTableIntoBuffer(this.tableName, key, value);
                return result;
            }
            set(key: ArrayBuffer, value: ArrayBuffer): i32 {
                return runtime_write_ledger_raw(this.tableName, key, key.byteLength, value, value.byteLength);
            }
        }

        export class Ledger {
            static readFromTableIntoBuffer(table: ArrayBuffer, key: ArrayBuffer, value: ArrayBuffer): i32 {
                return runtime_read_ledger_raw(table, key, key.byteLength, value, value.byteLength);
            }
            static writeToTable(table: ArrayBuffer, key: ArrayBuffer, value: ArrayBuffer): i32 {
                return runtime_write_ledger_raw(table, key, key.byteLength, value, value.byteLength);
            }
            static getTable(table: ArrayBuffer): Table {
                return new Table(table);
            }
        }

        export class Notifier {
            static notify(message: ArrayBuffer): i32 {
                return runtime_notify(message);
            }
        }`
};