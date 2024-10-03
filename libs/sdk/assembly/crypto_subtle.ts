/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid';
import { CryptoImpl, MemoryType, Key } from './crypto_impl';
import { JSON, Notifier } from '@klave/sdk';

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

export enum EncryptionAlgo
{
    aes128gcm = 0,
    aes192gcm = 1,
    aes256gcm = 2,
    rsa2048oaep = 3,
    rsa3072oaep = 4,
    rsa4096oaep = 5,
    rsa2048pkcs1_v1_5 = 6,
    rsa3072pkcs1_v1_5 = 7,
    rsa4096pkcs1_v1_5 = 8,
}

export enum aes_tag_length
{
    TAG_96 = 12,
    TAG_104 = 13,
    TAG_112 = 14,
    TAG_120 = 15,
    TAG_128 = 16,
};

export enum hashingAlgo
{
    none = 0,
    sha2_256 = 1,
    sha2_384 = 2,
    sha2_512 = 3,
    sha3_256 = 4,
    sha3_384 = 5,
    sha3_512 = 6,
};

@JSON
export class HashInfo 
{
    algo_id!: hashingAlgo;
    tag: string = "";
}

@JSON
export class WrappingInfo
{
    algo_id!: i32;
    with_padding!: bool;
}

@JSON
export class EncryptionInfo
{
    algo_id!: EncryptionAlgo;
    iv: u8[] = [];
    additional_data: u8[] = [];
    hash_info: HashInfo = {algo_id: hashingAlgo.none, tag: ""};
    tag_length: aes_tag_length = aes_tag_length.TAG_96;
    label: u8[] = [];
}

export const RSA_2048_OAEP_SHA256 : EncryptionInfo = { algo_id: EncryptionAlgo.rsa2048oaep, iv:[], additional_data:[], hash_info: {algo_id: hashingAlgo.sha2_256, tag: ""}, tag_length: aes_tag_length.TAG_128, label: []};

export class SubtleCrypto {
    static generateKey(algorithm: string, algo_metadata: string, extractable: boolean, usages: string[]): CryptoKey | null
    {
        let key = CryptoImpl.generateKey(MemoryType.InMemory, "", algorithm, algo_metadata, extractable, usages);
        if (!key)
            return null;
        return new CryptoKey(key.name, algorithm, extractable, usages);
    }

    static encrypt(key: CryptoKey, encryption_info: string, clear_text: string): u8[]
    {
        return CryptoImpl.encrypt(key.name, encryption_info, clear_text);
    }
    
    static decrypt<T>(key: CryptoKey, decryption_info: T, cipher_text: u8[]): u8[]
    {
        if(decryption_info instanceof EncryptionInfo)
        {
            let encryptionInfo = JSON.stringify(decryption_info);
            return CryptoImpl.decrypt(key.name, encryptionInfo, cipher_text);
        }
        return [];
    }
    
    static sign(key: CryptoKey, signature_info: string, text: string): u8[]
    {
        return CryptoImpl.sign(key.name, signature_info, text);
    }
    
    static verify(key: CryptoKey, signature_info: string, text: string, signature: u8[]): boolean
    {
        return CryptoImpl.verify(key.name, signature_info, text, signature);
    }
    
    static digest(algorithm: string, hash_info: string, text: string): u8[]
    {
        return CryptoImpl.digest(algorithm, hash_info, text);
    }    
    static importKey(format: string, b64Data: string, algorithm: string, algo_metadata: string, extractable: boolean, usages: string[]): CryptoKey | null
    {
        let key = CryptoImpl.importKey(MemoryType.InMemory, "", format, b64Data, algorithm, algo_metadata, extractable, usages);
        if (!key)
            return null;
        return new CryptoKey(key.name, algorithm, extractable, usages);
    }

    static wrapKey(encryptionKey: CryptoKey, wrappingInfo: WrappingInfo, format: string, key: CryptoKey): u8[]
    {
        let wrappingInfoJson = JSON.stringify(wrappingInfo);
        return CryptoImpl.wrapKey(encryptionKey.name, wrappingInfoJson, key.name, format);
    }

    static unwrapKey(decryptionKey: CryptoKey, wrappingInfo: WrappingInfo, format: string, b64Data: string, algorithm: string, algo_metadata: string, extractable: boolean, usages: string[]): CryptoKey | null
    {
        let wrappingInfoJson = JSON.stringify(wrappingInfo);
        let key = CryptoImpl.unwrapKey(MemoryType.InMemory, decryptionKey.name, wrappingInfoJson, "", format, b64Data, algorithm, algo_metadata, extractable, usages);
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
