/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
import { Result } from '../index';
import { CryptoUtil, KeyFormatWrapper } from './crypto_utils';
import { CryptoImpl, Key, VerifySignResult } from './crypto_impl';
import * as idlV1 from "./crypto_subtle_idl_v1"
import { JSON } from '@klave/sdk';

class CryptoKey extends Key {
    algorithm: String;
    extractable: boolean;
    usages: string[];

    constructor(name: string, algorithm: String, extractable: boolean, usages: string[]) {
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

export class NamedAlgorithm
{
    name!: string;
}

export class SubtleCrypto {
    static generateKey<T>(algorithm: T, extractable: boolean, usages: string[]): Result<CryptoKey, Error>
    {
        if(algorithm instanceof RsaHashedKeyGenParams)
        {
            let rsaMetadata = CryptoUtil.getRSAMetadata(algorithm);
            if(rsaMetadata.data)
            {
                let rsaMeta = rsaMetadata.data as idlV1.rsa_metadata;
                let key = CryptoImpl.generateKey(idlV1.key_algorithm.rsa, String.UTF8.encode(JSON.stringify(rsaMeta)), extractable, usages);
                if (key.data)
                {
                    let keyData = key.data as Key;
                    return {data: new CryptoKey(keyData.name, algorithm.name, extractable, usages), err: null};
                }
                else
                    return {data: null, err: new Error("Failed to generate RSA key")};
            }
            else
                return {data: null, err: new Error("Failed to generate RSA metadata")};
        }else if(algorithm instanceof EcKeyGenParams)
        {
            if(algorithm.namedCurve == "P-256" || algorithm.namedCurve == "P-384" || algorithm.namedCurve == "P-521")
            {
                let metadata = CryptoUtil.getSECPR1Metadata(algorithm);
                if(metadata.data)
                {
                    let secpr1Metadata = metadata.data as idlV1.secp_r1_metadata;
                    let key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_r1, String.UTF8.encode(JSON.stringify(secpr1Metadata)), extractable, usages);
                    if (key.data)
                    {
                        let keyData = key.data as Key;
                        return {data: new CryptoKey(keyData.name, algorithm.name, extractable, usages), err: null};
                    }else
                        return {data: null, err: new Error("Failed to generate EC key")};
                }else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }else if(algorithm.namedCurve == "secp256k1" || algorithm.namedCurve == "SECP256K1")
            {
                let metadata = CryptoUtil.getSECPK1Metadata(algorithm);
                if(metadata.data)
                {
                    let secpk1Metadata = metadata.data as idlV1.secp_k1_metadata;
                    let key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(secpk1Metadata)), extractable, usages);
                    if (key.data)
                    {
                        let keyData = key.data as Key;
                        return {data: new CryptoKey(keyData.name, algorithm.name, extractable, usages), err: null};
                    }
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
                let aesMetadata = metadata.data as idlV1.aes_metadata;
                let key = CryptoImpl.generateKey(idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(aesMetadata)), extractable, usages);
                if (key.data)
                {
                    let keyData = key.data as Key;
                    return {data: new CryptoKey(keyData.name, algorithm.name, extractable, usages), err: null};
                }else
                    return {data: null, err: new Error("Failed to generate AES key")};
            }
            else
                return {data: null, err: new Error("Failed to generate AES metadata")};
        }
        return {data: null, err: new Error("Invalid algorithm")};
    }

    static encrypt<T>(algorithm: T, key: CryptoKey | null, clear_text: ArrayBuffer | null): Result<ArrayBuffer, Error>
    {
        if(!key)
            return {data: null, err: new Error("Invalid key")};
        if(!clear_text)
            return {data: null, err: new Error("Invalid clear text: clear text cannot be null")};
        if(algorithm instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(algorithm.label);
            let rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            return CryptoImpl.encrypt(key.name, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams)), clear_text);
        }else if(algorithm instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(algorithm.iv);
            let additionalData = Uint8Array.wrap(algorithm.additionalData);
            let aesGcmParams: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: algorithm.tagLength};
            return CryptoImpl.encrypt(key.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams)), clear_text);
        }else
            return {data: null, err: new Error("Invalid algorithm")};
    }
    
    static decrypt<T>(algorithm: T, key: CryptoKey | null, cipher_text: ArrayBuffer | null): Result<ArrayBuffer, Error>
    {
        if(!cipher_text)
            return {data: null, err: new Error("Invalid cipher text: cipher text cannot be null")};
        if(!key)
            return {data: null, err: new Error("Invalid key")};

        if(algorithm instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(algorithm.label);
            let rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            return CryptoImpl.decrypt(key.name, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams)), cipher_text);
        }else if(algorithm instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(algorithm.iv);
            let additionalData = Uint8Array.wrap(algorithm.additionalData);
            let aesGcmParams: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: algorithm.tagLength};
            return CryptoImpl.decrypt(key.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams)), cipher_text);
        }else
            return {data: null, err: new Error("Invalid algorithm")};
    }
    
    static sign<T>(algorithm: T, key: CryptoKey | null, data: ArrayBuffer | null): Result<ArrayBuffer, Error>
    {
        if(!key)
            return {data: null, err: new Error("Invalid key")};
        if(!data)
            return {data: null, err: new Error("Invalid data: data cannot be null")};
        if(algorithm instanceof EcdsaParams)
        {
            let hash_info = CryptoUtil.getShaMetadata(algorithm.hash);
            if(!hash_info.data)
                return {data: null, err: hash_info.err};

            let hashMetadata = hash_info.data as idlV1.sha_metadata;
            let metadata = {sha_metadata: hashMetadata} as idlV1.ecdsa_signature_metadata;
            return CryptoImpl.sign(key.name, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(metadata)), data);
        }else if(algorithm instanceof RsaPssParams)
        {
            let metadata = {saltLength: algorithm.saltLength} as idlV1.rsa_pss_signature_metadata;
            return CryptoImpl.sign(key.name, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata)), data);
        }

        return {data: null, err: new Error("Invalid algorithm")};
    }
    
    static verify<T>(algorithm: T, key: CryptoKey | null, data: ArrayBuffer | null, signature: ArrayBuffer | null): Result<VerifySignResult, Error>
    {
        if(!key)
            return {data: null, err: new Error("Invalid key")};
        if(!data)
            return {data: null, err: new Error("Invalid data: data cannot be null")};
        if(!signature)
            return {data: null, err: new Error("Invalid signature: signature cannot be null")};
        if(algorithm instanceof EcdsaParams)
        {
            let hash_info = CryptoUtil.getShaMetadata(algorithm.hash);
            if(!hash_info.data)
                return {data: null, err: hash_info.err};

            let hashMetadata = hash_info.data as idlV1.sha_metadata;
            let metadata = {sha_metadata: hashMetadata} as idlV1.ecdsa_signature_metadata;
            return CryptoImpl.verify(key.name, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(metadata)), data, signature);
        }else if(algorithm instanceof RsaPssParams)
        {
            let metadata = {saltLength: algorithm.saltLength} as idlV1.rsa_pss_signature_metadata;
            return CryptoImpl.verify(key.name, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata)), data, signature);
        }

        return {data: null, err: new Error("Invalid algorithm")};
    }
    
    static digest(algorithm: string, data: ArrayBuffer | null): Result<ArrayBuffer, Error>
    {
        if(!data)
            return {data: null, err: new Error("Invalid data: data cannot be null")};
        let hashInfo = CryptoUtil.getShaMetadata(algorithm);
        if(hashInfo.data)
        {
            let hashMetadata = hashInfo.data as idlV1.sha_metadata;
            return CryptoImpl.digest(idlV1.hash_algorithm.sha, String.UTF8.encode(JSON.stringify(hashMetadata)), data);
        }
        else if(hashInfo.err)
            return {data: null, err: hashInfo.err};
        return {data: null, err: new Error("Invalid algorithm")};
    }

    static importKey<T>(format: string, keyData: ArrayBuffer | null, algorithm: T, extractable: boolean, usages: string[]): Result<CryptoKey, Error>
    {
        if(!keyData)
            return {data: null, err: new Error("Invalid key data: key data cannot be null")};

        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        let formatData = keyFormat.data as KeyFormatWrapper;

        var algoMetadata: ArrayBuffer;
        var keyAlgo: idlV1.key_algorithm;
        var keyGenAlgoName: string;
        if(algorithm instanceof EcKeyGenParams)
        {
            if(algorithm.name != "ECDSA" && algorithm.name != "ecdsa")
                return {data: null, err: new Error("Invalid EC algorithm")};

            if(algorithm.namedCurve == "secp256k1" || algorithm.namedCurve == "SECP256K1")
            {
                keyAlgo = idlV1.key_algorithm.secp_k1;
                let algoMetadataResult = CryptoUtil.getSECPK1Metadata(algorithm);
                if(algoMetadataResult.data)
                {
                    let secpk1Metadata = algoMetadataResult.data as idlV1.secp_k1_metadata;
                    algoMetadata = String.UTF8.encode(JSON.stringify(secpk1Metadata));
                }
                else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }
            else if(algorithm.namedCurve == "P-256" || algorithm.namedCurve == "P-384" || algorithm.namedCurve == "P-521")
            {
                keyAlgo = idlV1.key_algorithm.secp_r1;
                let algoMetadataResult = CryptoUtil.getSECPR1Metadata(algorithm);
                if(algoMetadataResult.data)
                {
                    let secpr1Metadata = algoMetadataResult.data as idlV1.secp_r1_metadata;
                    algoMetadata = String.UTF8.encode(JSON.stringify(secpr1Metadata));
                }
                else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }else
                return {data: null, err: new Error("Invalid EC curve")};
            
            keyGenAlgoName = algorithm.name;
        }else if(algorithm instanceof AesKeyGenParams)
        {
            if(algorithm.name != "AES-GCM" && algorithm.name != "aes-gcm" && algorithm.name != "AES-KW" && algorithm.name != "aes-kw")
                return {data: null, err: new Error("Invalid algorithm name")};

            keyAlgo = idlV1.key_algorithm.aes;
            keyGenAlgoName = algorithm.name;
            let algoMetadataResult = CryptoUtil.getAESMetadata(algorithm);
            if(algoMetadataResult.data)
            {
                let aesMetadata = algoMetadataResult.data as idlV1.aes_metadata;
                algoMetadata = String.UTF8.encode(JSON.stringify(aesMetadata));
            }
            else
                return {data: null, err: new Error("Failed to generate AES metadata")};
        }else if(algorithm instanceof RsaHashedKeyGenParams)
        {
            if(algorithm.name != "RSA-OAEP" && algorithm.name != "RSA-PSS")
                return {data: null, err: new Error("Invalid RSA algorithm")};

            keyAlgo = idlV1.key_algorithm.rsa;
            keyGenAlgoName = algorithm.name;
            let rsaMetadata = CryptoUtil.getRSAMetadata(algorithm);
            if(rsaMetadata.data)
            {
                let metadata = rsaMetadata.data as idlV1.rsa_metadata;
                algoMetadata = String.UTF8.encode(JSON.stringify(metadata));
            }
            else
                return {data: null, err: new Error("Failed to generate RSA metadata")};
        }else
            return {data: null, err: new Error("Invalid algorithm")};

        let key = CryptoImpl.importKey(formatData.format, keyData, keyAlgo, algoMetadata, extractable, usages);
        if (!key.data)
            return {data: null, err: new Error("Failed to import key")};

        let keyDataImported = key.data as Key;
        return {data: new CryptoKey(keyDataImported.name, keyGenAlgoName, extractable, usages), err: null};
    }

    static wrapKey<T>(format: string, key: CryptoKey | null, wrappingKey: CryptoKey | null, wrapAlgo: T): Result<ArrayBuffer, Error>
    {
        if(!key)
            return {data: null, err: new Error("Invalid key")};

        if(!wrappingKey)
            return {data: null, err: new Error("Invalid wrapping key")};

        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        let formatData = keyFormat.data as KeyFormatWrapper;

        if(wrapAlgo instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(wrapAlgo.label);
            let wrappingInfo: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            return CryptoImpl.wrapKey(wrappingKey.name, idlV1.wrapping_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(wrappingInfo)), key.name, formatData.format);
        }else if(wrapAlgo instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(wrapAlgo.iv);
            let additionalData = Uint8Array.wrap(wrapAlgo.additionalData);
            let wrappingInfo: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: wrapAlgo.tagLength};
            return CryptoImpl.wrapKey(wrappingKey.name, idlV1.wrapping_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(wrappingInfo)), key.name, formatData.format);
        }else if(wrapAlgo instanceof NamedAlgorithm)
        {
            if(wrapAlgo.name == "AES-KW" || wrapAlgo.name == "aes-kw")
            {
                let wrappingInfo: idlV1.aes_kw_wrapping_metadata = {with_padding: true};
                return CryptoImpl.wrapKey(wrappingKey.name, idlV1.wrapping_algorithm.aes_kw, String.UTF8.encode(JSON.stringify(wrappingInfo)), key.name, formatData.format);
            }else
                return {data: null, err: new Error("Invalid wrapping algorithm")};
        }
        return {data: null, err: new Error("Invalid algorithm")};
    }

    static unwrapKey<T, E>(format: string, wrappedKey: ArrayBuffer | null, unwrappingKey: CryptoKey | null, unwrapAlgo: T,  unwrappedKeyAlgo: E, extractable: boolean, usages: string[]): Result<CryptoKey, Error>
    {
        if(!wrappedKey)
            return {data: null, err: new Error("Invalid wrapped key: wrapped key cannot be null")};

        if(!unwrappingKey)
            return {data: null, err: new Error("Invalid unwrapping key")};

        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        let formatData = keyFormat.data as KeyFormatWrapper;

        var wrappingAlgo: idlV1.wrapping_algorithm;
        var wrappingInfo: ArrayBuffer;
        if(unwrapAlgo instanceof RsaOaepParams)
        {
            let labelUintArray = Uint8Array.wrap(unwrapAlgo.label);
            let wrappingInfoRsaOaep: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
            wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoRsaOaep));
            wrappingAlgo = idlV1.wrapping_algorithm.rsa_oaep;
        }else if(unwrapAlgo instanceof AesGcmParams)
        {
            let iv = Uint8Array.wrap(unwrapAlgo.iv);
            let additionalData = Uint8Array.wrap(unwrapAlgo.additionalData);
            let wrappingInfoAesGcm: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: unwrapAlgo.tagLength};
            wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoAesGcm));
            wrappingAlgo = idlV1.wrapping_algorithm.aes_gcm;
        }else if(unwrapAlgo instanceof NamedAlgorithm)
        {
            if(unwrapAlgo.name == "AES-KW" || unwrapAlgo.name == "aes-kw")
            {
                let wrappingInfoAesKw: idlV1.aes_kw_wrapping_metadata = {with_padding: true};
                wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoAesKw));
                wrappingAlgo = idlV1.wrapping_algorithm.aes_kw;
            }else
                return {data: null, err: new Error("Invalid wrapping algorithm")};
        }else
            return {data: null, err: new Error("Invalid wrapping algorithm")};

        var keyGenAlgo: idlV1.key_algorithm;
        var keyGenInfo: ArrayBuffer;
        var keyGenAlgoName: string;
        if(unwrappedKeyAlgo instanceof AesKeyGenParams)
        {
            let aesMetadata = CryptoUtil.getAESMetadata(unwrappedKeyAlgo);
            if(aesMetadata.data)
            {
                let keyGenMetadataAes = aesMetadata.data as idlV1.aes_metadata;
                keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataAes));
                keyGenAlgo = idlV1.key_algorithm.aes;
                keyGenAlgoName = unwrappedKeyAlgo.name;
            }else    
                return {data: null, err: new Error("Failed to generate AES metadata")};
        }else if(unwrappedKeyAlgo instanceof RsaHashedKeyGenParams)
        {
            let rsaMetadata = CryptoUtil.getRSAMetadata(unwrappedKeyAlgo);
            if(rsaMetadata.data)
            {
                let keyGenMetadataRsa = rsaMetadata.data as idlV1.rsa_metadata;
                keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataRsa));
                keyGenAlgo = idlV1.key_algorithm.rsa;
                keyGenAlgoName = unwrappedKeyAlgo.name;
            }
            else
                return {data: null, err: new Error("Failed to generate RSA metadata")};
        }else if(unwrappedKeyAlgo instanceof EcKeyGenParams)
        {
            if(unwrappedKeyAlgo.namedCurve == "P-256" || unwrappedKeyAlgo.namedCurve == "P-384" || unwrappedKeyAlgo.namedCurve == "P-521")
            {
                let metadata = CryptoUtil.getSECPR1Metadata(unwrappedKeyAlgo);
                if(metadata.data)
                {
                    let keyGenMetadataR1 = metadata.data as idlV1.secp_r1_metadata;
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
                    let keyGenMetadataK1 = metadata.data as idlV1.secp_k1_metadata;
                    keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataK1));
                    keyGenAlgo = idlV1.key_algorithm.secp_k1;
                    keyGenAlgoName = unwrappedKeyAlgo.name;
                }else
                    return {data: null, err: new Error("Failed to generate EC metadata")};
            }
            else
                return {data: null, err: new Error("Failed to generate EC metadata: Invalid curve")};
        }else
            return {data: null, err: new Error("Invalid Key Gen algorithm")};

        let key = CryptoImpl.unwrapKey(unwrappingKey.name, wrappingAlgo, wrappingInfo, formatData.format, wrappedKey, keyGenAlgo, keyGenInfo, extractable, usages);
        if(key.data)
        {
            let keyData = key.data as Key;
            return {data: new CryptoKey(keyData.name, keyGenAlgoName, extractable, usages), err: null};
        }
        else
            return {data: null, err: new Error("Failed to unwrap key")};
    }

    static exportKey(format: string, key: CryptoKey | null): Result<ArrayBuffer, Error>
    {
        if(!key)
            return {data: null, err: new Error("Invalid key")};

        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        let formatData = keyFormat.data as KeyFormatWrapper;

        let result = CryptoImpl.exportKey(key.name, formatData.format);
        if(result.data)
        {
            let keyData = result.data as ArrayBuffer;
            return {data: keyData, err: null};
        }
        else
            return {data: null, err: new Error("Failed to export key")};
    }

    static getPublicKey(format: string, key: CryptoKey | null): Result<ArrayBuffer, Error>
    {
        if(!key)
            return {data: null, err: new Error("Invalid key")};

        let keyFormat = CryptoUtil.getKeyFormat(format);
        if(!keyFormat.data)
            return {data: null, err: keyFormat.err};

        let formatData = keyFormat.data as KeyFormatWrapper;

        if(formatData.format != idlV1.key_format.spki)
            return {data: null, err: new Error("Invalid public key format")};

        return CryptoImpl.getPublicKey(key.name, formatData.format);
    }
}