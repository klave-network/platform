/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { CryptoImpl, Key } from './crypto_impl';
import * as SubtleCrypto from './crypto_subtle';
import { CryptoAES, KeyAES as AESKey } from './crypto_aes';
import { CryptoECDSA, KeyECC as ECCKey } from './crypto_ecc';
import { CryptoRSA, KeyRSA as RSAKey } from './crypto_rsa';
import { CryptoSHA } from './crypto_sha';
import { encode as b64encode } from 'as-base64/assembly';

export class Subtle extends SubtleCrypto.SubtleCrypto { }
export class RsaHashedKeyGenParams extends SubtleCrypto.RsaHashedKeyGenParams { }
export class RsaOaepParams extends SubtleCrypto.RsaOaepParams { }
export class RsaPssParams extends SubtleCrypto.RsaPssParams { }
export class AesKeyGenParams extends SubtleCrypto.AesKeyGenParams { }
export class AesGcmParams extends SubtleCrypto.AesGcmParams { }
export class EcKeyGenParams extends SubtleCrypto.EcKeyGenParams { }
export class EcdsaParams extends SubtleCrypto.EcdsaParams { }
export class NamedAlgorithm extends SubtleCrypto.NamedAlgorithm { }
export class AES extends CryptoAES { };
export class KeyAES extends AESKey { }
export class ECDSA extends CryptoECDSA { };
export class KeyECC extends ECCKey { };
export class RSA extends CryptoRSA { };
export class KeyRSA extends RSAKey { };
export class SHA extends CryptoSHA { };

export function getKey(keyName: string): Key | null {    
    if (CryptoImpl.keyExists(keyName))
        return new Key(keyName);
    return null
}

export function getRandomValues(size: i32): u8[] {
    return CryptoImpl.getRandomBytes(size);
}

export function getPem(key: Uint8Array, isPrivate: bool = false) : string
{
    if(!isPrivate)
    {        
        const pem = `-----BEGIN PUBLIC KEY-----
${b64encode(key)}
-----END PUBLIC KEY-----`;
        return pem;
    }else{
        const pem = `-----BEGIN PRIVATE KEY-----
${b64encode(key)}
-----END PRIVATE KEY-----`;
        return pem;
    }
}

export class Utils {

    static convertToU8Array(input: Uint8Array): u8[] {
        let ret: u8[] = [];
        for (let i = 0; i < input.length; ++i)
            ret[i] = input[i];

        return ret;
    }

    static convertToUint8Array(input: u8[]): Uint8Array {
        let value = new Uint8Array(input.length);
        for (let i = 0; i < input.length; ++i) {
            value[i] = input[i];
        }

        return value;
    }

}
