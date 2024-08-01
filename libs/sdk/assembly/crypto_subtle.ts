/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid';
import { CryptoImpl, MemoryType, Key } from './crypto_impl';

class CryptoKey extends Key {
    algorithm: string;
    extractable: boolean;
    usages: string[];

    constructor(name: string, algorithm: string, extractable: boolean, usages: string[]) {
        super(name);
        this.algorithm = algorithm;
        this.extractable = extractable;
        this.usages = usages;
    }
}

export class SubtleCrypto {
    static generateKey(algorithm: string, extractable: boolean, usages: string[]): CryptoKey | null
    {
        let key = CryptoImpl.generateKey(MemoryType.InMemory, "", algorithm, extractable, usages);
        if (!key)
            return null;
        return new CryptoKey(key.name, algorithm, extractable, usages);
    }

    static encrypt(key: CryptoKey, clear_text: string): u8[]
    {
        return CryptoImpl.encrypt(key.name, clear_text);
    }
    
    static decrypt(key: CryptoKey, cipher_text: u8[]): string
    {
        return CryptoImpl.decrypt(key.name, cipher_text);
    }
    
    static sign(key: CryptoKey, text: string): u8[]
    {
        return CryptoImpl.sign(key.name, text);
    }
    
    static verify(key: CryptoKey, text: string, signature: u8[]): boolean
    {
        return CryptoImpl.verify(key.name, text, signature);
    }
    
    static digest(algorithm: string, text: string): u8[]
    {
        return CryptoImpl.digest(algorithm, text);
    }    
    static importKey(format: string, b64Data: string, algorithm: string, extractable: boolean, usages: string[]): CryptoKey | null
    {
        let key = CryptoImpl.importKey(MemoryType.InMemory, "", format, b64Data, algorithm, extractable, usages);
        if (!key)
            return null;
        return new CryptoKey(key.name, algorithm, extractable, usages);
    }

    static exportKey(key: CryptoKey, format: string): u8[]
    {
        return CryptoImpl.exportKey(key.name, format);
    }        

    static getPublicKey(key: CryptoKey, format: string): u8[]
    {
        return CryptoImpl.getPublicKey(key.name, format);
    }        
}
