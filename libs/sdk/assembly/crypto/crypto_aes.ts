/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { Utils } from './index';
import { Result } from '../index';
import { CryptoImpl, Key } from './crypto_impl';
import * as idlV1 from './crypto_subtle_idl_v1';
import { JSON } from '@klave/as-json/assembly';

export class KeyAES extends Key {

    length: u32 = 256;

    encrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        const iv = CryptoImpl.getRandomBytes(12);
        if(!iv.data)
            return { data: null, err: new Error('Failed to generate IV') };
        const additionalData = new Uint8Array(0);
        const aesGcmParams: idlV1.aes_gcm_encryption_metadata = { iv: iv.data as Uint8Array, additionalData: additionalData, tagLength: idlV1.aes_tag_length.TAG_96 };
        return CryptoImpl.encrypt(this.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams)), data);
    }

    decrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        const additionalData = new Uint8Array(0);
        const aesGcmParams: idlV1.aes_gcm_encryption_metadata = { iv: new Uint8Array(0), additionalData: additionalData, tagLength: idlV1.aes_tag_length.TAG_96 };
        return CryptoImpl.decrypt(this.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams)), data);
    }
}

export class CryptoAES {

    static getKey(keyName: string): KeyAES | null {
        if (CryptoImpl.keyExists(keyName))
            return {name: keyName, length: 256} as KeyAES;
        return null;
    }

    static generateKey(keyName: string, length: u32 = 256): Result<KeyAES, Error> {
        if (keyName == '')
            return { data: null, err: new Error('Invalid key name: key name cannot be empty') };

        if (CryptoImpl.keyExists(keyName))
            return { data: null, err: new Error('Invalid key name: key name already exists') };

        let bitSize: idlV1.aes_key_bitsize = idlV1.aes_key_bitsize.AES_256;
        if (length == 128)
            bitSize = idlV1.aes_key_bitsize.AES_128;
        else if (length == 192)
            bitSize = idlV1.aes_key_bitsize.AES_192;
        else if (length == 256)
            bitSize = idlV1.aes_key_bitsize.AES_256;
        else
            return { data: null, err: new Error('Invalid AES Key length: Length must be 128, 192, or 256') };

        const metadata = { length: bitSize } as idlV1.aes_metadata;
        const key = CryptoImpl.generateKeyAndPersist(keyName, idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(metadata)), true, ['decrypt', 'encrypt']);

        if (!key.data)
            return { data: null, err: new Error('Failed to generate AES Key') };

        const keyData = key.data as Key;
        const kAES = {name: keyData.name, length: length} as KeyAES;
        kAES.length = length;
        return { data: kAES, err: null };
    }

    static importKey(keyName: string, keyData: ArrayBuffer, length: u32 = 256): Result<KeyAES, Error> {
        if (keyName == '')
            return { data: null, err: new Error('Invalid key name: key name cannot be empty') };

        if (keyData.byteLength == 0)
            return { data: null, err: new Error('Invalid key data: key data cannot be empty') };

        if (CryptoImpl.keyExists(keyName))
            return { data: null, err: new Error('Invalid key name: key name already exists') };

        let bitSize: idlV1.aes_key_bitsize = idlV1.aes_key_bitsize.AES_256;
        if (length == 128)
            bitSize = idlV1.aes_key_bitsize.AES_128;
        else if (length == 192)
            bitSize = idlV1.aes_key_bitsize.AES_192;
        else if (length == 256)
            bitSize = idlV1.aes_key_bitsize.AES_256;
        else
            return { data: null, err: new Error('Invalid AES Key length: Length must be 128, 192, or 256') };

        const metadata = { length: bitSize } as idlV1.aes_metadata;
        const key = CryptoImpl.importKeyAndPersist(keyName, idlV1.key_format.raw, keyData, idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(metadata)), true, ['decrypt', 'encrypt']);

        if (!key.data)
            return { data: null, err: new Error('Failed to import AES Key') };

        const keyObject = key.data as Key;
        const kAES = {name: keyObject.name, length: length} as KeyAES;
        kAES.length = length;
        return { data: kAES, err: null };
    }

    static exportKey(keyName: string): Result<ArrayBuffer, Error> {
        return CryptoImpl.exportKey(keyName, idlV1.key_format.raw);
    }
}

