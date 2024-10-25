/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { encode as b64encode } from 'as-base64/assembly';

import { CryptoImpl, Key } from './crypto_impl';

export { Key, UnitType, VerifySignResult as SignatureVerification } from './crypto_impl';
export { CryptoAES as AES, KeyAES } from './crypto_aes';
export { CryptoECDSA as ECDSA, KeyECC } from './crypto_ecc';
export { CryptoRSA as RSA, KeyRSA } from './crypto_rsa';
export { CryptoSHA as SHA } from './crypto_sha';
export {
    AesGcmParams, AesKeyGenParams,
    CryptoKey,
    EcdsaParams, EcKeyGenParams,
    NamedAlgorithm,
    RsaHashedKeyGenParams, RsaOaepParams, RsaPssParams,
    SubtleCrypto as Subtle
} from './crypto_subtle';

export function getKey(keyName: string): Key | null {
    if (CryptoImpl.keyExists(keyName)) return Key.create(keyName);
    return null;
}

export function getRandomValues(size: i32): Uint8Array | null {
    let randomByteRes = CryptoImpl.getRandomBytes(size);
    if (!randomByteRes.data)
        return null;
    else
        return randomByteRes.data as Uint8Array;
}

export function getPem(key: Uint8Array, isPrivate: bool = false): string {
    if (!isPrivate) {
        const pem = `-----BEGIN PUBLIC KEY-----
${b64encode(key)}
-----END PUBLIC KEY-----`;
        return pem;
    } else {
        const pem = `-----BEGIN PRIVATE KEY-----
${b64encode(key)}
-----END PRIVATE KEY-----`;
        return pem;
    }
}

export class Utils {
    static convertToU8Array(input: Uint8Array): u8[] {
        const ret: u8[] = [];
        for (let i = 0; i < input.length; ++i)
            ret[i] = input[i];

        return ret;
    }

    static convertToUint8Array(input: u8[]): Uint8Array {
        const value = new Uint8Array(input.length);
        for (let i = 0; i < input.length; ++i) {
            value[i] = input[i];
        }

        return value;
    }
}
