import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid';
import { Crypto, Notifier } from '@klave/sdk';
import * as idlV1 from "./crypto_subtle_idl_v1"
import { Result } from '.';

// @ts-ignore: decorator
@external("env", "key_exists")
declare function wasm_key_exists(key_name: ArrayBuffer): boolean;
// @ts-ignore: decorator
@external("env", "encrypt")
declare function wasm_encrypt(key_name: ArrayBuffer, encryption_info: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "decrypt")
declare function wasm_decrypt(key_name: ArrayBuffer, encryption_info: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "generate_key")
declare function wasm_generate_key(key_name: ArrayBuffer, algorithm: i32, algo_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "import_key")
declare function wasm_import_key(key_name: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, algo_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "export_key")
declare function wasm_export_key(key_name: ArrayBuffer, key_format: i32, key: ArrayBuffer, key_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_public_key")
declare function wasm_get_public_key(key_name: ArrayBuffer, key_format: i32, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "sign")
declare function wasm_sign(key_name: ArrayBuffer, signature_info: ArrayBuffer, text: ArrayBuffer, text_size: i32, signature: ArrayBuffer, signature_size: i32): i32;
// @ts-ignore: decorator
@external("env", "verify")
declare function wasm_verify(key_name: ArrayBuffer, signature_info: ArrayBuffer, text: ArrayBuffer, text_size: i32, signature: ArrayBuffer, signature_size: i32): i32;
// @ts-ignore: decorator
@external("env", "digest")
declare function wasm_digest(algorithm: i32, hash_info: ArrayBuffer, text: ArrayBuffer, text_size: i32, digest: ArrayBuffer, digest_size: i32): i32;
// @ts-ignore: decorator
@external("env", "unwrap_key")
declare function wasm_unwrap_key(decryption_key_name: ArrayBuffer, encryption_info: ArrayBuffer, key_name_to_import: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, algo_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "wrap_key")
declare function wasm_wrap_key(key_name_to_export: ArrayBuffer, key_format: i32, encryption_key_name: ArrayBuffer, encryption_info: ArrayBuffer, key: ArrayBuffer, key_size: i32): i32;

// @ts-ignore: decorator
@external("env", "key_exists_in_memory")
declare function wasm_key_exists_in_memory(key_name: ArrayBuffer): boolean;
// @ts-ignore: decorator
@external("env", "generate_key_in_memory")
declare function wasm_generate_key_in_memory(key_name: ArrayBuffer, algorithm: i32, algo_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "import_key_in_memory")
declare function wasm_import_key_in_memory(key_name: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, algo_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "unwrap_key_in_memory")
declare function wasm_unwrap_key_in_memory(decryption_key_name: ArrayBuffer, encryption_info: ArrayBuffer, key_name_to_import: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, algo_metadata: ArrayBuffer, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;

// @ts-ignore: decorator
@external("env", "get_random_bytes")
declare function wasm_get_random_bytes(bytes: ArrayBuffer, size: i32): i32;


export class Key {
    name: string;

    constructor(keyName: string) {
        if (keyName.length !== 0 && keyName !== "")
            this.name = keyName;
        else {
            const rnds = CryptoImpl.getRandomBytes(16);
            // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
            unchecked(rnds[6] = (rnds[6] & 0x0f) | 0x40);
            unchecked(rnds[8] = (rnds[8] & 0x3f) | 0x80);

            const rndsArray = new Uint8Array(rnds.length);
            rndsArray.set(rnds);
            this.name = uuid(rndsArray);
        }
    }
}

export const enum MemoryType {
    Persistent = 0,
    InMemory = 1,
};

export class CryptoImpl {

    static format(input: string): i32 {
        if (input === "raw")
            return 0;
        if (input === "spki")
            return 1;
        if (input === "pkcs8")
            return 2;
        if (input === "jwk")
            return 3;
        if (input === "sec1")
            return 4;
        if (input === "pkcs1")
            return 5;
        return -1;
    }

    static algorithm(input: string): i32 {
        if (input === "secp256r1" || input === "ecc256")
            return 0;
        if (input === "secp384r1" || input === "ecc384")
            return 1;
        if (input === "secp521r1" || input === "ecc521")
            return 2;
        if (input === "secp256k1")
            return 3;
        if (input === "aes128gcm")
            return 4;
        if (input === "aes192gcm")
            return 5;
        if (input === "aes256gcm")
            return 6;
        if (input === "sha2-256" || input === "sha256")
            return 7;
        if (input === "sha2-384" || input === "sha384")
            return 8;
        if (input === "sha2-512" || input === "sha512")
            return 9;
        if (input === "sha3-256")
            return 10;
        if (input === "sha3_384")
            return 11;
        if (input === "sha3_512")
            return 12;
        if (input === "rsa2048oaep")
            return 13;
        if (input === "rsa3072oaep")
            return 14;
        if (input === "rsa4096oaep")
            return 15;
        if (input === "rsa2048pss")
            return 16;
        if (input === "rsa3072pss")
            return 17;
        if (input === "rsa4096pss")
            return 18;
        if (input === "rsa2048pkcs1_v1_5")
            return 19;
        if (input === "rsa3072pkcs1_v1_5")
            return 20;
        if (input === "rsa4096pkcs1_v1_5")
            return 21;
        if (input === "aes128kw")
            return 22;
        if (input === "aes192kw")
            return 23;
        if (input === "aes256kw")
            return 24;
        return -1;
    }

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

    static keyExists(in_memory: MemoryType, key_name: string): boolean {        
        let result = false;
        if (in_memory == MemoryType.InMemory) {
            result = wasm_key_exists_in_memory(String.UTF8.encode(key_name, true));
        }
        else {
            result = wasm_key_exists(String.UTF8.encode(key_name, true));
        }
        return result;
    }

    static generateKey<T>(algorithm: idlV1.key_algorithm, algo_metadata: T, extractable: boolean, usages: string[]): Result<Key,Error>
    {
        const local_usages = new Uint8Array(usages.length);
        for(let i = 0; i < usages.length; i++)
        {
            local_usages[i] = this.usage(usages[i]);
        }
    
        let algoMetadata = JSON.stringify(algo_metadata);
        const key = new Key("");
        let result = 0;
        result = wasm_generate_key(
                String.UTF8.encode(key.name, true), algorithm, String.UTF8.encode(algoMetadata, true), extractable?1:0, local_usages.buffer, local_usages.length);
        if (result < 0)
            return {data: null, err: new Error("Failed to generate key")};

        return {data: key, err: null};
    }

    static encrypt(key_name: string, encrypt_info: string, clear_text: string): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let info = String.UTF8.encode(encrypt_info, true);
        let t = String.UTF8.encode(clear_text, false);
        let value = new Uint8Array(64);
        let result = wasm_encrypt(k, info, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = [];
        if (result < 0)
            return ret;
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = wasm_encrypt(k, info, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static decrypt(key_name: string, encrypt_info: string, cipher_text: u8[]): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let info = String.UTF8.encode(encrypt_info, true);
        let buffer = new Uint8Array(cipher_text.length);
        let ret: u8[] = [];
        for (let i = 0; i < cipher_text.length; ++i)
            buffer[i] = cipher_text[i];
        let value = new Uint8Array(64);
        let result = wasm_decrypt(k, info, buffer.buffer, buffer.byteLength, value.buffer, value.byteLength);
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = wasm_decrypt(k, info, buffer.buffer, buffer.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static sign(key_name: string, signature_info: string, text: string): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let info = String.UTF8.encode(signature_info, true);
        let t = String.UTF8.encode(text, false);
        let value = new Uint8Array(64);
        let result = wasm_sign(k, info, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = [];
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = wasm_sign(k, info, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static verify(key_name: string, signature_info: string, text: string, signature: u8[]): boolean
    {
        let k = String.UTF8.encode(key_name, true);
        let info = String.UTF8.encode(signature_info, true);
        let t = String.UTF8.encode(text, false);
        let buffer = new Uint8Array(signature.length);
        for (let i = 0; i < signature.length; ++i)
            buffer[i] = signature[i];
        return wasm_verify(k, info, t, t.byteLength, buffer.buffer, buffer.byteLength) != 0;
    }
    
    static digest<T>(algorithm: idlV1.hash_algorithm, hash_info: T, text: ArrayBuffer): Result<ArrayBuffer, Error>
    {
        if(!(hash_info instanceof idlV1.sha_metadata || hash_info instanceof idlV1.tagged_sha_metadata))
        {
            return {data: null, err: new Error("Invalid hash metadata type")};
        }

        let info = String.UTF8.encode(JSON.stringify(hash_info), true);
        let value = new Uint8Array(32);
        let result = wasm_digest(algorithm, info, text, text.byteLength, value.buffer, value.byteLength);
        if (result < 0)
            return {data: null, err: new Error("Failed to digest")};
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = wasm_digest(algorithm, info, text, text.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return {data: null, err: new Error("Failed to digest")};
        }
        return {data: value.buffer.slice(0, result), err: null};
    }  

    static importKey(in_memory: MemoryType, key_name: string, format: string, b64Data: string, algorithm: string, algo_metadata: string, extractable: boolean, usages: string[]): Key | null
    {
        const key = new Key(key_name);

        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
            return null;

        let iAlgorithm = CryptoImpl.algorithm(algorithm);
        if (iAlgorithm < 0)
            return null;

        const local_usages = new Uint8Array(usages.length);
        for(let i = 0; i < usages.length; i++)
        {
            local_usages[i] = this.usage(usages[i]);
        }

        let rawData = decode(b64Data);

        let result = 0;
        if (in_memory == MemoryType.InMemory) {
            result = wasm_import_key_in_memory(String.UTF8.encode(key.name, true), iFormat, rawData.buffer, rawData.byteLength,
                iAlgorithm, String.UTF8.encode(algo_metadata, true), extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength);
        }
        else {
            result = wasm_import_key(String.UTF8.encode(key.name, true), iFormat, rawData.buffer, rawData.byteLength,
                iAlgorithm, String.UTF8.encode(algo_metadata, true), extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength);
        }
        
        if (result < 0)
            return null;
    
        return key;
    }

    static exportKey(key_name: string, format: string): u8[]
    {
        let ret: u8[] = [];
        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
            return ret;

        let key = new Uint8Array(32);

        let result = wasm_export_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
        if (result < 0)
            return ret;
        if (result > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new Uint8Array(result);
            result = wasm_export_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < key.byteLength; ++i)
            ret[i] = key[i];
        return ret;
    }        

    static unwrapKey(in_memory: MemoryType, decryption_key_name: string, decryption_info: string, key_name: string, format: string, b64Data: string, algorithm: string, algo_metadata: string, extractable: boolean, usages: string[]): Key | null
    {
        const key = new Key(key_name);

        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
            return null;

        let iAlgorithm = CryptoImpl.algorithm(algorithm);
        if (iAlgorithm < 0)
            return null;

        const local_usages = new Uint8Array(usages.length);
        for(let i = 0; i < usages.length; i++)
        {
            local_usages[i] = this.usage(usages[i]);
        }

        let rawData = decode(b64Data);

        let result = 0;
        if (in_memory == MemoryType.InMemory) {
            result = wasm_unwrap_key_in_memory(String.UTF8.encode(decryption_key_name, true), String.UTF8.encode(decryption_info, true), String.UTF8.encode(key.name, true), iFormat, rawData.buffer, rawData.byteLength,
                iAlgorithm, String.UTF8.encode(algo_metadata, true), extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength);
        }
        else {
            result = wasm_unwrap_key(String.UTF8.encode(decryption_key_name, true), String.UTF8.encode(decryption_info, true), String.UTF8.encode(key.name, true), iFormat, rawData.buffer, rawData.byteLength,
                iAlgorithm, String.UTF8.encode(algo_metadata, true), extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength);
        }
        
        if (result < 0)
            return null;
    
        return key;
    }

    static wrapKey(encryption_key_name: string, encryption_info: string, key_name: string, format: string): u8[]
    {
        let ret: u8[] = [];
        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
        {
            Notifier.sendString("Invalid format");
            return ret;
        }
            
        let key = new Uint8Array(32);
        let result = wasm_wrap_key(String.UTF8.encode(key_name, true), iFormat, String.UTF8.encode(encryption_key_name, true), String.UTF8.encode(encryption_info, true), key.buffer, key.byteLength);
        if (result < 0)
        {
            Notifier.sendString("Failed to wrap key");
            return ret;
        }
        if (result > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new Uint8Array(result);
            result = wasm_wrap_key(String.UTF8.encode(key_name, true), iFormat, String.UTF8.encode(encryption_key_name, true), String.UTF8.encode(encryption_info, true), key.buffer, key.byteLength);
            if (result < 0)
            {
                Notifier.sendString("Failed to wrap key 2");
                return ret;
            }
        }
        for (let i = 0; i < key.byteLength; ++i)
            ret[i] = key[i];
        return ret;
    }        

    static getPublicKey(key_name: string, format: string): u8[]
    {
        let ret: u8[] = [];
        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
            return ret;

        let key = new Uint8Array(32);
        let result = wasm_get_public_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
        if (result < 0)
            return ret;
        if (result > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new Uint8Array(result);
            result = wasm_get_public_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < key.byteLength; ++i)
            ret[i] = key[i];
        return ret;
    }        

    static getRandomBytes(size: i32): u8[] {
        const value = new Uint8Array(size);
        const result = wasm_get_random_bytes(value.buffer, value.byteLength);
        const ret: u8[] = []
        if (result < 0)
            return ret; // todo : report error
        for (let i = 0; i < size; ++i)
            ret[i] = value[i];
        return ret;
    }    
}

