import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid';

// @ts-ignore: decorator
@external("env", "key_exists")
declare function key_exists(key_name: ArrayBuffer): boolean;
// @ts-ignore: decorator
@external("env", "encrypt")
declare function encrypt_wasm(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "decrypt")
declare function decrypt_wasm(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "generate_key")
declare function generate_key(key_name: ArrayBuffer, algorithm: i32, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "import_key")
declare function import_key(key_name: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "export_key")
declare function export_key(key_name: ArrayBuffer, key_format: i32, key: ArrayBuffer, key_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_formatted_public_key")
declare function get_formatted_public_key(key_name: ArrayBuffer, key_format: i32, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "sign")
declare function sign_wasm(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "verify")
declare function verify_wasm(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "digest_alg")
declare function digest_alg(algorithm: i32, text: ArrayBuffer, text_size: i32, digest: ArrayBuffer, digest_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_random_bytes")
declare function get_random_bytes_wasm(bytes: ArrayBuffer, size: i32): i32;

// @ts-ignore: decorator
@external("env", "key_exists_in_memory")
declare function key_exists_in_memory(key_name: ArrayBuffer): boolean;
// @ts-ignore: decorator
@external("env", "encrypt_in_memory")
declare function encrypt_in_memory(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "decrypt_in_memory")
declare function decrypt_in_memory(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "generate_key_in_memory")
declare function generate_key_in_memory(key_name: ArrayBuffer, algorithm: i32, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "import_key_in_memory")
declare function import_key_in_memory(key_name: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "export_key_in_memory")
declare function export_key_in_memory(key_name: ArrayBuffer, key_format: i32, key: ArrayBuffer, key_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_public_key_in_memory")
declare function get_public_key_in_memory(key_name: ArrayBuffer, key_format: i32, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "sign_in_memory")
declare function sign_in_memory(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "verify_in_memory")
declare function verify_in_memory(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;


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
        return -1;
    }

    static algorithm(input: string): i32 {
        if (input === "secp256r1" || input === "ecc256")
            return 0;
        if (input === "secp384r1" || input === "ecc384")
            return 1;
        if (input === "secp521r1" || input === "ecc521")
            return 2;
        if (input === "aes128gcm")
            return 3;
        if (input === "sha2-256" || input === "sha256")
            return 4;
        if (input === "sha2-384" || input === "sha384")
            return 5;
        if (input === "sha2-512" || input === "sha512")
            return 6;
        if (input === "secp256k1")
            return 7;            
        if (input === "sha3-256")
            return 8;
        if (input === "sha3-384")
            return 9;
        if (input === "sha3-512")
            return 10;
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
            result = key_exists_in_memory(String.UTF8.encode(key_name, true));
        }
        else {
            result = key_exists(String.UTF8.encode(key_name, true));
        }
        return result;
    }

    static generateKey(in_memory: MemoryType, key_name: string, algorithm: string, extractable: boolean, usages: string[]): Key | null
    {
        let iAlgorithm = CryptoImpl.algorithm(algorithm);
        if (iAlgorithm < 0)
            return null;

        const local_usages = new Uint8Array(usages.length);
        for(let i = 0; i < usages.length; i++)
        {
            local_usages[i] = this.usage(usages[i]);
        }
    
        const key = new Key(key_name);
        let result = 0;
        if (in_memory == MemoryType.InMemory) {
            result = generate_key_in_memory(
                String.UTF8.encode(key.name, true), iAlgorithm, extractable?1:0, local_usages.buffer, local_usages.length);    
        }
        else {
            result = generate_key(
                String.UTF8.encode(key.name, true), iAlgorithm, extractable?1:0, local_usages.buffer, local_usages.length);
        }
        if (result < 0)
            return null;

        return key;
    }

    static encrypt(in_memory: MemoryType, key_name: string, clear_text: string): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let t = String.UTF8.encode(clear_text, false);
        let value = new Uint8Array(64);
        let result = 0;
        if (in_memory == MemoryType.InMemory) {
            result = encrypt_in_memory(k, t, t.byteLength, value.buffer, value.byteLength);
        }
        else {
            result = encrypt_wasm(k, t, t.byteLength, value.buffer, value.byteLength);
        }
        let ret: u8[] = [];
        if (result < 0)
            return ret;
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            if (in_memory == MemoryType.InMemory) {
                result = encrypt_in_memory(k, t, t.byteLength, value.buffer, value.byteLength);
            }
            else {
                result = encrypt_wasm(k, t, t.byteLength, value.buffer, value.byteLength);
            }
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static decrypt(in_memory: MemoryType, key_name: string, cipher_text: u8[]): string
    {
        let k = String.UTF8.encode(key_name, true);
        let buffer = new Uint8Array(cipher_text.length);
        for (let i = 0; i < cipher_text.length; ++i)
            buffer[i] = cipher_text[i];
        let value = new ArrayBuffer(64);
        let result = 0;
        if (in_memory == MemoryType.InMemory) {
            result = decrypt_in_memory(k, buffer.buffer, buffer.byteLength, value, value.byteLength);
        }
        else {
            result = decrypt_wasm(k, buffer.buffer, buffer.byteLength, value, value.byteLength);
        }
        if (result < 0)
            return ""; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(result);
            if (in_memory == MemoryType.InMemory) {
                result = decrypt_in_memory(k, buffer.buffer, buffer.byteLength, value, value.byteLength);
            }
            else {
                result = decrypt_wasm(k, buffer.buffer, buffer.byteLength, value, value.byteLength);
            }
            if (result < 0)
                return ""; // todo : report error
        }
        return String.UTF8.decode(value.slice(0, result), false);
    }
    
    static sign(in_memory: MemoryType, key_name: string, text: string): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let t = String.UTF8.encode(text, false);
        let value = new Uint8Array(64);
        let result = 0;
        if (in_memory == MemoryType.InMemory) {
            result = sign_in_memory(k, t, t.byteLength, value.buffer, value.byteLength);
        }
        else {
            result = sign_wasm(k, t, t.byteLength, value.buffer, value.byteLength);
        }
        let ret: u8[] = [];
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            if (in_memory == MemoryType.InMemory) {
                result = sign_in_memory(k, t, t.byteLength, value.buffer, value.byteLength);
            }
            else {
                result = sign_wasm(k, t, t.byteLength, value.buffer, value.byteLength);
            }
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static verify(in_memory: MemoryType, key_name: string, text: string, signature: u8[]): boolean
    {
        let k = String.UTF8.encode(key_name, true);
        let t = String.UTF8.encode(text, false);
        let buffer = new Uint8Array(signature.length);
        for (let i = 0; i < signature.length; ++i)
            buffer[i] = signature[i];
        if (in_memory == MemoryType.InMemory) {
            return verify_in_memory(k, t, t.byteLength, buffer.buffer, buffer.byteLength) != 0;
        }
        return verify_wasm(k, t, t.byteLength, buffer.buffer, buffer.byteLength) != 0;
    }
    
    static digest(algorithm: string, text: string): u8[]
    {
        let ret: u8[] = [];
        let iAlgorithm = CryptoImpl.algorithm(algorithm);
        if (iAlgorithm < 0)
            return ret;

        let t = String.UTF8.encode(text, false);
        let value = new Uint8Array(32);
        let result = digest_alg(iAlgorithm, t, t.byteLength, value.buffer, value.byteLength);
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = digest_alg(iAlgorithm, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }    
    static importKey(in_memory: MemoryType, key_name: string, format: string, b64Data: string, algorithm: string, extractable: boolean, usages: string[]): Key | null
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
            result = import_key_in_memory(String.UTF8.encode(key.name, true), iFormat, rawData.buffer, rawData.byteLength,
                iAlgorithm, extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength);
        }
        else {
            result = import_key(String.UTF8.encode(key.name, true), iFormat, rawData.buffer, rawData.byteLength,
                iAlgorithm, extractable ? 1 : 0, local_usages.buffer, local_usages.byteLength);
        }
        
        if (result < 0)
            return null;
    
        return key;
    }

    static exportKey(in_memory: MemoryType, key_name: string, format: string): u8[]
    {
        let ret: u8[] = [];
        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
            return ret;

        let key = new Uint8Array(32);

        let result = 0;
        if (in_memory == MemoryType.InMemory) {        
            result = export_key_in_memory(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
        }
        else {
            result = export_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
        }

        if (result < 0)
            return ret;
        if (result > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new Uint8Array(result);
            if (in_memory == MemoryType.InMemory) {        
                result = export_key_in_memory(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
            }
            else {
                result = export_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
            }
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < key.byteLength; ++i)
            ret[i] = key[i];
        return ret;
    }        

    static getPublicKey(in_memory: MemoryType, key_name: string, format: string): u8[]
    {
        let ret: u8[] = [];
        let iFormat = CryptoImpl.format(format);
        if (iFormat < 0)
            return ret;

        let key = new Uint8Array(32);
        let result = 0;
        if (in_memory == MemoryType.InMemory) {        
            result = get_public_key_in_memory(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
        }
        else {
            result = get_formatted_public_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
        }

        if (result < 0)
            return ret;
        if (result > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new Uint8Array(result);
            if (in_memory == MemoryType.InMemory) {        
                result = get_public_key_in_memory(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
            }
            else {
                result = get_formatted_public_key(String.UTF8.encode(key_name, true), iFormat, key.buffer, key.byteLength);
            }
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < key.byteLength; ++i)
            ret[i] = key[i];
        return ret;
    }        

    static getRandomBytes(size: i32): u8[] {
        const value = new Uint8Array(size);
        const result = get_random_bytes_wasm(value.buffer, value.byteLength);
        const ret: u8[] = []
        if (result < 0)
            return ret; // todo : report error
        for (let i = 0; i < size; ++i)
            ret[i] = value[i];
        return ret;
    }    
}

