/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import uuid from '../uuid';
import { Result } from '../index';

//In-memory Crypto operations
// @ts-ignore: decorator
@external("env", "key_exists")
declare function wasm_key_exists(key_name: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "encrypt")
declare function wasm_encrypt(key_name: ArrayBuffer, encrypt_algo_id: i32, encrypt_metadata: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "decrypt")
declare function wasm_decrypt(key_name: ArrayBuffer, decrypt_algo_id: i32, decrypt_metadata: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "generate_key")
declare function wasm_generate_key(key_name: ArrayBuffer, key_algo_id: i32, key_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "import_key")
declare function wasm_import_key(key_name: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, key_algo_id: i32, key_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "export_key")
declare function wasm_export_key(key_name: ArrayBuffer, key_format: i32, key: ArrayBuffer, key_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_public_key")
declare function wasm_get_public_key(key_name: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "sign")
declare function wasm_sign(key_name: ArrayBuffer, sign_algo_id: i32, sign_metadata: ArrayBuffer, text: ArrayBuffer, text_size: i32, signature: ArrayBuffer, signature_size: i32): i32;
// @ts-ignore: decorator
@external("env", "verify")
declare function wasm_verify(key_name: ArrayBuffer, sign_algo_id: i32, sign_metadata: ArrayBuffer, text: ArrayBuffer, text_size: i32, signature: ArrayBuffer, signature_size: i32, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "digest")
declare function wasm_digest(hash_algo_id: i32, hash_metadata: ArrayBuffer, text: ArrayBuffer, text_size: i32, digest: ArrayBuffer, digest_size: i32): i32;
// @ts-ignore: decorator
@external("env", "unwrap_key")
declare function wasm_unwrap_key(decryption_key_name: ArrayBuffer, encrypt_algo_id: i32, encrypt_metadata: ArrayBuffer, key_name_to_import: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, key_algo_id: i32, key_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "wrap_key")
declare function wasm_wrap_key(key_name_to_export: ArrayBuffer, key_format: i32, encryption_key_name: ArrayBuffer, encrypt_algo_id: i32, encrypt_metadata: ArrayBuffer, key: ArrayBuffer, key_size: i32): i32;

// @ts-ignore: decorator
@external("env", "save_key")
declare function wasm_save_key(key_name: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "load_key")
declare function wasm_load_key(key_name: ArrayBuffer, key_info: ArrayBuffer, key_info_size: i32): i32;
// @ts-ignore: decorator
@external("env", "delete_key")
declare function wasm_delete_key(key_name: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;

// @ts-ignore: decorator
@external("env", "get_random_bytes")
declare function wasm_get_random_bytes(requested_size: i32, result: ArrayBuffer, result_size: i32): i32;

export class Key {
    name!: string;

    static create(keyName: string): Key | null {
        if (keyName.length !== 0 && keyName !== "") {
            return { name: keyName } as Key;
        } else {
            const rnds = CryptoImpl.getRandomBytes(16);
            if (!rnds.data)
                return null;

            let rndsAsArray = rnds.data as Uint8Array;
            // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
            unchecked(rndsAsArray[6] = (rndsAsArray[6] & 0x0f) | 0x40);
            unchecked(rndsAsArray[8] = (rndsAsArray[8] & 0x3f) | 0x80);
            return { name: uuid(rndsAsArray) } as Key;
        }
    }
}

export class VerifySignResult {
    isValid!: boolean;
}

// null as a type should be an acceptable unit type, but AssemblyScript doesn't support it
export class UnitType {
}

export class CryptoImpl {

    static usage(input: string): i32 {
        if (input === "encrypt")
            return 0;
        if (input === "decrypt")
            return 1;
        if (input === "sign")
            return 2;
        if (input === "verify")
            return 3;
        if (input === "derive_key")
            return 4;
        if (input === "derive_bits")
            return 5;
        if (input === "wrap_key")
            return 6;
        if (input === "unwrap_key")
            return 7;
        return -1;
    }

    static keyExists(keyName: string): boolean {
        let buf = new ArrayBuffer(64);
        const result = wasm_key_exists(String.UTF8.encode(keyName, true), buf, buf.byteLength);
        if (result < 0)
            return false;
        return String.UTF8.decode(buf.slice(0, result)) == 'true';
    }

    static generateKey(algorithm: u32, algoMetadata: ArrayBuffer, extractable: boolean, usages: string[], keyName: string): Result<Key, Error> {
        const local_usages = new Uint8Array(usages.length);
        for (let i = 0; i < usages.length; i++) {
            local_usages[i] = this.usage(usages[i]);
        }

        const key = Key.create(keyName);
        if (!key)
            return { data: null, err: new Error("Failed to generate key") };
        let buf = new ArrayBuffer(32);
        let result = wasm_generate_key(
            String.UTF8.encode(key.name, true), algorithm, algoMetadata, extractable ? 1 : 0, local_usages.buffer, local_usages.length, buf, buf.byteLength);
        if (abs(result) > buf.byteLength) {
            buf = new ArrayBuffer(abs(result));
            result = wasm_generate_key(
                String.UTF8.encode(key.name, true), algorithm, algoMetadata, extractable ? 1 : 0, local_usages.buffer, local_usages.length, buf, buf.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to generate key : " + String.UTF8.decode(buf.slice(0, -result))) };

        return { data: key, err: null };
    }

    static encrypt(keyName: string, algorithm: u32, algoMetadata: ArrayBuffer, clearText: ArrayBuffer): Result<ArrayBuffer, Error> {
        let k = String.UTF8.encode(keyName, true);
        let value = new ArrayBuffer(64);
        let result = wasm_encrypt(k, algorithm, algoMetadata, clearText, clearText.byteLength, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = wasm_encrypt(k, algorithm, algoMetadata, clearText, clearText.byteLength, value, value.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to encrypt : " + String.UTF8.decode(value.slice(0, -result))) };

        return { data: value.slice(0, result), err: null };
    }

    static decrypt(keyName: string, algorithm: u32, algoMetadata: ArrayBuffer, cipherText: ArrayBuffer): Result<ArrayBuffer, Error> {
        let k = String.UTF8.encode(keyName, true);
        let value = new ArrayBuffer(64);
        let result = wasm_decrypt(k, algorithm, algoMetadata, cipherText, cipherText.byteLength, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = wasm_decrypt(k, algorithm, algoMetadata, cipherText, cipherText.byteLength, value, value.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to decrypt : " + String.UTF8.decode(value.slice(0, -result))) };

        return { data: value.slice(0, result), err: null };
    }

    static sign(keyName: string, algorithm: u32, algoMetadata: ArrayBuffer, data: ArrayBuffer): Result<ArrayBuffer, Error> {
        let k = String.UTF8.encode(keyName, true);
        let value = new ArrayBuffer(64);
        let result = wasm_sign(k, algorithm, algoMetadata, data, data.byteLength, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = wasm_sign(k, algorithm, algoMetadata, data, data.byteLength, value, value.byteLength);
            if (result < 0)
                return { data: null, err: new Error("Failed to sign") };
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to sign : " + String.UTF8.decode(value.slice(0, -result))) };

        return { data: value.slice(0, result), err: null };
    }

    static verify(keyName: string, algorithm: u32, algoMetadata: ArrayBuffer, data: ArrayBuffer, signature: ArrayBuffer): Result<VerifySignResult, Error> {
        let k = String.UTF8.encode(keyName, true);
        let buf = new ArrayBuffer(64);
        let result = wasm_verify(k, algorithm, algoMetadata, data, data.byteLength, signature, signature.byteLength, buf, buf.byteLength);
        if (abs(result) > buf.byteLength) {
            // buffer not big enough, retry with a properly sized one
            buf = new ArrayBuffer(abs(result));
            result = wasm_verify(k, algorithm, algoMetadata, data, data.byteLength, signature, signature.byteLength, buf, buf.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to verify : " + String.UTF8.decode(buf.slice(0, -result))) };

        let resBool = { isValid: String.UTF8.decode(buf.slice(0, result)) == 'true' } as VerifySignResult;
        return { data: resBool, err: null };
    }

    static digest(algorithm: u32, hashInfo: ArrayBuffer, text: ArrayBuffer): Result<ArrayBuffer, Error> {
        let value = new ArrayBuffer(32);
        let result = wasm_digest(algorithm, hashInfo, text, text.byteLength, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = wasm_digest(algorithm, hashInfo, text, text.byteLength, value, value.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to digest : " + String.UTF8.decode(value.slice(0, -result))) };

        return { data: value.slice(0, result), err: null };
    }

    static importKey(format: u32, keyData: ArrayBuffer, algorithm: u32, algo_metadata: ArrayBuffer, extractable: boolean, usages: string[], keyName: string): Result<Key, Error> {
        const key = Key.create(keyName);
        if (!key)
            return { data: null, err: new Error("Failed to generate key UUID") };
        const local_usages = new Uint8Array(usages.length);
        for (let i = 0; i < usages.length; i++) {
            local_usages[i] = this.usage(usages[i]);
        }

        let buf = new ArrayBuffer(64);
        let result = wasm_import_key(String.UTF8.encode(key.name, true), format, keyData, keyData.byteLength, algorithm, algo_metadata,
            extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength, buf, buf.byteLength);
        if (abs(result) > buf.byteLength) {
            // buffer not big enough, retry with a properly sized one
            buf = new ArrayBuffer(abs(result));
            result = wasm_import_key(String.UTF8.encode(key.name, true), format, keyData, keyData.byteLength, algorithm, algo_metadata,
                extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength, buf, buf.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to import key : " + String.UTF8.decode(buf.slice(0, -result))) };

        return { data: key, err: null };
    }

    static exportKey(keyName: string, format: u32): Result<ArrayBuffer, Error> {
        let key = new ArrayBuffer(32);
        let result = wasm_export_key(String.UTF8.encode(keyName, true), format, key, key.byteLength);
        if (abs(result) > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new ArrayBuffer(abs(result));
            result = wasm_export_key(String.UTF8.encode(keyName, true), format, key, key.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to export key : " + String.UTF8.decode(key.slice(0, -result))) };

        return { data: key.slice(0, result), err: null };
    }

    static unwrapKey(decryptionKeyName: string, unwrap_algo_id: u32, unwrap_metadata: ArrayBuffer, format: u32, wrapped_key: ArrayBuffer, key_gen_algorithm: u32, key_gen_algo_metadata: ArrayBuffer, extractable: boolean, usages: string[]): Result<Key, Error> {
        const key = Key.create("");
        if (!key)
            return { data: null, err: new Error("Failed to generate key") };
        const local_usages = new Uint8Array(usages.length);
        for (let i = 0; i < usages.length; i++) {
            local_usages[i] = this.usage(usages[i]);
        }

        let buf = new ArrayBuffer(64);
        let result = wasm_unwrap_key(String.UTF8.encode(decryptionKeyName, true), unwrap_algo_id, unwrap_metadata, String.UTF8.encode(key.name, true), format, wrapped_key, wrapped_key.byteLength, key_gen_algorithm, key_gen_algo_metadata,
            extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength, buf, buf.byteLength);
        if (abs(result) > buf.byteLength) {
            // buffer not big enough, retry with a properly sized one
            buf = new ArrayBuffer(abs(result));
            result = wasm_unwrap_key(String.UTF8.encode(decryptionKeyName, true), unwrap_algo_id, unwrap_metadata, String.UTF8.encode(key.name, true), format, wrapped_key, wrapped_key.byteLength, key_gen_algorithm, key_gen_algo_metadata,
                extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength, buf, buf.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to unwrap key : " + String.UTF8.decode(buf.slice(0, -result))) };

        return { data: key, err: null };
    }

    static wrapKey(encryptionKeyName: string, algorithm: u32, algo_metadata: ArrayBuffer, key_name: string, format: u32): Result<ArrayBuffer, Error> {
        let key = new ArrayBuffer(32);
        let result = wasm_wrap_key(String.UTF8.encode(key_name, true), format, String.UTF8.encode(encryptionKeyName, true), algorithm, algo_metadata, key, key.byteLength);
        if (abs(result) > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new ArrayBuffer(abs(result));
            result = wasm_wrap_key(String.UTF8.encode(key_name, true), format, String.UTF8.encode(encryptionKeyName, true), algorithm, algo_metadata, key, key.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to wrap key : " + String.UTF8.decode(key.slice(0, -result))) };

        return { data: key.slice(0, result), err: null };
    }

    static getPublicKey(keyName: string): Result<ArrayBuffer, Error> {
        let key = new ArrayBuffer(32);
        let result = wasm_get_public_key(String.UTF8.encode(keyName, true), key, key.byteLength);
        if (abs(result) > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new ArrayBuffer(abs(result));
            result = wasm_get_public_key(String.UTF8.encode(keyName, true), key, key.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to get public key : " + String.UTF8.decode(key.slice(0, -result))) };

        return { data: key.slice(0, result), err: null };
    }

    static saveKey(keyName: string): Result<UnitType, Error> {
        let buf = new ArrayBuffer(64);
        let result = wasm_save_key(String.UTF8.encode(keyName, true), buf, buf.byteLength);
        if (abs(result) > buf.byteLength) {
            // buffer not big enough, retry with a properly sized one
            buf = new ArrayBuffer(abs(result));
            result = wasm_save_key(String.UTF8.encode(keyName, true), buf, buf.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to save key : " + String.UTF8.decode(buf.slice(0, -result))) };
        return { data: new UnitType(), err: null };
    }

    static loadKey(keyName: string): Result<ArrayBuffer, Error> {
        let keyInfo = new ArrayBuffer(64);
        let result = wasm_load_key(String.UTF8.encode(keyName, true), keyInfo, keyInfo.byteLength);
        if (abs(result) > keyInfo.byteLength) {
            // buffer not big enough, retry with a properly sized one
            keyInfo = new ArrayBuffer(abs(result));
            result = wasm_load_key(String.UTF8.encode(keyName, true), keyInfo, keyInfo.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to load key : " + String.UTF8.decode(keyInfo.slice(0, -result))) };

        return { data: keyInfo.slice(0, result), err: null };
    }

    static deleteKey(keyName: string): Result<UnitType, Error> {
        let buf = new ArrayBuffer(64);
        let result = wasm_delete_key(String.UTF8.encode(keyName, true), buf, buf.byteLength);
        if (abs(result) > buf.byteLength) {
            // buffer not big enough, retry with a properly sized one
            buf = new ArrayBuffer(abs(result));
            result = wasm_delete_key(String.UTF8.encode(keyName, true), buf, buf.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to delete key : " + String.UTF8.decode(buf.slice(0, -result))) };
        return { data: new UnitType(), err: null };
    }

    static getRandomBytes(size: i32): Result<Uint8Array, Error> {
        let value = new ArrayBuffer(size);
        let result = wasm_get_random_bytes(size, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = wasm_get_random_bytes(size, value, value.byteLength);
        }
        if (result < 0)
            return { data: null, err: new Error("Failed to get random bytes : " + String.UTF8.decode(value.slice(0, -result))) }
        return { data: Uint8Array.wrap(value), err: null };
    }
}
