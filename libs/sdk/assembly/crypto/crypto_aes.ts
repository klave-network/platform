/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { Utils } from './index';
import { Crypto, Result } from '../index';
import { CryptoImpl, Key } from './crypto_impl';
import * as idlV1 from './crypto_subtle_idl_v1';
import { JSON } from '@klave/as-json/assembly';

export class KeyAES extends Key {

    length: u32 = 256;

    encrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        const iv = CryptoImpl.getRandomBytes(12);
        if(!iv.data)
            return { data: null, err: new Error('Failed to generate IV') };
        const ivArray = Utils.convertToU8Array(iv.data as Uint8Array);
        const additionalData = new Array<u8>(0);
        const aesGcmParams: idlV1.aes_gcm_encryption_metadata = { iv: ivArray, additionalData: additionalData, tagLength: idlV1.aes_tag_length.TAG_96 };
        const encrypted = CryptoImpl.encrypt(this.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams), true), data);
        if (encrypted.err)
            return { data: null, err: encrypted.err };
        // prepend iv : encrypted blob can only be decrypted by KeyAES.decrypt
        let result = new Uint8Array(encrypted.data!.byteLength + 12);
        result.set(iv.data!);
        result.set(Uint8Array.wrap(encrypted.data!), 12);
        return { data: result.buffer, err: null };
    }

    decrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        const ivArray = Crypto.Utils.convertToU8Array(Uint8Array.wrap(data.slice(0, 12)));
        const encrypted = data.slice(12);
        const additionalData = new Array<u8>(0);
        const aesGcmParams: idlV1.aes_gcm_encryption_metadata = { iv: ivArray, additionalData: additionalData, tagLength: idlV1.aes_tag_length.TAG_96 };
        return CryptoImpl.decrypt(this.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams), true), encrypted);
    }
}

export class CryptoAES {

    static getKey(keyName: string): KeyAES | null {
        if (CryptoImpl.keyExists(keyName))
            return {name: keyName, length: 256} as KeyAES;
        return null;
    }

    static generateKey(keyName: string): Result<KeyAES, Error> {
        if (keyName == '')
            return { data: null, err: new Error('Invalid key name: key name cannot be empty') };

        if (CryptoImpl.keyExists(keyName))
            return { data: null, err: new Error('Invalid key name: key name already exists') };

        const metadata = { length: idlV1.aes_key_bitsize.AES_256 } as idlV1.aes_metadata;
        const key = CryptoImpl.generateKey(idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(metadata), true), true, ['decrypt', 'encrypt'], keyName);

        if (key.err)
            return { data: null, err: key.err };

        const saved = CryptoImpl.saveKey(keyName);
        if (saved.err)
            return { data: null, err: saved.err };

        const keyData = key.data as Key;
        const kAES = {name: keyData.name, length: 256} as KeyAES;
        return { data: kAES, err: null };
    }
}
