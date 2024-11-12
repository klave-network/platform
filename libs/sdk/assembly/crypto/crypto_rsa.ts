/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
import { Result } from '../index';
import { CryptoImpl, Key, VerifySignResult } from './crypto_impl';
import * as idlV1 from './crypto_subtle_idl_v1';
import { CryptoUtil } from './crypto_utils';
import { PublicKey } from './crypto_keys';
import { JSON } from '@klave/as-json/assembly';

export class KeyRSA extends Key {

    moduluslength: u32 = 2048;

    encrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        const labelUintArray = new Array<u8>(0);
        const rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = { label: labelUintArray };
        return CryptoImpl.encrypt(this.name, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams), true), data);
    }

    decrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        const labelUintArray = new Array<u8>(0);
        const rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = { label: labelUintArray };
        return CryptoImpl.decrypt(this.name, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams), true), data);
    }

    sign(data: ArrayBuffer): Result<ArrayBuffer, Error> {
        let saltLength = 32; // default salt length for sha256
        const metadata: idlV1.rsa_pss_signature_metadata = { saltLength: saltLength };
        return CryptoImpl.sign(this.name, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata), true), data);
    }

    verify(data: ArrayBuffer, signature: ArrayBuffer): Result<VerifySignResult, Error> {
        let saltLength = 32; // default length for sha256
        const metadata: idlV1.rsa_pss_signature_metadata = { saltLength: saltLength };
        return CryptoImpl.verify(this.name, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata), true), data, signature);
    }

    getPublicKey(): PublicKey {
        const result = CryptoImpl.getPublicKey(this.name);
        if (!result.data)
            return new PublicKey(new Uint8Array(0));

        const resBuffer = result.data as ArrayBuffer;
        return new PublicKey(Uint8Array.wrap(resBuffer));
    }
}

export class CryptoRSA {

    static getKey(keyName: string): KeyRSA | null {
        if (CryptoImpl.keyExists(keyName))
            return { name: keyName, moduluslength: 2048 } as KeyRSA;
        return null;
    }

    static generateKey(keyName: string): Result<KeyRSA, Error> {
        if (keyName == '')
            return { data: null, err: new Error('Invalid key name: key name cannot be empty') };

        if (CryptoImpl.keyExists(keyName))
            return { data: null, err: new Error('Invalid key name: key name already exists') };

        let shaAlgo = 'sha2-256';
        const shaMetadata = CryptoUtil.getShaMetadata(shaAlgo);
        const metadata = shaMetadata.data as idlV1.sha_metadata;
        const algoMetadata = { modulus: idlV1.rsa_key_bitsize.RSA_2048, sha_metadata: metadata } as idlV1.rsa_metadata;
        const key = CryptoImpl.generateKey(idlV1.key_algorithm.rsa, String.UTF8.encode(JSON.stringify(algoMetadata), true), true, ['sign', 'decrypt'], keyName);
        if (key.err)
            return { data: null, err: key.err };

        const saved = CryptoImpl.saveKey(keyName);
        if (saved.err)
            return { data: null, err: saved.err };

        const keyData = key.data as Key;
        const rsaKey = { name: keyData.name, moduluslength: 2048 } as KeyRSA;
        return { data: rsaKey, err: null };
    }
}
