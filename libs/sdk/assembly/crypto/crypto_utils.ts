/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import * as idlV1 from './crypto_subtle_idl_v1';
import { RsaHashedKeyGenParams, EcKeyGenParams, AesKeyGenParams } from './crypto_subtle';
import { Result } from '../index';

export class KeyFormatWrapper
{
    format!: idlV1.key_format;
}

export class CryptoUtil
{
    static isValidAlgorithm(algorithm: string): boolean {
        if (algorithm != 'sha2-256' && algorithm != 'sha2_256' && algorithm != 'sha256' &&
            algorithm != 'sha2-384' && algorithm != 'sha2_384' && algorithm != 'sha384' &&
            algorithm != 'sha2-512' && algorithm != 'sha2_512' && algorithm != 'sha512' &&
            algorithm != 'sha3-256' && algorithm != 'sha3_256' &&
            algorithm != 'sha3-384' && algorithm != 'sha3_384' &&
            algorithm != 'sha3-512' && algorithm != 'sha3_512')
            return false;
        return true;
    }

    static digestSize(algorithm: string): number {
        switch (algorithm)
        {
            case 'sha3-256':
            case 'sha3_256':
            case 'sha2-256':
            case 'sha2_256':
            case 'sha256':
                return 32;
            case 'sha3-384':
            case 'sha3_384':
            case 'sha2-384':
            case 'sha2_384':
            case 'sha384':
                return 48;
            case 'sha3-512':
            case 'sha3_512':
            case 'sha2-512':
            case 'sha2_512':
            case 'sha512':
                return 64;
            default:
                break;
        }
        return 0;
    }

    static getShaMetadata(algorithm: string): Result<idlV1.sha_metadata, Error>
    {
        if(algorithm == 'sha2-256' || algorithm == 'SHA2-256' || algorithm == 'sha256' || algorithm == 'SHA256')
        {
            return  {data: {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256}, err: null};
        }else if(algorithm == 'sha2-384' || algorithm == 'SHA2-384' || algorithm == 'sha384' || algorithm == 'SHA384')
        {
            return {data: {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_384}, err: null};
        }else if(algorithm == 'sha2-512' || algorithm == 'SHA2-512' || algorithm == 'sha512' || algorithm == 'SHA512')
        {
            return {data: {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_512}, err: null};
        }else if(algorithm == 'sha3-256' || algorithm == 'SHA3-256')
        {
            return {data: {algo_id: idlV1.sha_algorithm.sha3, length: idlV1.sha_digest_bitsize.SHA_256}, err: null};
        }else if(algorithm == 'sha3-384' || algorithm == 'SHA3-384')
        {
            return {data: {algo_id: idlV1.sha_algorithm.sha3, length: idlV1.sha_digest_bitsize.SHA_384}, err: null};
        }else if (algorithm == 'sha3-512' || algorithm == 'SHA3-512')
        {
            return {data: {algo_id: idlV1.sha_algorithm.sha3, length: idlV1.sha_digest_bitsize.SHA_512}, err: null};
        }else
        {
            return {data: null, err: new Error(`Unsupported algorithm ${algorithm}`)};
        }
    }

    static getRSAMetadata(params: RsaHashedKeyGenParams): Result<idlV1.rsa_metadata, Error>
    {
        let bitsize = idlV1.rsa_key_bitsize.RSA_2048;
        if (params.modulusLength == 3072)
            bitsize = idlV1.rsa_key_bitsize.RSA_3072;
        else if (params.modulusLength == 4096)
            bitsize = idlV1.rsa_key_bitsize.RSA_4096;
        else if (params.modulusLength == 2048)
            bitsize = idlV1.rsa_key_bitsize.RSA_2048;
        else
            return {data: null, err: new Error('Invalid RSA key size')};

        const shaMetadata = CryptoUtil.getShaMetadata(params.hash);

        if(shaMetadata.data)
            return {data: {modulus: bitsize, public_exponent:params.publicExponent, sha_metadata: shaMetadata.data as idlV1.sha_metadata}, err: null};
        else if(shaMetadata.err)
            return {data: null, err: shaMetadata.err};

        return {data: null, err: new Error('getRSAMetadata: Invalid RSA Metadata')};
    }

    static getSECPR1Metadata(params: EcKeyGenParams): Result<idlV1.secp_r1_metadata, Error>
    {
        if(params.namedCurve != 'P-256' && params.namedCurve != 'P-384' && params.namedCurve != 'P-521')
            return {data: null, err: new Error('Invalid EC curve')};

        let bitsize = idlV1.secp_r1_key_bitsize.SECP_R1_256;
        if (params.namedCurve == 'P-256')
            bitsize = idlV1.secp_r1_key_bitsize.SECP_R1_256;
        else if (params.namedCurve == 'P-384')
            bitsize = idlV1.secp_r1_key_bitsize.SECP_R1_384;
        else if (params.namedCurve == 'P-521')
            bitsize = idlV1.secp_r1_key_bitsize.SECP_R1_521;
        else
            return {data: null, err: new Error('Invalid EC curve')};


        return {data: {length: bitsize}, err: null};
    }

    static getSECPK1Metadata(params: EcKeyGenParams): Result<idlV1.secp_k1_metadata, Error>
    {
        if(params.namedCurve != 'secp256k1' && params.namedCurve != 'SECP256K1')
            return {data: null, err: new Error('Invalid EC curve')};

        const bitsize = idlV1.secp_k1_key_bitsize.SECP_K1_256;
        return {data: {length: bitsize}, err: null};
    }

    static getAESMetadata(params: AesKeyGenParams): Result<idlV1.aes_metadata, Error>
    {
        let bitsize = idlV1.aes_key_bitsize.AES_128;
        if (params.length == 192)
            bitsize = idlV1.aes_key_bitsize.AES_192;
        else if (params.length == 256)
            bitsize = idlV1.aes_key_bitsize.AES_256;
        else if (params.length == 128)
            bitsize = idlV1.aes_key_bitsize.AES_128;
        else
            return {data: null, err: new Error('Invalid AES key size')};

        return {data: {length: bitsize}, err: null};
    }

    static getKeyFormat(format: string): Result<KeyFormatWrapper, Error>
    {
        if(format == 'raw' || format == 'RAW')
            return {data: { format: idlV1.key_format.raw }, err: null};
        else if(format == 'pkcs8' || format == 'PKCS8')
            return {data: { format: idlV1.key_format.pkcs8 }, err: null};
        else if(format == 'spki' || format == 'SPKI')
            return {data: { format: idlV1.key_format.spki }, err: null};
        else if(format == 'sec1' || format == 'SEC1')
            return {data: { format: idlV1.key_format.sec1 }, err: null};
        else if(format == 'pkcs1' || format == 'PKCS1')
            return {data: { format: idlV1.key_format.pkcs1 }, err: null};
        else
            return {data: null, err: new Error('Invalid or unsupported key format')};
    }
}