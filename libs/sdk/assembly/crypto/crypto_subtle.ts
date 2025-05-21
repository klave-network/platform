/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
import { Result } from '../index';
import { Utils } from './index';
import { CryptoUtil, KeyFormatWrapper } from './crypto_utils';
import { CryptoImpl, Key, UnitType, VerifySignResult } from './crypto_impl';
import * as idlV1 from './crypto_subtle_idl_v1';
import { JSON } from '@klave/as-json/assembly';

@json
export class CryptoKey {
    id!: string;
    @omitnull()
    alias!: string | null;
    type!: string;
    extractable!: boolean;
    family!: string;
    usages!: string[];
    algorithm!: string;
}

@json
class keyPersistParams
{
    @alias("key_id")
    keyId!: string;
    @alias("key_name")
    keyName!: string;
    @alias("key_type")
    keyType!: string;
}

@json
export class RsaHashedKeyGenParams {
    @alias("modulus_length")
    modulusLength: u32 = 2048;
    @alias("public_exponent")
    publicExponent: u32 = 65537;
    hash: string = 'SHA2-256'; // "SHA2-256", "SHA2-384", "SHA2-512"
}

@json
export class EcKeyGenParams {
    @alias("named_curve")
    namedCurve: string = 'P-256'; // "P-256", "P-384", "P-521"
}

@json
export class AesKeyGenParams {
    length: u32 = 256;
}

@json
export class HmacKeyGenParams {
    hash: string = 'SHA2-256';
}

export class RsaOaepParams {
    label: ArrayBuffer = new ArrayBuffer(0);
}

export class AesGcmParams {
    iv!: ArrayBuffer;
    additionalData: ArrayBuffer = new ArrayBuffer(0);
    tagLength: u32 = 128;
}

export class RsaPssParams {
    saltLength: u32 = 0;
}

export class EcdsaParams {
    hash: string = 'SHA2-256';
}

export class NamedAlgorithm {
    name!: string;
}

