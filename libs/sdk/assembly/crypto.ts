/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { decode, encode as b64encode } from 'as-base64/assembly';
import { CryptoImpl, Key, MemoryType } from './crypto_impl';
import { SubtleCrypto } from './crypto_subtle';

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

class KeyAES extends Key {

    encrypt(data: string): u8[] {
        return CryptoImpl.encrypt(MemoryType.Persistent, this.name, data);
    }

    decrypt(cipher: u8[]): string {
        return CryptoImpl.decrypt(MemoryType.Persistent, this.name, cipher);
    }
}

class CryptoAES {

    static isValidFormat(format: string): boolean {
        if (format != "raw")
            return false;
        return true;
    }

    static isValidAlgorithm(algorithm: string): boolean {
        if (algorithm != "aes128gcm")
            return false;
        return true;
    }

    static getKey(keyName: string): KeyAES | null {
        if (CryptoImpl.keyExists(MemoryType.Persistent, keyName))
            return new KeyAES(keyName);
        return null
    }

    static generateKey(keyName: string, algorithm: string = 'aes128gcm', extractable: boolean = false): KeyAES | null 
    {
        const key = CryptoImpl.generateKey(MemoryType.Persistent, keyName, algorithm, extractable, ["decrypt", "encrypt"]);
        if (!key) {
            return null;
        }

        const kAES = new KeyAES(key.name);
        return kAES;
    }

    static generateKey_deprecated(keyName: string, extractable: boolean = false): KeyAES | null {
        return this.generateKey(keyName, 'aes128gcm', extractable);
    }    

    static importKey(keyName: string, format: string, keyData: string, algorithm: string = 'aes128gcm', extractable: boolean = false): KeyAES | null {
        
        //Crypto SDK currently only supports import of algorithm "aes128gcm" in a "raw" format.
        //JWK will eventually be added
        if (!this.isValidFormat(format))
            return null;
        
        if (!this.isValidAlgorithm(algorithm))
            return null;

        const key = new KeyAES(keyName);
        const result = CryptoImpl.importKey(MemoryType.Persistent, key.name, format, keyData, algorithm, extractable, ["decrypt", "encrypt"]);
        if (!result)
            return null;
        return key;
    }

    static importKey_deprecated(keyName: string, keyData: string, format: string = 'raw', extractable: boolean = false): KeyAES | null {
        return this.importKey(keyName, keyData, 'aes128gcm', format, extractable);
    }

    static exportKey(key_name: string, format: string): u8[]
    {
        const ret: u8[] = [];
        if (!this.isValidFormat(format))
            return ret;
        return CryptoImpl.exportKey(MemoryType.Persistent, key_name, format);
    }
}

class KeyECC extends Key {

    sign(text: string): u8[] {
        return CryptoImpl.sign(MemoryType.Persistent, this.name, text);
    }

    verify(data: string, signature: u8[]): boolean {
        return CryptoImpl.verify(MemoryType.Persistent, this.name, data, signature);
    }

    getPublicKey(format: string = 'spki'): PublicKey {
        if (!CryptoECDSA.isValidFormat(format))
            return new PublicKey([]);
        let result = CryptoImpl.getPublicKey(MemoryType.Persistent, this.name, format);
        return new PublicKey(result);
    }

    getPrivateKey(format: string = 'pkcs8'): PrivateKey {        
        if (!CryptoECDSA.isValidFormat(format))
            return new PrivateKey([]);

        let result = CryptoImpl.exportKey(MemoryType.Persistent, this.name, format);
        return new PrivateKey(result);
    }
}

@JSON
export class SimpleKeyPair {
    privateKey: string | null = null;
    publicKey: string | null = null;
}

class CryptoECDSA {

    static isValidFormat(algorithm: string): boolean {
        if (algorithm == "jwk")
            return false;
        return true;
    }

    static isValidAlgorithm(algorithm: string): boolean {
        if (algorithm != "secp256r1" && algorithm != "ecc256" &&
            algorithm != "secp384r1" && algorithm != "ecc384" &&
            algorithm != "secp521r1" && algorithm != "ecc521" &&
            algorithm != "secp256k1")
            return false;
        return true;
    }

    static getKey(keyName: string): KeyECC | null {        
        if (CryptoImpl.keyExists(MemoryType.Persistent, keyName))
            return new KeyECC(keyName);
        return null
    }

