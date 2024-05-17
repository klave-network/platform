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
        const buffer = new Uint8Array(asn1_header.length + this.bytes.length);
        buffer.set(asn1_header);
        buffer.set(this.bytes, asn1_header.length);
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
        return -1;
    }
}

class KeyAES extends Key {

    encrypt(data: string): u8[] {
        const k = String.UTF8.encode(this.name, true);
        const t = String.UTF8.encode(data, false);
        let value = new Uint8Array(64);
        let result = encrypt_raw(k, t, t.byteLength, value.buffer, value.byteLength);
        const ret: u8[] = []
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
        const k = String.UTF8.encode(this.name, true);
        const buffer = new Uint8Array(cipher.length);
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

    static generateKey(keyName: string, extractable: boolean = false): KeyAES {
        const key = new KeyAES(keyName);
        const nameBuf = String.UTF8.encode(key.name, true);

        const usages = new Uint8Array(2);
        usages[0] = 0; // decrypt
        usages[1] = 1; // encrypt

        generate_key(nameBuf, 1 /* AES-GCM */, extractable, usages.buffer, usages.byteLength)
        return key;
    }

    static getKey(keyName: string): KeyAES | null {
        const nameBuf = String.UTF8.encode(keyName, true);
        if (key_exists(nameBuf))
            return new KeyAES(keyName);
        return null
    }

    static importKey(keyName: string, keyData: string, format: string = 'raw', extractable: boolean = false): KeyAES | null {

        const key = new KeyAES(keyName);
        const nameBuf = String.UTF8.encode(key.name, true);
        const rawData = decode(keyData);

        let iFormat = SubtleCrypto.format(format);
        if (iFormat < 0)
            return null;

        const usages = new Uint8Array(2);
        usages[0] = 0; // decrypt
        usages[1] = 1; // encrypt

        const result = import_key_raw(nameBuf, iFormat, rawData.buffer, rawData.byteLength, 1 /* AES-GCM */, extractable ? 1 : 0, usages.buffer, usages.byteLength);
        if (result < 0)
            return null;

        return key;
    }
}

class KeyECC extends Key {

    sign(text: string): u8[] {
        const k = String.UTF8.encode(this.name, true);
        const t = String.UTF8.encode(text, false);
        let value = new Uint8Array(64);
        let result = sign_raw(k, t, t.byteLength, value.buffer, value.byteLength);
        const ret: u8[] = []
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
        const k = String.UTF8.encode(this.name, true);
        const t = String.UTF8.encode(data, false);
        const buffer = new Uint8Array(signature.length);
        for (let i = 0; i < signature.length; ++i)
            buffer[i] = signature[i];
        return verify_raw(k, t, t.byteLength, buffer.buffer, buffer.byteLength) != 0;
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

    static generateKey(keyName: string, extractable: boolean = false): KeyECC {
        const key = new KeyECC(keyName);
        const nameBuf = String.UTF8.encode(key.name, true);

        const usages = new Uint8Array(2);
        usages[0] = 3; // sign
        usages[1] = 5; // derive_key

        generate_key(nameBuf, 0 /* ECDSA */, extractable, usages.buffer, usages.byteLength)
        return key;
    }

    static getKey(keyName: string): KeyECC | null {
        const nameBuf = String.UTF8.encode(keyName, true);
        if (key_exists(nameBuf))
            return new KeyECC(keyName);
        return null
    }

    static importKey(keyName: string, keyPair: SimpleKeyPair, format: string = 'raw', extractable: boolean = false): KeyECC | null {

        if (keyPair.privateKey && keyPair.publicKey)
            return null;

        const keyBuff = keyPair.privateKey ? keyPair.privateKey : keyPair.publicKey;

        if (!keyBuff)
            return null;

        const key = new KeyECC(keyName);
        const nameBuf = String.UTF8.encode(key.name, true);
        const rawData = decode(keyBuff);

        let iFormat = SubtleCrypto.format(format);
        if (iFormat < 0)
            return null;

        if (iFormat === 1) // spki
            return null;

        const usages = new Uint8Array(1);
        usages[0] = keyPair.privateKey ? 2 : 3

        const result = import_key_raw(nameBuf, iFormat, rawData.buffer, rawData.byteLength, 0 /* ECDSA */, extractable ? 1 : 0, usages.buffer, usages.byteLength);
        if (result < 0)
            return null;

        return key;
    }
}

class CryptoSHA {

    static digest(data: string): u8[] {
        const t = String.UTF8.encode(data, false);
        let value = new Uint8Array(32);
        let result = digest_raw(t, t.byteLength, value.buffer, value.byteLength);
        const ret: u8[] = []
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
