/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { Result} from '../index';
import { CryptoImpl, Key } from './crypto_impl';
import * as idlV1 from "./crypto_subtle_idl_v1"
import { CryptoUtil } from './crypto_utils';
import { PrivateKey, PublicKey } from './crypto_keys';

class KeyECC extends Key {

    namedCurve: string = "P-256";

    sign(text: ArrayBuffer): Result<ArrayBuffer, Error> 
    {
        let hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256};
        if(this.namedCurve == "P-256") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256};
        else if(this.namedCurve == "P-384") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_384};
        else if(this.namedCurve == "P-521") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_512};
        else if(this.namedCurve == "secp256k1" || this.namedCurve == "SECP256K1") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256};
        else return {data: null, err: new Error("Unsupported curve")};
        let signatureMetadata: idlV1.ecdsa_signature_metadata = {sha_metadata: hashAlgo};
        return CryptoImpl.sign(this.name, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(signatureMetadata)), text);
    }

    verify(data: ArrayBuffer, signature: ArrayBuffer): Result<Boolean, Error>
    {
        let hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256};
        if(this.namedCurve == "P-256") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256};
        else if(this.namedCurve == "P-384") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_384};
        else if(this.namedCurve == "P-521") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_512};
        else if(this.namedCurve == "secp256k1" || this.namedCurve == "SECP256K1") hashAlgo = {algo_id: idlV1.sha_algorithm.sha2, length: idlV1.sha_digest_bitsize.SHA_256};
        else return {data: false, err: new Error("Unsupported curve")};

        let signatureMetadata: idlV1.ecdsa_signature_metadata = {sha_metadata: hashAlgo};
        return CryptoImpl.verify(this.name, idlV1.signing_algorithm.ecdsa, String.UTF8.encode(JSON.stringify(signatureMetadata)), data, signature);
    }

    getPublicKey(): PublicKey {
        let result = CryptoImpl.getPublicKey(this.name, "spki");
        if(!result.data)
            return new PublicKey(new Uint8Array(0));

        let resBuffer = result.data as ArrayBuffer;
        return new PublicKey(Uint8Array.wrap(resBuffer));
    }

    getPrivateKey(): PrivateKey {
        let result = CryptoImpl.exportKey(this.name, "pkcs8");
        if(!result.data)
            return new PublicKey(new Uint8Array(0));

        let resBuffer = result.data as ArrayBuffer;
        return new PrivateKey(Uint8Array.wrap(resBuffer));
    }
}

export class CryptoECDSA {

    static getKey(keyName: string): KeyECC | null {        
        if (CryptoImpl.keyExists(keyName))
            return new KeyECC(keyName);
        return null
    }

