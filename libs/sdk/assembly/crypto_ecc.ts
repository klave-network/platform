/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { CryptoImpl, Key, MemoryType } from './crypto_impl';
import { PrivateKey, PublicKey, SimpleKeyPair } from './crypto_keys';

class KeyECC extends Key {

    sign(signature_info: string, text: string): u8[] {
        return CryptoImpl.sign(this.name, signature_info, text);
    }

    verify(signature_info: string, data: string, signature: u8[]): boolean {
        return CryptoImpl.verify(this.name, signature_info, data, signature);
    }

    getPublicKey(format: string = 'spki'): PublicKey {
        if (!CryptoECDSA.isValidFormat(format))
            return new PublicKey([]);
        let result = CryptoImpl.getPublicKey(this.name, format);
        return new PublicKey(result);
    }

    getPrivateKey(format: string = 'pkcs8'): PrivateKey {        
        if (!CryptoECDSA.isValidFormat(format))
            return new PrivateKey([]);

        let result = CryptoImpl.exportKey(this.name, format);
        return new PrivateKey(result);
    }
}

export class CryptoECDSA {

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

    static generateKey(keyName: string, algorithm: string = 'secp256r1', algo_metadata: string = '', extractable: boolean = false): KeyECC | null {
        if (!this.isValidAlgorithm(algorithm))
            return null;

        //It will only generate a Private Key that can be derived into a Public Key of the same algorithm
        const key = CryptoImpl.generateKey(MemoryType.Persistent, keyName, algorithm, algo_metadata, extractable, ["sign"]);
        if (!key) {
            return null;
        }

        const kECC = new KeyECC(key.name);
        return kECC;
    }

    static importKey(keyName: string, format: string, keyData: string, algorithm: string = 'secp256r1', algo_metadata: string = '', extractable: boolean = false): KeyECC | null {

        if (keyData.length === 0)
            return null;

        const key = new KeyECC(keyName);

        if (!this.isValidFormat(format))
            return null;

        if (!this.isValidAlgorithm(algorithm))
            return null;
        
        const result = CryptoImpl.importKey(MemoryType.Persistent, key.name, format, keyData, algorithm, algo_metadata, extractable, 
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
        return CryptoImpl.exportKey(key_name, format);
    }
}
