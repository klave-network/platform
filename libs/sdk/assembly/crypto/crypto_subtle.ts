/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { decode, encode as b64encode } from 'as-base64/assembly';
import uuid from '../uuid';
import { Result } from '../index';
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

export class RsaPssParams
{
    name: string = "RSA-PSS";
    saltLength: u32 = 0;
}

export class EcdsaParams
{
    name: string = "ECDSA";
    hash: string = "SHA-256";
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
            if(algorithm.namedCurve != "P-256" && algorithm.namedCurve != "P-384" && algorithm.namedCurve != "P-521" && algorithm.namedCurve != "secp256k1" && algorithm.namedCurve != "SECP256K1")
                return {data: null, err: new Error("Invalid curve")};

            if(algorithm.namedCurve != "secp256k1" && algorithm.namedCurve != "SECP256K1")
            {
                let metadata = CryptoUtil.getSECPR1Metadata(algorithm);
                if(metadata.data)
                {
                    let key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_r1, metadata.data, extractable, usages);
                    if (key.data)
                        return {data: new CryptoKey(key.data.name, algorithm.name, extractable, usages), err: null};
                    else
                        return {data: null, err: new Error("Failed to generate EC key")};
                }else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }else if(algorithm.namedCurve == "secp256k1" || algorithm.namedCurve == "SECP256K1")
            {
                let metadata = CryptoUtil.getSECPK1Metadata(algorithm);
                if(metadata.data)
                {
                    let key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_k1, metadata.data, extractable, usages);
                    if (key.data)
                        return {data: new CryptoKey(key.data.name, algorithm.name, extractable, usages), err: null};
                    else
                        return {data: null, err: new Error("Failed to generate EC key")};
                }else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
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
    
    static decrypt<T>(algorithm: T, key: CryptoKey, cipher_text: ArrayBuffer): Result<ArrayBuffer, Error>
    {
        if(algorithm instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(algorithm.label);
            let rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            return CryptoImpl.decrypt(key.name, idlV1.encryption_algorithm.rsa_oaep, rsaOaepParams, cipher_text);
        }else if(algorithm instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(algorithm.iv);
            let additionalData = Uint8Array.wrap(algorithm.additionalData);
            let aesGcmParams: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: algorithm.tagLength};
            return CryptoImpl.decrypt(key.name, idlV1.encryption_algorithm.aes_gcm, aesGcmParams, cipher_text);
        }else
            return {data: null, err: new Error("Invalid algorithm")};
    }
    
    static sign<T>(algorithm: T, key: CryptoKey, data: ArrayBuffer): Result<ArrayBuffer, Error>
    {
        if(algorithm instanceof EcdsaParams)
        {
            let hash_info = CryptoUtil.getShaMetadata(algorithm.hash);
            if(!hash_info.data)
                return {data: null, err: hash_info.err};

            let metadata: idlV1.ecdsa_signature_metadata = {sha_metadata: hash_info.data};
            return CryptoImpl.sign(key.name, idlV1.signing_algorithm.ecdsa, metadata, data);
        }else if(algorithm instanceof RsaPssParams)
        {
            let metadata: idlV1.rsa_pss_signature_metadata = {saltLength: algorithm.saltLength};
            return CryptoImpl.sign(key.name, idlV1.signing_algorithm.rsa_pss, metadata, data);
        }

        return {data: null, err: new Error("Invalid algorithm")};
    }
    
    static verify<T>(algorithm: T, key: CryptoKey, data: ArrayBuffer, signature: ArrayBuffer): Result<boolean, Error>
    {
        if(algorithm instanceof EcdsaParams)
        {
            let hash_info = CryptoUtil.getShaMetadata(algorithm.hash);
            if(!hash_info.data)
                return {data: false, err: hash_info.err};

            let metadata: idlV1.ecdsa_signature_metadata = {sha_metadata: hash_info.data};
            return CryptoImpl.verify(key.name, idlV1.signing_algorithm.ecdsa, metadata, data, signature);
        }else if(algorithm instanceof RsaPssParams)
        {
            let metadata: idlV1.rsa_pss_signature_metadata = {saltLength: algorithm.saltLength};
            return CryptoImpl.verify(key.name, idlV1.signing_algorithm.rsa_pss, metadata, data, signature);
        }

        return {data: false, err: new Error("Invalid algorithm")};
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

    static wrapKey<T>(format: string, key: CryptoKey, wrappingKey: CryptoKey, wrapAlgo: T): Result<ArrayBuffer, Error>
    {
        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        if(wrapAlgo instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(wrapAlgo.label);
            let wrappingInfo: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            return CryptoImpl.wrapKey(wrappingKey.name, idlV1.wrapping_algorithm.rsa_oaep, wrappingInfo, key.name, keyFormat.data);
        }else if(wrapAlgo instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(wrapAlgo.iv);
            let additionalData = Uint8Array.wrap(wrapAlgo.additionalData);
            let wrappingInfo: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: wrapAlgo.tagLength};
            return CryptoImpl.wrapKey(wrappingKey.name, idlV1.wrapping_algorithm.aes_gcm, wrappingInfo, key.name, keyFormat.data);
        }else if(wrapAlgo instanceof String)
        { 
            if(wrapAlgo == "AES-KW" || wrapAlgo == "aes-kw")
            {
                let wrappingInfo: idlV1.aes_kw_wrapping_metadata = {with_padding: true};
                return CryptoImpl.wrapKey(wrappingKey.name, idlV1.wrapping_algorithm.aes_kw, wrappingInfo, key.name, keyFormat.data);
            }else
                return {data: null, err: new Error("Invalid wrapping algorithm")};
        }
        return {data: null, err: new Error("Invalid algorithm")};
    }

    //unwrapKey(format, wrappedKey, unwrappingKey, unwrapAlgo, unwrappedKeyAlgo, extractable, keyUsages)
    static unwrapKey<T, E>(format: string, wrappedKey: ArrayBuffer, unwrappingKey: CryptoKey, unwrapAlgo: T,  unwrappedKeyAlgo: E, extractable: boolean, usages: string[]): Result<CryptoKey, Error>
    {
        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        var wrappingAlgo: idlV1.wrapping_algorithm;
        var wrappingInfo: ArrayBuffer = new ArrayBuffer(0);
        if(unwrapAlgo instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(unwrapAlgo.label);
            let wrappingInfoRsaOaep = {label: labelUintArray};
            wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoRsaOaep));
            wrappingAlgo = idlV1.wrapping_algorithm.rsa_oaep;
        }else if(unwrapAlgo instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(unwrapAlgo.iv);
            let additionalData = Uint8Array.wrap(unwrapAlgo.additionalData);
            let wrappingInfoAesGcm = {iv: iv, additionalData: additionalData, tagLength: unwrapAlgo.tagLength};
            wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoAesGcm));
            wrappingAlgo = idlV1.wrapping_algorithm.aes_gcm;
        }else if(unwrapAlgo instanceof String)
        {
            if(unwrapAlgo == "AES-KW" || unwrapAlgo == "aes-kw")
            {
                let wrappingInfoAesKw = {with_padding: true};
                wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoAesKw));
                wrappingAlgo = idlV1.wrapping_algorithm.aes_kw;
            }else
                return {data: null, err: new Error("Invalid wrapping algorithm")};
        }else
            return {data: null, err: new Error("Invalid wrapping algorithm")};

        var keyGenAlgo: idlV1.key_algorithm = idlV1.key_algorithm.aes;
        var keyGenInfo: ArrayBuffer = new ArrayBuffer(0);
        var keyGenAlgoName: string = "";
        if(unwrappedKeyAlgo instanceof AesKeyGenParams)
        {
            let keyGenMetadataAes = {length: unwrappedKeyAlgo.length};
            keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataAes));
            keyGenAlgo = idlV1.key_algorithm.aes;
            keyGenAlgoName = unwrappedKeyAlgo.name;
        }else if(unwrappedKeyAlgo instanceof RsaHashedKeyGenParams)
        {
            let rsaMetadata = CryptoUtil.getRSAMetadata(unwrappedKeyAlgo);
            if(rsaMetadata.data)
            {
                let keyGenMetadataRsa = rsaMetadata.data;
                keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataRsa));
                keyGenAlgo = idlV1.key_algorithm.rsa;
                keyGenAlgoName = unwrappedKeyAlgo.name;
            }
            else
                return {data: null, err: new Error("Failed to generate RSA metadata")};
        }else if(unwrappedKeyAlgo instanceof EcKeyGenParams)
        {
            if(unwrappedKeyAlgo.namedCurve != "P-256" && unwrappedKeyAlgo.namedCurve != "P-384" && unwrappedKeyAlgo.namedCurve != "P-521" && unwrappedKeyAlgo.namedCurve != "secp256k1" && unwrappedKeyAlgo.namedCurve != "SECP256K1")
                return {data: null, err: new Error("Invalid curve")};

            if(unwrappedKeyAlgo.namedCurve != "secp256k1" && unwrappedKeyAlgo.namedCurve != "SECP256K1")
            {
                let metadata = CryptoUtil.getSECPR1Metadata(unwrappedKeyAlgo);
                if(metadata.data)
                {
                    let keyGenMetadataR1 = metadata.data;
                    keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataR1));
                    keyGenAlgo = idlV1.key_algorithm.secp_r1;
                    keyGenAlgoName = unwrappedKeyAlgo.name;
                }else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }else if(unwrappedKeyAlgo.namedCurve == "secp256k1" || unwrappedKeyAlgo.namedCurve == "SECP256K1")
            {
                let metadata = CryptoUtil.getSECPK1Metadata(unwrappedKeyAlgo);
                if(metadata.data)
                {
                    let keyGenMetadataK1 = metadata.data;
                    keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataK1));
                    keyGenAlgo = idlV1.key_algorithm.secp_k1;
                    keyGenAlgoName = unwrappedKeyAlgo.name;
                }else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }
            else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }

        let key = CryptoImpl.unwrapKey(unwrappingKey.name, wrappingAlgo, wrappingInfo, keyFormat.data, wrappedKey, keyGenAlgo, keyGenInfo, extractable, usages);
        if(key.data)
            return {data: new CryptoKey(key.data.name, keyGenAlgoName, extractable, usages), err: null};
        else
            return {data: null, err: new Error("Failed to unwrap key")};
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
