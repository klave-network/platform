/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { CryptoImpl, Key, MemoryType } from './crypto_impl';

class KeyAES extends Key {

    encrypt(signature_info: string, data: string): u8[] {
        return CryptoImpl.encrypt(this.name, signature_info, data);
    }

    decrypt(signature_info: string, cipher: u8[]): string {
        return CryptoImpl.decrypt(this.name, signature_info, cipher);
    }
}

export class CryptoAES {

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
        if (CryptoImpl.keyExists(keyName))
            return new KeyAES(keyName);
        return null
    }

    static generateKey(keyName: string, algorithm: string = 'aes128gcm', algo_metadata: string = '', extractable: boolean = false): KeyAES | null 
    {
        const key = CryptoImpl.generateKey(MemoryType.Persistent, keyName, algorithm, algo_metadata, extractable, ["decrypt", "encrypt"]);
        if (!key) {
            return null;
        }

        const kAES = new KeyAES(key.name);
        return kAES;
    }

    static importKey(keyName: string, format: string, keyData: string, algorithm: string = 'aes128gcm', algo_metadata: string = '', extractable: boolean = false): KeyAES | null {
        
        //Crypto SDK currently only supports import of algorithm "aes128gcm" in a "raw" format.
        //JWK will eventually be added
        if (!this.isValidFormat(format))
            return null;
        
        if (!this.isValidAlgorithm(algorithm))
            return null;

        const key = new KeyAES(keyName);
        const result = CryptoImpl.importKey(MemoryType.Persistent, key.name, format, keyData, algorithm, algo_metadata, extractable, ["decrypt", "encrypt"]);
        if (!result)
            return null;
        return key;
    }

    static exportKey(key_name: string, format: string): u8[]
    {
        const ret: u8[] = [];
        if (!this.isValidFormat(format))
            return ret;
        return CryptoImpl.exportKey(key_name, format);
    }
}