    static generateKey(keyName: string, algorithm: string = 'secp256r1', extractable: boolean = false): KeyECC | null {
        if (!this.isValidAlgorithm(algorithm))
            return null;

        //It will only generate a Private Key that can be derived into a Public Key of the same algorithm
        const key = CryptoImpl.generateKey(MemoryType.Persistent, keyName, algorithm, extractable, ["sign"]);
        if (!key) {
            return null;
        }

        const kECC = new KeyECC(key.name);
        return kECC;
    }

    static importKey(keyName: string, format: string, keyData: string, algorithm: string = 'secp256r1', extractable: boolean = false): KeyECC | null {

        if (keyData.length === 0)
            return null;

        const key = new KeyECC(keyName);

        if (!this.isValidFormat(format))
            return null;

        if (!this.isValidAlgorithm(algorithm))
            return null;
        
        const result = CryptoImpl.importKey(MemoryType.Persistent, key.name, format, keyData, algorithm, extractable, 
            (format === "spki") ? 
                ["verify"] :  //Public Key
                ["sign"]);    //Private Key

        if (!result)
            return null;

        return key;
    }

    static exportKey(key_name: string, format: string): u8[]
    {
        const ret: u8[] = [];
        if (!this.isValidFormat(format))
            return ret;
        return CryptoImpl.exportKey(MemoryType.Persistent, key_name, format);
    }

    //Deprecated methods
    static generateKey_deprecated(keyName: string, extractable: boolean = false): KeyECC | null {
        return this.generateKey(keyName, 'secp256r1', extractable);
    }    

    static importKey_deprecated(keyName: string, keyPair: SimpleKeyPair, format: string = 'raw', extractable: boolean = false): KeyECC | null {
        if (keyPair.privateKey && keyPair.publicKey)
            return null;
    
        const keyBuff = keyPair.privateKey ? keyPair.privateKey : keyPair.publicKey;
        if (!keyBuff)
            return null;

        return this.importKey(keyName, keyBuff, 'secp256r1', format, extractable);
    }
}

class CryptoSHA {

    static isValidAlgorithm(algorithm: string): boolean {
        if (algorithm != "sha2-256" && algorithm != "sha2_256" && algorithm != "sha256" &&
            algorithm != "sha2-384" && algorithm != "sha2_384" && algorithm != "sha384" &&
            algorithm != "sha2-512" && algorithm != "sha2_512" && algorithm != "sha512" &&
            algorithm != "sha3-256" && algorithm != "sha3_256" && 
            algorithm != "sha3-384" && algorithm != "sha3_384" && 
            algorithm != "sha3-512" && algorithm != "sha3_512")
            return false;
        return true;
    }

    static digestSize(algorithm: string): number {
        switch (algorithm)
        {
        case "sha3-256": 
        case "sha3_256": 
        case "sha2-256": 
        case "sha2_256": 
        case "sha256": 
            return 32;
        case "sha3-384": 
        case "sha3_384": 
        case "sha2-384": 
        case "sha2_384": 
        case "sha384": 
            return 48;
        case "sha3-512": 
        case "sha3_512": 
        case "sha2-512": 
        case "sha2_512": 
        case "sha512": 
            return 64;
        default:            
            break;
        }        
        return 0;
    }

    static digest(algorithm: string, data: string): u8[]
    {        
        let ret: u8[] = [];
        if (!this.isValidAlgorithm(algorithm))
            return ret;

        return CryptoImpl.digest(algorithm, data);
    }

    static digest_deprecated(data: string): u8[] 
    {
        return this.digest('sha2-256', data);
    }
}

export class AES extends CryptoAES { };
export class ECDSA extends CryptoECDSA { };
export class SHA extends CryptoSHA { };
export class Subtle extends SubtleCrypto { }

export function getKey(keyName: string): Key | null {    
    if (CryptoImpl.keyExists(MemoryType.Persistent, keyName))
        return new Key(keyName);
    return null
}

export function getRandomValues(size: i32): u8[] {
    return CryptoImpl.getRandomBytes(size);
}

export class Utils {

    static convertToU8Array(input: Uint8Array): u8[] {
        let ret: u8[] = [];
        for (let i = 0; i < input.length; ++i)
            ret[i] = input[i];
    
        return ret;
    }
    
    static convertToUint8Array(input: u8[]): Uint8Array {
        let value = new Uint8Array(input.length);
        for (let i = 0; i < input.length; ++i) {
            value[i] = input[i];
        }
    
        return value;
    }
    
}
