/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid'

// @ts-ignore: decorator
@external("env", "key_exists")
declare function key_exists(key_name: ArrayBuffer): boolean;
// @ts-ignore: decorator
@external("env", "generate_encryption_key")
declare function generate_encryption_key(key_name: ArrayBuffer): i32;
// @ts-ignore: decorator
@external("env", "encrypt")
declare function encrypt_raw(key_name: ArrayBuffer, clear_text: ArrayBuffer, clear_text_size: i32, cipher_text: ArrayBuffer, cipher_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "decrypt")
declare function decrypt_raw(key_name: ArrayBuffer, cipher_text: ArrayBuffer, cipher_text_size: i32, clear_text: ArrayBuffer, clear_text_size: i32): i32;
// @ts-ignore: decorator
@external("env", "generate_signing_key")
declare function generate_signing_key(key_name: ArrayBuffer): i32;
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
@external("env", "digest")
declare function digest_raw(text: ArrayBuffer, text_size: i32, digest: ArrayBuffer, digest_size: i32): i32;
// @ts-ignore: decorator
@external("env", "get_random_bytes")
declare function get_random_bytes_raw(bytes: ArrayBuffer, size: i32): i32;

class PublicKey {

    bytes: u8[];

    constructor(bytes: u8[]) {
        this.bytes = bytes;
    }

    getPem(): string {
        // this is the "fixed part" of the public key, including the curve identification (secp256r1)
        const asn1_header = [48, 89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134, 72, 206, 61, 3, 1, 7, 3, 66, 0, 4];
        let buffer = new Uint8Array(asn1_header.length + this.bytes.length);
        buffer.set(asn1_header);
        buffer.set(this.bytes, asn1_header.length);
        const pem = `-----BEGIN PUBLIC KEY-----
        ${b64encode(buffer)}
        -----END PUBLIC KEY-----`;
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

class KeyAES extends Key {

    encrypt(data: string): u8[] {
        let k = String.UTF8.encode(this.name, true);
        let t = String.UTF8.encode(data, false);
        let value = new Uint8Array(64);
        let result = encrypt_raw(k, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = []
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = encrypt_raw(k, t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }

    decrypt(cipher: u8[]): string {
        let k = String.UTF8.encode(this.name, true);
        let buffer = new Uint8Array(cipher.length);
        for (let i = 0; i < cipher.length; ++i)
            buffer[i] = cipher[i];
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
}

class CryptoAES {

    static generateKey(keyName: string = ""): KeyAES {
        const key = new KeyAES(keyName);
        let nameBuf = String.UTF8.encode(key.name, true);
        generate_encryption_key(nameBuf);
        return key;
    }

    static getKey(keyName: string): KeyAES | null {
        let nameBuf = String.UTF8.encode(keyName, true);
        if (key_exists(nameBuf))
            return new KeyAES(keyName);
        return null
    }
}

class KeyECC extends Key {

    sign(text: string): u8[] {
        let k = String.UTF8.encode(this.name, true);
        let t = String.UTF8.encode(text, false);
        let value = new Uint8Array(64);
        let result = sign_raw(k, t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = []
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

    verify(data: string, signature: u8[]): boolean {
        let k = String.UTF8.encode(this.name, true);
        let t = String.UTF8.encode(data, false);
        let buffer = new Uint8Array(signature.length);
        for (let i = 0; i < signature.length; ++i)
            buffer[i] = signature[i];
        return verify_raw(k, t, t.byteLength, buffer.buffer, buffer.byteLength) != 0;
    }

    getPublicKey(): PublicKey {
        let k = String.UTF8.encode(this.name, true);
        let value = new Uint8Array(64);
        let result = get_public_key_raw(k, value.buffer, value.byteLength);
        let ret: u8[] = [];
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
}

class CryptoECDSA {

    static generateKey(keyName: string = ""): KeyECC {
        const key = new KeyECC(keyName);
        let nameBuf = String.UTF8.encode(key.name, true);
        generate_signing_key(nameBuf);
        return key;
    }

    static getKey(keyName: string): KeyECC | null {
        let nameBuf = String.UTF8.encode(keyName, true);
        if (key_exists(nameBuf))
            return new KeyECC(keyName);
        return null
    }

}

class CryptoSHA {

    static digest(data: string): u8[] {
        let t = String.UTF8.encode(data, false);
        let value = new Uint8Array(32);
        let result = digest_raw(t, t.byteLength, value.buffer, value.byteLength);
        let ret: u8[] = []
        if (result < 0)
            return ret; // todo : report error
        if (result > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new Uint8Array(result);
            result = digest_raw(t, t.byteLength, value.buffer, value.byteLength);
            if (result < 0)
                return ret; // todo : report error
        }
        for (let i = 0; i < result; ++i)
            ret[i] = value[i];
        return ret;
    }
}

export class AES extends CryptoAES { };
export class ECDSA extends CryptoECDSA { };
export class SHA extends CryptoSHA { };

export function getKey(keyName: string): Key | null {
    let nameBuf = String.UTF8.encode(keyName, true);
    if (key_exists(nameBuf))
        return new Key(keyName);
    return null
}

export function getRandomValues(size: i32): u8[] {
    let value = new Uint8Array(size);
    let result = get_random_bytes_raw(value.buffer, value.byteLength);
    let ret: u8[] = []
    if (result < 0)
        return ret; // todo : report error
    for (let i = 0; i < size; ++i)
        ret[i] = value[i];
    return ret;
}

// export const Crypto = {

//     AES: CryptoAES,
//     ECDSA: CryptoECDSA,
//     SHA: CryptoSHA,

//     getKey: function (keyName: string): Key | null {
//         let nameBuf = String.UTF8.encode(keyName, true);
//         if (key_exists(nameBuf))
//             return new Key(keyName);
//         return null
//     },

//     getRandomValues: function (size: i32): u8[] {
//         let value = new Uint8Array(size);
//         let result = get_random_bytes_raw(value.buffer, value.byteLength);
//         let ret: u8[] = []
//         if (result < 0)
//             return ret; // todo : report error
//         for (let i = 0; i < size; ++i)
//             ret[i] = value[i];
//         return ret;
//     }
// }

export class Utils {

    static pointerToString(ptr: i32): string {
        let len = 0;
        while (load<u8>(ptr + len) != 0)
            len++;
        let buf = new ArrayBuffer(len + 1);
        memory.copy(changetype<usize>(buf), ptr, len + 1);
        return String.UTF8.decode(buf, true);
    }

    static stringToPointer(str: string): i32 {
        let buf = String.UTF8.encode(str, true);
        let ptr = changetype<usize>(buf);
        return ptr;
    }

}