/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
import { Result } from '../index';
import { CryptoImpl, VerifySignResult, Key } from './crypto_impl';
import * as idlV1 from './crypto_subtle_idl_v1';
import { PublicKey } from './crypto_keys';
import { JSON } from '@klave/as-json/assembly';

export class KeyECC extends Key {

    namedCurve: string = 'P-256';

    sign(text: ArrayBuffer): Result<ArrayBuffer, Error> {
        let hashAlgo = { algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256 } as idlV1.sha_metadata;
        const signatureMetadata: idlV1.ecdsa_signature_metadata = { sha_metadata: hashAlgo };
        return CryptoImpl.sign(this.name, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(signatureMetadata), true), text);
    }

    verify(data: ArrayBuffer, signature: ArrayBuffer): Result<VerifySignResult, Error> {
        let hashAlgo = { algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256 } as idlV1.sha_metadata;
        const signatureMetadata: idlV1.ecdsa_signature_metadata = { sha_metadata: hashAlgo };
        return CryptoImpl.verify(this.name, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(signatureMetadata), true), data, signature);
    }

    getPublicKey(): PublicKey {
        const result = CryptoImpl.getPublicKey(this.name);
        if (!result.data)
            return new PublicKey(new Uint8Array(0));

        const resBuffer = result.data as ArrayBuffer;
        return new PublicKey(Uint8Array.wrap(resBuffer));
    }
}

export class CryptoECDSA {

    static getKey(keyName: string): KeyECC | null {
        if (CryptoImpl.keyExists(keyName))
            return { name: keyName, namedCurve: 'P-256' } as KeyECC;
        return null;
    }

    static generateKey(keyName: string): Result<KeyECC, Error> {
        if (keyName == '')
            return { data: null, err: new Error('Invalid key name: key name cannot be empty') };

        if (CryptoImpl.keyExists(keyName))
            return { data: null, err: new Error('Invalid key name: key name already exists') };

        let metadata: idlV1.secp_r1_metadata = { length: idlV1.secp_r1_key_bitsize.SECP_R1_256 };
        const key = CryptoImpl.generateKey(idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(metadata), true), true, ['sign'], keyName);
        if (key.err)
            return { data: null, err: key.err };

        const saved = CryptoImpl.saveKey(keyName);
        if (saved.err)
            return { data: null, err: saved.err };

        const keyData = key.data as Key;
        const kECC = { name: keyData.name, namedCurve: "P-256" } as KeyECC;
        return { data: kECC, err: null };
    }
}
