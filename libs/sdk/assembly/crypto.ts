/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid'

// @ts-ignore: decorator
@external("env", "key_exists")
declare function key_exists(key_name: ArrayBuffer): boolean;
// @ts-ignore: decorator
@external("env", "encrypt")
declare function encrypt_raw(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "decrypt")
declare function decrypt_raw(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "generate_key")
declare function generate_key(key_name: ArrayBuffer, algorithm: i32, extractable: boolean, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "import_key")
declare function import_key_raw(key_name: ArrayBuffer, key_format: i32, key_data: ArrayBuffer, key_data_size: i32, algorithm: i32, extractable: i32, usages: ArrayBuffer, usages_size: i32): i32;
// @ts-ignore: decorator
@external("env", "export_key")
declare function export_key_raw(key_name: ArrayBuffer, key_format: i32, key: ArrayBuffer, key_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_public_key")
declare function get_public_key_raw(key_name: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "sign")
declare function sign_raw(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "verify")
declare function verify_raw(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "digest_alg")
declare function digest_alg_raw(algorithm: i32, text: ArrayBuffer, text_size: i32, digest: ArrayBuffer, digest_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_random_bytes")
declare function get_random_bytes_raw(bytes: ArrayBuffer, size: i32): i32;

class PublicKey {

    bytes: u8[];

    constructor(bytes: u8[]) {
        this.bytes = bytes;
    }

    getPem(): string {
        const buffer = new Uint8Array(this.bytes.length);
        buffer.set(this.bytes);
        const pem = `-----BEGIN PUBLIC KEY-----
        ${b64encode(buffer)}
        -----END PUBLIC KEY-----`;
        return pem;
    }
}

class PrivateKey {

    bytes: u8[];

    constructor(bytes: u8[]) {
        this.bytes = bytes;
    }

    getPem(): string {
        const buffer = new Uint8Array(this.bytes.length);
        buffer.set(this.bytes);
        const pem = `-----BEGIN PRIVATE KEY-----
        ${b64encode(buffer)}
        -----END PRIVATE KEY-----`;
        return pem;
    }
}

class Key {

    name: string;

    constructor(keyName: string) {
        if (keyName.length !== 0 && keyName !== "")
            this.name = keyName;
        else {
            const rnds = getRandomValues(16);
            // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
            unchecked(rnds[6] = (rnds[6] & 0x0f) | 0x40);
            unchecked(rnds[8] = (rnds[8] & 0x3f) | 0x80);

            const rndsArray = new Uint8Array(rnds.length);
            rndsArray.set(rnds);
            this.name = uuid(rndsArray);
        }
    }
}

class SubtleCrypto {

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
        if (input === "ecc256")
            return 0;
        if (input === "ecc384")
            return 1;
        if (input === "ecc521")
            return 2;
        if (input === "aes128gcm")
            return 3;
        if (input === "sha256")
            return 4;
        if (input === "sha384")
            return 5;
        if (input === "sha512")
            return 6;
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

    static generate_key(key_name: string, algorithm: string, extractable: boolean, usages: Uint8Array): Key | null
    {
        let iAlgorithm = SubtleCrypto.algorithm(algorithm);
        if (iAlgorithm < 0)
            return null;

        const key = new Key(key_name);

        let result = generate_key(
            String.UTF8.encode(key.name, true), iAlgorithm, extractable, usages.buffer, usages.length);
        if (result < 0)
            return null;

        return key;
    }

    static key_exists(key_name: string): bool
    {
        const nameBuf = String.UTF8.encode(key_name, true);
        if (key_exists(nameBuf))
        {
            return true;
        }
        return false;
    }

    static encrypt(key_name: string, clear_text: string): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let t = String.UTF8.encode(clear_text, false);
        let value = new Uint8Array(64);
        let result = encrypt_raw(k, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = [];
        if (result < 0)
            return ret;
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = encrypt_raw(k, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static decrypt(key_name: string, cipher_text: u8[]): string
    {
        let k = String.UTF8.encode(key_name, true);
        let buffer = new Uint8Array(cipher_text.length);
        for (let i = 0; i < cipher_text.length; ++i)
            buffer[i] = cipher_text[i];
        let value = new ArrayBuffer(64);
        let result = decrypt_raw(k, buffer.buffer, buffer.byteLength, value, value.byteLength);
        if (result < 0)
            return ""; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(result);
            result = decrypt_raw(k, buffer.buffer, buffer.byteLength, value, value.byteLength);
            if (result < 0)
                return ""; // todo : report error
        }
        return String.UTF8.decode(value.slice(0, result), false);
    }
    
    static sign(key_name: string, text: string): u8[]
    {
        let k = String.UTF8.encode(key_name, true);
        let t = String.UTF8.encode(text, false);
        let value = new Uint8Array(64);
        let result = sign_raw(k, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = [];
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = sign_raw(k, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
    
    static verify(key_name: string, text: string, signature: u8[]): boolean
    {
        let k = String.UTF8.encode(key_name, true);
        let t = String.UTF8.encode(text, false);
        let buffer = new Uint8Array(signature.length);
        for (let i = 0; i < signature.length; ++i)
            buffer[i] = signature[i];
        return verify_raw(k, t, t.byteLength, buffer.buffer, buffer.byteLength) != 0;
    }
    
    static digest(algorithm: i32, text: string): u8[]
    {
        let t = String.UTF8.encode(text, false);
        let value = new Uint8Array(32);
        let result = digest_alg_raw(algorithm, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = [];
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = digest_alg_raw(algorithm, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }    
    static import_key(key_name: string, format: i32, b64Data: string, algorithm: i32, extractable: i32, usages: Uint8Array): Key | null
    {
        const key = new Key(key_name);

        let rawData = decode(b64Data);
        let result = import_key_raw(String.UTF8.encode(key.name, true), format, rawData.buffer, rawData.byteLength,
            algorithm, extractable, usages.buffer, usages.byteLength);
        
        if (result < 0)
            return null;
    
        return key;
    }

    static export_key(key_name: string, format: i32): u8[]
    {
        let key = new Uint8Array(32);
        let result = export_key_raw(String.UTF8.encode(key_name, true), format, key.buffer, key.byteLength);
    
        let ret: u8[] = [];
        if (result < 0)
            return ret;
        if (result > key.byteLength) {
            // buffer not big enough, retry with a properly sized one
            key = new Uint8Array(result);
            result = export_key_raw(String.UTF8.encode(key_name, true), format, key.buffer, key.byteLength);
            if (result < 0)
                return ret;
        }
        for (let i = 0; i < key.byteLength; ++i)
            ret[i] = key[i];
        return ret;
    }        
}

class KeyAES extends Key {

    encrypt(data: string): u8[] {
        return SubtleCrypto.encrypt(this.name, data);
    }

    decrypt(cipher: u8[]): string {
        return SubtleCrypto.decrypt(this.name, cipher);
    }
}

class CryptoAES {

    static generateKey(keyName: string, extractable: boolean = false): KeyAES | null 
    {
        const usages = new Uint8Array(2);
        usages[0] = 0; // decrypt
        usages[1] = 1; // encrypt

        const key = SubtleCrypto.generate_key(keyName, "aes128gcm", extractable, usages);
        if (!key) {
            return null;
        }

        const kAES = new KeyAES(key.name);
        return kAES;
    }

    static getKey(keyName: string): KeyAES | null {
        const nameBuf = String.UTF8.encode(keyName, true);
        if (key_exists(nameBuf))
            return new KeyAES(keyName);
        return null
    }

    static isValidFormat(format: string): bool {
        if (format != "raw")
            return false;
        return true;
    }

    static isValidAlgorithm(format: string): bool {
        if (format != "aes128gcm")
            return false;
        return true;
    }

    static importKey(keyName: string, keyData: string, algorithm: string = 'aes128gcm', format: string = 'raw', extractable: boolean = false): KeyAES | null {
        let iFormat = SubtleCrypto.format(format);
        if (iFormat < 0 && !this.isValidFormat(format))
            return null;

        let iAlgorithm = SubtleCrypto.algorithm(algorithm);
        if (iAlgorithm < 0 && !this.isValidAlgorithm(algorithm))
            return null;

        const key = new KeyAES(keyName);

        const usages = new Uint8Array(2);
        usages[0] = SubtleCrypto.usage("decrypt");
        usages[1] = SubtleCrypto.usage("encrypt");

        //Crypto SDK currently only supports import of algorithm "aes128gcm" in a "raw" format.
        //JWK will eventually be added
        const result = SubtleCrypto.import_key(key.name, iFormat, keyData, iAlgorithm, extractable ? 1 : 0, usages);
        if (!result)
            return null;

        return key;
    }

    static importKey_deprecated(keyName: string, keyData: string, format: string = 'raw', extractable: boolean = false): KeyAES | null {
        return this.importKey(keyName, keyData, 'aes128gcm', format, extractable);
    }

    static export_key(key_name: string, format: i32): u8[]
    {
        return SubtleCrypto.export_key(key_name, format);
    }
}

class KeyECC extends Key {

    sign(text: string): u8[] {
        return SubtleCrypto.sign(this.name, text);
    }

    verify(data: string, signature: u8[]): boolean {
        return SubtleCrypto.verify(this.name, data, signature);
    }

    getPublicKey(): PublicKey {
        const k = String.UTF8.encode(this.name, true);
        let value = new Uint8Array(64);
        let result = get_public_key_raw(k, value.buffer, value.byteLength);
        const ret: u8[] = [];
        if (result < 0)
            return new PublicKey(ret); // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = get_public_key_raw(k, value.buffer, value.byteLength);
            if (result < 0)
                return new PublicKey(ret); // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return new PublicKey(ret);
    }

    getPrivateKey(): PrivateKey {
        const k = String.UTF8.encode(this.name, true);
        let value = new Uint8Array(32);
        let result = export_key_raw(k, 0, value.buffer, value.byteLength);
        const ret: u8[] = [];
        if (result < 0)
            return new PrivateKey(ret); // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = export_key_raw(k, 0, value.buffer, value.byteLength);
            if (result < 0)
                return new PrivateKey(ret); // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return new PrivateKey(ret);
    }
}

@JSON
export class SimpleKeyPair {
    privateKey: string | null = null;
    publicKey: string | null = null;
}

class CryptoECDSA {

    static isValidFormat(algorithm: string): bool {
        if (algorithm == "jwk")
            return false;
        return true;
    }

    static isValidAlgorithm(algorithm: string): bool {
        if (algorithm != "ecc256" &&
            algorithm != "ecc384" &&
            algorithm != "ecc521")
            return false;
        return true;
    }

    static generateKey(keyName: string, algorithm: string = 'ecc256', extractable: boolean = false): KeyECC | null {
        let iAlgorithm = SubtleCrypto.algorithm(algorithm);
        if (iAlgorithm < 0 && !this.isValidAlgorithm(algorithm))
            return null;

        //It will only generate a Private Key that can be derived into a Public Key of the same algorithm
        const usages = new Uint8Array(2);
        usages[0] = SubtleCrypto.usage("sign");
        usages[1] = SubtleCrypto.usage("derive_key");

        const key = SubtleCrypto.generate_key(keyName, iAlgorithm, extractable, usages);
        if (!key) {
            return null;
        }

        const kECC = new KeyECC(key.name);
        return kECC;
    }

    static generateKey_deprecated(keyName: string, extractable: boolean = false): KeyECC | null {
        return this.generateKey(keyName, 'ecc256', extractable);
    }    

    static getKey(keyName: string): KeyECC | null {
        const nameBuf = String.UTF8.encode(keyName, true);
        if (key_exists(nameBuf))
            return new KeyECC(keyName);
        return null
    }

    static importKey(keyName: string, keyData: string, algorithm: string = 'ecc256', format: string = 'raw', extractable: boolean = false): KeyECC | null {

        if (keyData.length === 0)
            return null;

        const key = new KeyECC(keyName);

        let iFormat = SubtleCrypto.format(format);
        if (iFormat < 0 && !this.isValidFormat(format))
            return null;

        let iAlgorithm = SubtleCrypto.algorithm(algorithm);
        if (iAlgorithm < 0 && !this.isValidAlgorithm(algorithm))
            return null;

        let usages = new Uint8Array(2);
        if (SubtleCrypto.format("spki"))    //Public Key
        {
            usages = new Uint8Array(1);
            usages[0] = SubtleCrypto.usage("verify")
        }
        else    //Private Key
        {
            usages[0] = SubtleCrypto.usage("sign");
            usages[1] = SubtleCrypto.usage("derive_key");
        }

        const result = SubtleCrypto.import_key(key.name, iFormat, keyData, iAlgorithm, extractable ? 1 : 0, usages);
        if (!result)
            return null;

        return key;
    }

    static importKey_deprecated(keyName: string, keyPair: SimpleKeyPair, format: string = 'raw', extractable: boolean = false): KeyECC | null {
        if (keyPair.privateKey && keyPair.publicKey)
            return null;
    
        const keyBuff = keyPair.privateKey ? keyPair.privateKey : keyPair.publicKey;
        if (!keyBuff)
            return null;

        return this.importKey(keyName, keyBuff, 'ecc256', format, extractable);
    }
}

class CryptoSHA {

    static isValidAlgorithm(algorithm: string): bool {
        if (algorithm != "sha256" &&
            algorithm != "sha384" &&
            algorithm != "sha512")
            return false;
        return true;
    }

    static digestSize(algorithm: string): number {
        switch (algorithm)
        {
        case "sha256": return 32;
        case "sha384": return 48;
        case "sha512": return 64;
        default:            
            break;
        }        
        return 0;
    }

    static digest(algorithm: string, data: string): u8[] | null 
    {
        let iAlgorithm = SubtleCrypto.algorithm(algorithm);
        if (iAlgorithm < 0 && !this.isValidAlgorithm(algorithm))
            return null;

        return SubtleCrypto.digest(iAlgorithm, data);
    }

    static digest_deprecated(data: string): u8[] | null {
        return this.digest('sha256', data);
    }
}

export class AES extends CryptoAES { };
export class ECDSA extends CryptoECDSA { };
export class SHA extends CryptoSHA { };

export function getKey(keyName: string): Key | null {
    const nameBuf = String.UTF8.encode(keyName, true);
    if (key_exists(nameBuf))
        return new Key(keyName);
    return null
}

export function getRandomValues(size: i32): u8[] {
    const value = new Uint8Array(size);
    const result = get_random_bytes_raw(value.buffer, value.byteLength);
    const ret: u8[] = []
    if (result < 0)
        return ret; // todo : report error
    for (let i = 0; i < size; ++i)
        ret[i] = value[i];
    return ret;
}

export class Utils {

    static pointerToString(ptr: i32): string {
        let len = 0;
        while (load<u8>(ptr + len) != 0)
            len++;
        const buf = new ArrayBuffer(len + 1);
        memory.copy(changetype<usize>(buf), ptr, len + 1);
        return String.UTF8.decode(buf, true);
    }

    static stringToPointer(str: string): i32 {
        const buf = String.UTF8.encode(str, true);
        const ptr = changetype<usize>(buf);
        return ptr;
    }

}