export class SubtleCrypto {
    static generateKey<T>(algorithm: T, extractable: boolean, usages: string[]): Result<CryptoKey, Error> {
        if (algorithm instanceof RsaHashedKeyGenParams) {
            const rsaMetadata = CryptoUtil.getRSAMetadata(algorithm);
            if (rsaMetadata.data) {
                const rsaMeta = rsaMetadata.data as idlV1.rsa_metadata;
                const key = CryptoImpl.generateKey(idlV1.key_algorithm.rsa, String.UTF8.encode(JSON.stringify(rsaMeta), true), extractable, usages, "");
                if (key.data) {
                    const cryptoKeyJson = String.UTF8.decode(key.data!, true);
                    let cryptoKey = JSON.parse<CryptoKey>(cryptoKeyJson);
                    return { data: cryptoKey, err: null };
                }
                else if (key.err) {
                    const error = key.err as Error;
                    return { data: null, err: new Error(error.message) };
                }
                else
                    return { data: null, err: new Error('Failed to generate RSA key') };
            }
            else if (rsaMetadata.err) {
                const error = rsaMetadata.err as Error;
                return { data: null, err: new Error(error.message) };
            }
            else
                return { data: null, err: new Error('Failed to generate RSA metadata') };
        } else if (algorithm instanceof EcKeyGenParams) {
            if (algorithm.namedCurve == 'P-256' || algorithm.namedCurve == 'P-384' || algorithm.namedCurve == 'P-521') {
                const metadata = CryptoUtil.getSECPR1Metadata(algorithm);
                if (metadata.data) {
                    const secpr1Metadata = metadata.data as idlV1.secp_r1_metadata;
                    const key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_r1, String.UTF8.encode(JSON.stringify(secpr1Metadata), true), extractable, usages, "");
                    if (key.data) {
                        const cryptoKeyJson = String.UTF8.decode(key.data!, true);
                        let cryptoKey = JSON.parse<CryptoKey>(cryptoKeyJson);
                        return { data: cryptoKey, err: null };
                    } else
                        return { data: null, err: new Error('Failed to generate EC key') };
                } else
                    return { data: null, err: new Error('Failed to generate EC metadata') };
            } else if (algorithm.namedCurve == 'secp256k1' || algorithm.namedCurve == 'SECP256K1') {
                const metadata = CryptoUtil.getSECPK1Metadata(algorithm);
                if (metadata.data) {
                    const secpk1Metadata = metadata.data as idlV1.secp_k1_metadata;
                    const key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(secpk1Metadata), true), extractable, usages, "");
                    if (key.data) {
                        const cryptoKeyJson = String.UTF8.decode(key.data!, true);
                        let cryptoKey = JSON.parse<CryptoKey>(cryptoKeyJson);
                        return { data: cryptoKey, err: null };
                    }
                    else
                        return { data: null, err: new Error('Failed to generate EC key') };
                } else
                    return { data: null, err: new Error('Failed to generate EC metadata') };
            }
            else
                return { data: null, err: new Error('Failed to generate EC metadata') };

        } else if (algorithm instanceof AesKeyGenParams) {
            const metadata = CryptoUtil.getAESMetadata(algorithm);
            if (metadata.data) {
                const aesMetadata = metadata.data as idlV1.aes_metadata;
                const key = CryptoImpl.generateKey(idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(aesMetadata), true), extractable, usages, "");
                if (key.data) {
                    const cryptoKeyJson = String.UTF8.decode(key.data!, true);
                    let cryptoKey = JSON.parse<CryptoKey>(cryptoKeyJson);
                    return { data: cryptoKey, err: null };
                } else
                    return { data: null, err: new Error('Failed to generate AES key') };
            }
            else
                return { data: null, err: new Error('Failed to generate AES metadata') };
        } else if (algorithm instanceof HmacKeyGenParams) {
            const metadata = CryptoUtil.getHMACMetadata(algorithm);
            if (metadata.data) {
                const hmacMetadata = metadata.data as idlV1.hmac_metadata;
                const key = CryptoImpl.generateKey(idlV1.key_algorithm.hmac, String.UTF8.encode(JSON.stringify(hmacMetadata), true), extractable, usages, "");
                if (key.data) {
                    const cryptoKeyJson = String.UTF8.decode(key.data!, true);
                    let cryptoKey = JSON.parse<CryptoKey>(cryptoKeyJson);
                    return { data: cryptoKey, err: null };
                } else
                    return { data: null, err: new Error('Failed to generate HMAC key') };
            }
            else
                return { data: null, err: new Error('Failed to generate HMAC metadata') };
        }

        return { data: null, err: new Error('Invalid algorithm') };
    }

    static encrypt<T>(algorithm: T, key: CryptoKey | null, clear_text: ArrayBuffer | null): Result<ArrayBuffer, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };
        if (!clear_text)
            return { data: null, err: new Error('Invalid clear text: clear text cannot be null') };
        if (algorithm instanceof RsaOaepParams) {
            const labelUintArray = Utils.convertToU8Array(Uint8Array.wrap(algorithm.label));
            const rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = { label: labelUintArray };
            return CryptoImpl.encrypt(key.id, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams), true), clear_text);
        } else if (algorithm instanceof AesGcmParams) {
            const iv = Utils.convertToU8Array(Uint8Array.wrap(algorithm.iv));
            const additionalData = Utils.convertToU8Array(Uint8Array.wrap(algorithm.additionalData));
            const aesGcmParams: idlV1.aes_gcm_encryption_metadata = { iv: iv, additionalData: additionalData, tagLength: algorithm.tagLength };
            return CryptoImpl.encrypt(key.id, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams), true), clear_text);

        } else
            return { data: null, err: new Error('Invalid algorithm') };
    }

    static decrypt<T>(algorithm: T, key: CryptoKey | null, cipher_text: ArrayBuffer | null): Result<ArrayBuffer, Error> {
        if (!cipher_text)
            return { data: null, err: new Error('Invalid cipher text: cipher text cannot be null') };
        if (!key)
            return { data: null, err: new Error('Invalid key') };

        if (algorithm instanceof RsaOaepParams) {
            const labelUintArray = Utils.convertToU8Array(Uint8Array.wrap(algorithm.label));
            const rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = { label: labelUintArray };
            return CryptoImpl.decrypt(key.id, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams), true), cipher_text);
        } else if (algorithm instanceof AesGcmParams) {
            const iv = Utils.convertToU8Array(Uint8Array.wrap(algorithm.iv));
            const additionalData = Utils.convertToU8Array(Uint8Array.wrap(algorithm.additionalData));
            const aesGcmParams: idlV1.aes_gcm_encryption_metadata = { iv: iv, additionalData: additionalData, tagLength: algorithm.tagLength };
            return CryptoImpl.decrypt(key.id, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams), true), cipher_text);
        } else
            return { data: null, err: new Error('Invalid algorithm') };
    }

    static sign<T>(algorithm: T, key: CryptoKey | null, data: ArrayBuffer | null): Result<ArrayBuffer, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };
        if (!data)
            return { data: null, err: new Error('Invalid data: data cannot be null') };
        if (algorithm instanceof EcdsaParams) {
            const hash_info = CryptoUtil.getShaMetadata(algorithm.hash);
            if (!hash_info.data)
                return { data: null, err: hash_info.err };

            const hashMetadata = hash_info.data as idlV1.sha_metadata;
            const metadata: idlV1.ecdsa_signature_metadata = { sha_metadata: hashMetadata };
            return CryptoImpl.sign(key.id, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(metadata), true), data);
        } else if (algorithm instanceof RsaPssParams) {
            const metadata: idlV1.rsa_pss_signature_metadata = { saltLength: algorithm.saltLength };
            return CryptoImpl.sign(key.id, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata), true), data);
        } else if (algorithm instanceof HmacKeyGenParams) {
            return CryptoImpl.sign(key.id, idlV1.signing_algorithm.hmac, String.UTF8.encode("", true), data);
        }

        return { data: null, err: new Error('Invalid algorithm') };
    }

    static verify<T>(algorithm: T, key: CryptoKey | null, data: ArrayBuffer | null, signature: ArrayBuffer | null): Result<VerifySignResult, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };
        if (!data)
            return { data: null, err: new Error('Invalid data: data cannot be null') };
        if (!signature)
            return { data: null, err: new Error('Invalid signature: signature cannot be null') };
        if (algorithm instanceof EcdsaParams) {
            const hash_info = CryptoUtil.getShaMetadata(algorithm.hash);
            if (!hash_info.data)
                return { data: null, err: hash_info.err };

            const hashMetadata = hash_info.data as idlV1.sha_metadata;
            const metadata: idlV1.ecdsa_signature_metadata = { sha_metadata: hashMetadata };
            return CryptoImpl.verify(key.id, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(metadata), true), data, signature);
        } else if (algorithm instanceof RsaPssParams) {
            const metadata: idlV1.rsa_pss_signature_metadata = { saltLength: algorithm.saltLength };
            return CryptoImpl.verify(key.id, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata), true), data, signature);
        } else if (algorithm instanceof HmacKeyGenParams) {
            const metadata = CryptoUtil.getHMACMetadata(algorithm);
            if (!metadata.data)
                return { data: null, err: metadata.err };
            const hmacMetadata = metadata.data as idlV1.hmac_metadata;
            return CryptoImpl.verify(key.id, idlV1.signing_algorithm.hmac, String.UTF8.encode(JSON.stringify(hmacMetadata), true), data, signature);
        }

        return { data: null, err: new Error('Invalid algorithm') };
    }

    static digest(algorithm: string, data: ArrayBuffer | null): Result<ArrayBuffer, Error> {
        if (!data)
            return { data: null, err: new Error('Invalid data: data cannot be null') };
        const hashInfo = CryptoUtil.getShaMetadata(algorithm);
        if (hashInfo.data) {
            const hashMetadata = hashInfo.data as idlV1.sha_metadata;
            return CryptoImpl.digest(idlV1.hash_algorithm.sha, String.UTF8.encode(JSON.stringify(hashMetadata), true), data);
        }
        else if (hashInfo.err)
            return { data: null, err: hashInfo.err };
        return { data: null, err: new Error('Invalid algorithm') };
    }

    static importKey<T>(format: string, keyData: ArrayBuffer | null, algorithm: T, extractable: boolean, usages: string[]): Result<CryptoKey, Error> {
        if (!keyData)
            return { data: null, err: new Error('Invalid key data: key data cannot be null') };

        const keyFormat = CryptoUtil.getKeyFormat(format);
        if (!keyFormat.data)
            return { data: null, err: keyFormat.err };

        const formatData = keyFormat.data as KeyFormatWrapper;

        let algoMetadata: ArrayBuffer;
        let keyAlgo: idlV1.key_algorithm;
        if (algorithm instanceof EcKeyGenParams) {
            if (algorithm.namedCurve == 'secp256k1' || algorithm.namedCurve == 'SECP256K1') {
                keyAlgo = idlV1.key_algorithm.secp_k1;
                const algoMetadataResult = CryptoUtil.getSECPK1Metadata(algorithm);
                if (algoMetadataResult.data) {
                    const secpk1Metadata = algoMetadataResult.data as idlV1.secp_k1_metadata;
                    algoMetadata = String.UTF8.encode(JSON.stringify(secpk1Metadata), true);
                }
                else
                    return { data: null, err: new Error('Failed to generate EC metadata') };
            }
            else if (algorithm.namedCurve == 'P-256' || algorithm.namedCurve == 'P-384' || algorithm.namedCurve == 'P-521') {
                keyAlgo = idlV1.key_algorithm.secp_r1;
                const algoMetadataResult = CryptoUtil.getSECPR1Metadata(algorithm);
                if (algoMetadataResult.data) {
                    const secpr1Metadata = algoMetadataResult.data as idlV1.secp_r1_metadata;
                    algoMetadata = String.UTF8.encode(JSON.stringify(secpr1Metadata), true);
                }
                else
                    return { data: null, err: new Error('Failed to generate EC metadata') };
            } else
                return { data: null, err: new Error('Invalid EC curve') };
        } else if (algorithm instanceof AesKeyGenParams) {
            keyAlgo = idlV1.key_algorithm.aes;
            const algoMetadataResult = CryptoUtil.getAESMetadata(algorithm);
            if (algoMetadataResult.data) {
                const aesMetadata = algoMetadataResult.data as idlV1.aes_metadata;
                algoMetadata = String.UTF8.encode(JSON.stringify(aesMetadata), true);
            }
            else
                return { data: null, err: new Error('Failed to generate AES metadata') };
        } else if (algorithm instanceof RsaHashedKeyGenParams) {
            keyAlgo = idlV1.key_algorithm.rsa;
            const rsaMetadata = CryptoUtil.getRSAMetadata(algorithm);
            if (rsaMetadata.data) {
                const metadata = rsaMetadata.data as idlV1.rsa_metadata;
                algoMetadata = String.UTF8.encode(JSON.stringify(metadata), true);
            }
            else
                return { data: null, err: new Error('Failed to generate RSA metadata') };
        } else if (algorithm instanceof HmacKeyGenParams) {
            keyAlgo = idlV1.key_algorithm.hmac;
            const hmacMetadata = CryptoUtil.getHMACMetadata(algorithm);
            if (hmacMetadata.data) {
                const metadata = hmacMetadata.data as idlV1.hmac_metadata;
                algoMetadata = String.UTF8.encode(JSON.stringify(metadata), true);
            }
            else
                return { data: null, err: new Error('Failed to generate HMAC metadata') };
        } else
            return { data: null, err: new Error('Invalid algorithm') };

        const key = CryptoImpl.importKey(formatData.format, keyData, keyAlgo, algoMetadata, extractable, usages, "");
        if (!key.data)
            return { data: null, err: new Error('Failed to import key') };

        const cryptoKeyJson = String.UTF8.decode(key.data!, true);
        let cryptoKey = JSON.parse<CryptoKey>(cryptoKeyJson);
        return { data: cryptoKey, err: null };
    }

    static wrapKey<T>(format: string, key: CryptoKey | null, wrappingKey: CryptoKey | null, wrapAlgo: T): Result<ArrayBuffer, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };

        if (!wrappingKey)
            return { data: null, err: new Error('Invalid wrapping key') };

        const keyFormat = CryptoUtil.getKeyFormat(format);
        if (!keyFormat.data)
            return { data: null, err: keyFormat.err };

        const formatData = keyFormat.data as KeyFormatWrapper;

        if (wrapAlgo instanceof RsaOaepParams) {
            const labelUintArray = Utils.convertToU8Array(Uint8Array.wrap(wrapAlgo.label));
            const wrappingInfo: idlV1.rsa_oaep_encryption_metadata = { label: labelUintArray };
            return CryptoImpl.wrapKey(wrappingKey.id, idlV1.wrapping_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(wrappingInfo), true), key.id, formatData.format);
        } else if (wrapAlgo instanceof AesGcmParams) {
            const iv = Utils.convertToU8Array(Uint8Array.wrap(wrapAlgo.iv));
            const additionalData = Utils.convertToU8Array(Uint8Array.wrap(wrapAlgo.additionalData));
            const wrappingInfo: idlV1.aes_gcm_encryption_metadata = { iv: iv, additionalData: additionalData, tagLength: wrapAlgo.tagLength };
            return CryptoImpl.wrapKey(wrappingKey.id, idlV1.wrapping_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(wrappingInfo), true), key.id, formatData.format);
        } else if (wrapAlgo instanceof NamedAlgorithm) {
            if (wrapAlgo.name == 'AES-KW' || wrapAlgo.name == 'aes-kw') {
                const wrappingInfo: idlV1.aes_kw_wrapping_metadata = { with_padding: true };
                return CryptoImpl.wrapKey(wrappingKey.id, idlV1.wrapping_algorithm.aes_kw, String.UTF8.encode(JSON.stringify(wrappingInfo), true), key.id, formatData.format);
            } else
                return { data: null, err: new Error('Invalid wrapping algorithm') };
        }
        return { data: null, err: new Error('Invalid algorithm') };
    }

    static unwrapKey<T, E>(format: string, wrappedKey: ArrayBuffer | null, unwrappingKey: CryptoKey | null, unwrapAlgo: T, unwrappedKeyAlgo: E, extractable: boolean, usages: string[]): Result<CryptoKey, Error> {
        if (!wrappedKey)
            return { data: null, err: new Error('Invalid wrapped key: wrapped key cannot be null') };

        if (!unwrappingKey)
            return { data: null, err: new Error('Invalid unwrapping key') };

        const keyFormat = CryptoUtil.getKeyFormat(format);
        if (!keyFormat.data)
            return { data: null, err: keyFormat.err };

        const formatData = keyFormat.data as KeyFormatWrapper;

        let wrappingAlgo: idlV1.wrapping_algorithm;
        let wrappingInfo: ArrayBuffer;
        if (unwrapAlgo instanceof RsaOaepParams) {
            const labelUintArray = Utils.convertToU8Array(Uint8Array.wrap(unwrapAlgo.label));
            const wrappingInfoRsaOaep: idlV1.rsa_oaep_encryption_metadata = { label: labelUintArray };
            wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoRsaOaep), true);
            wrappingAlgo = idlV1.wrapping_algorithm.rsa_oaep;
        } else if (unwrapAlgo instanceof AesGcmParams) {
            const iv = Utils.convertToU8Array(Uint8Array.wrap(unwrapAlgo.iv));
            const additionalData = Utils.convertToU8Array(Uint8Array.wrap(unwrapAlgo.additionalData));
            const wrappingInfoAesGcm: idlV1.aes_gcm_encryption_metadata = { iv: iv, additionalData: additionalData, tagLength: unwrapAlgo.tagLength };
            wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoAesGcm), true);
            wrappingAlgo = idlV1.wrapping_algorithm.aes_gcm;
        } else if (unwrapAlgo instanceof NamedAlgorithm) {
            if (unwrapAlgo.name == 'AES-KW' || unwrapAlgo.name == 'aes-kw') {
                const wrappingInfoAesKw: idlV1.aes_kw_wrapping_metadata = { with_padding: true };
                wrappingInfo = String.UTF8.encode(JSON.stringify(wrappingInfoAesKw), true);
                wrappingAlgo = idlV1.wrapping_algorithm.aes_kw;
            } else
                return { data: null, err: new Error('Invalid wrapping algorithm') };
        } else
            return { data: null, err: new Error('Invalid wrapping algorithm') };

        let keyGenAlgo: idlV1.key_algorithm;
        let keyGenInfo: ArrayBuffer;
        if (unwrappedKeyAlgo instanceof AesKeyGenParams) {
            const aesMetadata = CryptoUtil.getAESMetadata(unwrappedKeyAlgo);
            if (aesMetadata.data) {
                const keyGenMetadataAes = aesMetadata.data as idlV1.aes_metadata;
                keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataAes), true);
                keyGenAlgo = idlV1.key_algorithm.aes;
            } else
                return { data: null, err: new Error('Failed to generate AES metadata') };
        } else if (unwrappedKeyAlgo instanceof RsaHashedKeyGenParams) {
            const rsaMetadata = CryptoUtil.getRSAMetadata(unwrappedKeyAlgo);
            if (rsaMetadata.data) {
                const keyGenMetadataRsa = rsaMetadata.data as idlV1.rsa_metadata;
                keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataRsa), true);
                keyGenAlgo = idlV1.key_algorithm.rsa;
            }
            else
                return { data: null, err: new Error('Failed to generate RSA metadata') };
        } else if (unwrappedKeyAlgo instanceof EcKeyGenParams) {
            if (unwrappedKeyAlgo.namedCurve == 'P-256' || unwrappedKeyAlgo.namedCurve == 'P-384' || unwrappedKeyAlgo.namedCurve == 'P-521') {
                const metadata = CryptoUtil.getSECPR1Metadata(unwrappedKeyAlgo);
                if (metadata.data) {
                    const keyGenMetadataR1 = metadata.data as idlV1.secp_r1_metadata;
                    keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataR1), true);
                    keyGenAlgo = idlV1.key_algorithm.secp_r1;
                } else
                    return { data: null, err: new Error('Failed to generate EC metadata') };
            } else if (unwrappedKeyAlgo.namedCurve == 'secp256k1' || unwrappedKeyAlgo.namedCurve == 'SECP256K1') {
                const metadata = CryptoUtil.getSECPK1Metadata(unwrappedKeyAlgo);
                if (metadata.data) {
                    const keyGenMetadataK1 = metadata.data as idlV1.secp_k1_metadata;
                    keyGenInfo = String.UTF8.encode(JSON.stringify(keyGenMetadataK1), true);
                    keyGenAlgo = idlV1.key_algorithm.secp_k1;
                } else
                    return { data: null, err: new Error('Failed to generate EC metadata') };
            }
            else
                return { data: null, err: new Error('Failed to generate EC metadata: Invalid curve') };
        } else
            return { data: null, err: new Error('Invalid Key Gen algorithm') };

        const key = CryptoImpl.unwrapKey(unwrappingKey.id, wrappingAlgo, wrappingInfo, formatData.format, wrappedKey, keyGenAlgo, keyGenInfo, extractable, usages);
        
        if (key.data) {
            const keyInfo = String.UTF8.decode(key.data!, true);
            let cryptoKey = JSON.parse<CryptoKey>(keyInfo);
            return { data: cryptoKey, err: null };
        }
        else
            return { data: null, err: new Error('Failed to unwrap key') };
    }

    static exportKey(format: string, key: CryptoKey | null): Result<ArrayBuffer, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };

        const keyFormat = CryptoUtil.getKeyFormat(format);
        if (!keyFormat.data)
            return { data: null, err: keyFormat.err };

        const formatData = keyFormat.data as KeyFormatWrapper;

        const result = CryptoImpl.exportKey(key.id, formatData.format);
        if (result.data) {
            const keyData = result.data as ArrayBuffer;
            return { data: keyData, err: null };
        }
        else
            return { data: null, err: new Error('Failed to export key') };
    }

    static getPublicKey(key: CryptoKey | null): Result<CryptoKey, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };

        if (key.type == "secret" || key.family == "aes")
            return { data: null, err: new Error('Invalid key type: AES symmetric key cannot have public key') };

        if(key.type == "public")
            return { data: key, err: null };

        let pk = CryptoImpl.getPublicKeyAsCryptoKey(key.id);
        if(!pk.data)
            return { data: null, err: new Error('Failed to get public key') };
        
        const keyInfo = String.UTF8.decode(pk.data!, true);
        let publicKey = JSON.parse<CryptoKey>(keyInfo);
        return { data: publicKey, err: null };
    }

    static saveKey(key: CryptoKey | null, keyPersistedName: string): Result<UnitType, Error> {
        if (!key)
            return { data: null, err: new Error('Invalid key') };
        if (!keyPersistedName)
            return { data: null, err: new Error('Invalid key name: key name cannot be null') };
        if(CryptoImpl.keyExists(keyPersistedName))
            return { data: null, err: new Error('Key already exists') };
        let params = { keyId: key.id, keyName: keyPersistedName, keyType: key.type } as keyPersistParams;
        return CryptoImpl.persistKey(String.UTF8.encode(JSON.stringify(params)));
    }

    static loadKey(keyName: string): Result<CryptoKey, Error> {
        const loadKey = CryptoImpl.loadKey(keyName);
        if (loadKey.err)
            return { data: null, err: loadKey.err };

        const keyInfo = String.UTF8.decode(loadKey.data!, true);
        let key = JSON.parse<CryptoKey>(keyInfo);
        return { data: key, err: null };
    }
}
