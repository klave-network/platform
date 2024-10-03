/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { CryptoImpl, Key, MemoryType } from './crypto_impl';
import { PrivateKey, PublicKey } from './crypto_keys';

class KeyRSA extends Key {

    encrypt(encrypt_info: string, data: string): u8[] {
        return CryptoImpl.encrypt(this.name, encrypt_info, data);
    }

    decrypt(encrypt_info: string, cipher: u8[]): string {
        return CryptoImpl.decrypt(this.name, encrypt_info, cipher);
    }

    sign(sign_info: string, text: string): u8[] {
        return CryptoImpl.sign(this.name, sign_info, text);
    }

    verify(sign_info: string, data: string, signature: u8[]): boolean {
        return CryptoImpl.verify(this.name, sign_info, data, signature);
    }

    getPublicKey(format: string = 'spki'): PublicKey {
        if (!CryptoRSA.isValidFormat(format))
            return new PublicKey([]);
        let result = CryptoImpl.getPublicKey(this.name, format);
        return new PublicKey(result);
    }

    getPrivateKey(format: string = 'pkcs1'): PrivateKey {        
        if (!CryptoRSA.isValidFormat(format))
            return new PrivateKey([]);

        let result = CryptoImpl.exportKey(this.name, format);
        return new PrivateKey(result);
    }

}

export class CryptoRSA {

    static isValidFormat(format: string): boolean {
        if (format != "raw")
            return false;
        return true;
    }

    static isValidAlgorithm(algorithm: string): boolean {
        if (algorithm != "rsa2048" && algorithm != "rsa3072" && algorithm != "rsa4096")
            return false;
        return true;
    }

    static getKey(keyName: string): KeyRSA | null {
        if (CryptoImpl.keyExists(MemoryType.Persistent, keyName))
            return new KeyRSA(keyName);
        return null
    }

    static generateKey(keyName: string, algorithm: string = 'rsa2048', algo_metadata: string = '', extractable: boolean = false): KeyRSA | null 
    {
        const key = CryptoImpl.generateKey(MemoryType.Persistent, keyName, algorithm, algo_metadata, extractable, ["sign", "decrypt"]);
        if (!key) {
            return null;
        }

        const kAES = new KeyRSA(key.name);
        return kAES;
    }

    static generateKey_deprecated(keyName: string, algo_metadata: string = '', extractable: boolean = false): KeyRSA | null {
        return this.generateKey(keyName, 'rsa2048', algo_metadata, extractable);
    }    

    static importKey(keyName: string, format: string, keyData: string, algorithm: string = 'rsa2048', algo_metadata: string = '', extractable: boolean = false): KeyRSA | null {
        
        //Crypto SDK currently only supports import of algorithm "rsa2048" in a "raw" format.
        //JWK will eventually be added
        if (!this.isValidFormat(format))
            return null;
        
        if (!this.isValidAlgorithm(algorithm))
            return null;

        if (keyData.length === 0)
            return null;

        const key = new KeyRSA(keyName);
        const result = CryptoImpl.importKey(MemoryType.Persistent, key.name, format, keyData, algorithm, algo_metadata, extractable, 
            (format === "spki") ? 
                ["verify", "encrypt"] :  //Public Key
                ["sign", "decrypt"]);    //Private Key
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