    static generateKey(keyName: string, namedCurve: string = 'P-256'): Result<KeyECC, Error> 
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        if(namedCurve == "P-256" || namedCurve == "P-384" || namedCurve == "P-521")
        {
            let algorithm = {name: "ECDSA", namedCurve: namedCurve} as EcKeyGenParams;
            let metadata = CryptoUtil.getSECPR1Metadata(algorithm);
            if(metadata.data)
            {
                let algo_metadata = metadata.data as idlV1.secp_r1_metadata;
                let key = CryptoImpl.generateKeyAndPersist(keyName, idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(algo_metadata)), true, ["sign"]);
                if (key.data)
                {
                    let keyData = key.data as Key;
                    let kECC = new KeyECC(keyData.name);
                    kECC.namedCurve = namedCurve;
                    return {data: kECC, err: null};
                }
                else
                    return {data: null, err: new Error("Failed to generate EC key")};
            }else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else if(namedCurve == "secp256k1" || namedCurve == "SECP256K1")
        {
            let algorithm = {name: "ECDSA", namedCurve: namedCurve} as EcKeyGenParams;
            let metadata = CryptoUtil.getSECPK1Metadata(algorithm);
            if(metadata.data)
            {
                let algo_metadata = metadata.data as idlV1.secp_k1_metadata;
                let key = CryptoImpl.generateKeyAndPersist(keyName, idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(algo_metadata)), true, ["sign"]);
                if (key.data)
                {
                    let keyData = key.data as Key;
                    let kECC = new KeyECC(keyData.name);
                    kECC.namedCurve = namedCurve;
                    return {data: kECC, err: null};
                }
                else
                    return {data: null, err: new Error("Failed to generate EC key")};
            }else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else
            return {data: null, err: new Error("Unsupported curve")};
    }

    static importPrivateKey(keyName: string, keyData: ArrayBuffer, namedCurve: string = 'P-256'): Result<KeyECC, Error> 
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if (keyData.byteLength == 0)
            return {data: null, err: new Error("Invalid key data: key data cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        const key = new KeyECC(keyName);
        key.namedCurve = namedCurve;

        if(namedCurve == "P-256" || namedCurve == "P-384" || namedCurve == "P-521")
        {
            let algorithm = {name: "ECDSA", namedCurve: namedCurve} as EcKeyGenParams;
            let metadata = CryptoUtil.getSECPR1Metadata(algorithm);
            if(metadata.data)
            {
                let algo_metadata = metadata.data as idlV1.secp_r1_metadata;
                let result = CryptoImpl.importKeyAndPersist(key.name, idlV1.key_format.pkcs8, keyData, idlV1.key_algorithm.secp_r1, String.UTF8.encode(JSON.stringify(algo_metadata)), true, ["sign"]);
                if (!result)
                    return {data: null, err: new Error("Failed to import EC key")};
                else
                    return {data: key, err: null};
            }else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else if(namedCurve == "secp256k1" || namedCurve == "SECP256K1")
        {
            let algorithm = {name: "ECDSA", namedCurve: namedCurve} as EcKeyGenParams;
            let metadata = CryptoUtil.getSECPK1Metadata(algorithm);
            if(metadata.data)
            {
                let algo_metadata = metadata.data as idlV1.secp_k1_metadata;
                let result = CryptoImpl.importKeyAndPersist(key.name, idlV1.key_format.pkcs8, keyData, idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(algo_metadata)), true, ["sign"]);
                if (!result)
                    return {data: null, err: new Error("Failed to import EC key")};
                else
                    return {data: key, err: null};
            }else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else
            return {data: null, err: new Error("Unsupported curve")};
    }

    static importPublicKey(keyName: string, keyData: ArrayBuffer, namedCurve: string = 'P-256'): Result<KeyECC, Error> 
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if (keyData.byteLength == 0)
            return {data: null, err: new Error("Invalid key data: key data cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        const key = new KeyECC(keyName);
        key.namedCurve = namedCurve;

        if(namedCurve == "P-256" || namedCurve == "P-384" || namedCurve == "P-521")
        {
            let algorithm = {name: "ECDSA", namedCurve: namedCurve} as EcKeyGenParams;
            let metadata = CryptoUtil.getSECPR1Metadata(algorithm);
            if(metadata.data)
            {
                let algo_metadata = metadata.data as idlV1.secp_r1_metadata;
                let result = CryptoImpl.importKeyAndPersist(key.name, idlV1.key_format.spki, keyData, idlV1.key_algorithm.secp_r1, String.UTF8.encode(JSON.stringify(algo_metadata)), true, ["verify"]);
                if (!result)
                    return {data: null, err: new Error("Failed to import EC key")};
                else
                    return {data: key, err: null};
            }else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else if(namedCurve == "secp256k1" || namedCurve == "SECP256K1")
        {
            let algorithm = {name: "ECDSA", namedCurve: namedCurve} as EcKeyGenParams;
            let metadata = CryptoUtil.getSECPK1Metadata(algorithm);
            if(metadata.data)
            {
                let algo_metadata = metadata.data as idlV1.secp_k1_metadata;
                let result = CryptoImpl.importKeyAndPersist(key.name, idlV1.key_format.spki, keyData, idlV1.key_algorithm.secp_k1, String.UTF8.encode(JSON.stringify(algo_metadata)), true, ["verify"]);
                if (!result)
                    return {data: null, err: new Error("Failed to import EC key")};
                else
                    return {data: key, err: null};
            }else
                return {data: null, err: new Error("Failed to generate EC metadata")};
        }else
            return {data: null, err: new Error("Unsupported curve")};
    }

    static exportPrivateKey(keyName: string): Result<ArrayBuffer, Error>
    {
        return CryptoImpl.exportKey(keyName, "pkcs8");
    }

    static exportPublicKey(keyName: string): Result<ArrayBuffer, Error>
    {
        return CryptoImpl.exportKey(keyName, "spki");
    }
}
