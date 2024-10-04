/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from './uuid';
import { Result } from './index';
import { CryptoUtil } from './crypto_utils';
import { CryptoImpl, MemoryType, Key } from './crypto_impl';
import * as idlV1 from "./crypto_subtle_idl_v1"
import { JSON } from '@klave/sdk';

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

export class RsaHashedKeyGenParams
{
    name: string = "RSA-OAEP"; // "RSA-OAEP", "RSA-PSS", "RSA-PKCS1-v1_5"
    modulusLength: u32 = 2048;
    publicExponent: u32 = 65537;
    hash: string = "SHA2-256"; // "SHA2-256", "SHA2-384", "SHA2-512"
}

export class EcKeyGenParams
{
    name: string = "ECDSA"; // "ECDSA"
    namedCurve: string = "P-256"; // "P-256", "P-384", "P-521"
}

export class AesKeyGenParams
{
    name: string = "AES-GCM"; // "AES-GCM", "AES-KW"
    length: u32 = 256;
}

export class RsaOaepParams
{
    name: string = "RSA-OAEP";
    label: ArrayBuffer = new ArrayBuffer(0);
}

export class AesGcmParams
{
    name: string = "AES-GCM";
    iv!: ArrayBuffer;
    additionalData: ArrayBuffer = new ArrayBuffer(0);
    tagLength: u32 = 128;
}

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
    static generateKey<T>(algorithm: T, extractable: boolean, usages: string[]): Result<CryptoKey, Error>
    {
        if(!(algorithm instanceof RsaHashedKeyGenParams || algorithm instanceof EcKeyGenParams || algorithm instanceof AesKeyGenParams))
            return {data: null, err: new Error("Invalid Key algorithm")};

        if(algorithm instanceof RsaHashedKeyGenParams)
        {
            let rsaMetadata = CryptoUtil.getRSAMetadata(algorithm);
            if(rsaMetadata.data)
            {
                let key = CryptoImpl.generateKey(idlV1.key_algorithm.rsa, rsaMetadata.data, extractable, usages);
                if (key.data)
                    return {data: new CryptoKey(key.data.name, algorithm.name, extractable, usages), err: null};
                else
                    return {data: null, err: new Error("Failed to generate RSA key")};
            }
            else
                return {data: null, err: new Error("Failed to generate RSA metadata")};
        }else if(algorithm instanceof EcKeyGenParams)
        {
            if(algorithm.namedCurve != "P-256" && algorithm.namedCurve != "P-384" && algorithm.namedCurve != "P-521")
                return {data: null, err: new Error("Invalid curve")};

            let metadata = CryptoUtil.getSECPR1Metadata(algorithm);
            if(metadata.data)
            {
                let key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_r1, metadata.data, extractable, usages);
                if (key.data)
                    return {data: new CryptoKey(key.data.name, algorithm.name, extractable, usages), err: null};
                else
                    return {data: null, err: new Error("Failed to generate EC key")};
            }
            else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else if(algorithm instanceof AesKeyGenParams)
        {
            let metadata = CryptoUtil.getAESMetadata(algorithm);
            if(metadata.data)
            {
                let key = CryptoImpl.generateKey(idlV1.key_algorithm.aes, {length: algorithm.length}, extractable, usages);
                if (key.data)
                    return {data: new CryptoKey(key.data.name, algorithm.name, extractable, usages), err: null};
                else
                    return {data: null, err: new Error("Failed to generate AES key")};
            }
            else
                return {data: null, err: new Error("Failed to generate AES metadata")};
        }
        return {data: null, err: new Error("Invalid algorithm")};
    }

    static encrypt<T>(algorithm: T, key: CryptoKey, clear_text: ArrayBuffer): Result<ArrayBuffer, Error>
    {
        if(algorithm instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(algorithm.label);
            let rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            return CryptoImpl.encrypt(key.name, idlV1.encryption_algorithm.rsa_oaep, rsaOaepParams, clear_text);
        }else if(algorithm instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(algorithm.iv);
            let additionalData = Uint8Array.wrap(algorithm.additionalData);
            let aesGcmParams: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: algorithm.tagLength};
            return CryptoImpl.encrypt(key.name, idlV1.encryption_algorithm.aes_gcm, aesGcmParams, clear_text);

        }else
            return {data: null, err: new Error("Invalid algorithm")};
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
    
    static digest(algorithm: string, data: ArrayBuffer): Result<ArrayBuffer, Error>
    {
        let hash_info = CryptoUtil.getShaMetadata(algorithm);
        if(hash_info.data)
            return CryptoImpl.digest(idlV1.hash_algorithm.sha, hash_info, data);
        else if(hash_info.err)
            return {data: null, err: hash_info.err};
        return {data: null, err: new Error("Invalid algorithm")};
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
