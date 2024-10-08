/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
import { Result } from '../index';
import { CryptoImpl, KeyFormatWrapper, Key } from './crypto_impl';
import * as idlV1 from "./crypto_subtle_idl_v1"
import { CryptoUtil } from './crypto_utils';
import { PrivateKey, PublicKey } from './crypto_keys';

class KeyRSA extends Key {

    moduluslength: u32 = 2048;

    encrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> 
    {
        let labelUintArray = new Uint8Array(0);
        let rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
        return CryptoImpl.encrypt(this.name, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams)), data);
    }

    decrypt(data: ArrayBuffer): Result<ArrayBuffer, Error>{
        let labelUintArray = new Uint8Array(0);
        let rsaOaepParams: idlV1.rsa_oaep_encryption_metadata = {label: labelUintArray};
        return CryptoImpl.decrypt(this.name, idlV1.encryption_algorithm.rsa_oaep, String.UTF8.encode(JSON.stringify(rsaOaepParams)), data);
    }

    sign(data: ArrayBuffer): Result<ArrayBuffer, Error> 
    {
        let saltLength = 32;
        if(this.moduluslength == 3072)
            saltLength = 48;
        else if(this.moduluslength == 4096)
            saltLength = 64;

        let metadata: idlV1.rsa_pss_signature_metadata = {saltLength: 32}; //32 corresponds to the length of the hash sha256
        return CryptoImpl.sign(this.name, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata)), data);
    }

    verify(data: ArrayBuffer, signature: ArrayBuffer): Result<boolean, Error>{
        let saltLength = 32;
        if(this.moduluslength == 3072)
            saltLength = 48;
        else if(this.moduluslength == 4096)
            saltLength = 64;

        let metadata: idlV1.rsa_pss_signature_metadata = {saltLength: saltLength};
        return CryptoImpl.verify(this.name, idlV1.signing_algorithm.rsa_pss, String.UTF8.encode(JSON.stringify(metadata)), data, signature);
    }

    getPublicKey(): PublicKey {
        let result = CryptoImpl.getPublicKey(this.name, "spki");
        if(!result.data)
            return new PublicKey(new Uint8Array(0));

        let resBuffer = result.data as ArrayBuffer;
        return new PublicKey(Uint8Array.wrap(resBuffer));
    }

    getPrivateKey(): PrivateKey {
        let result = CryptoImpl.exportKey(this.name, "pkcs1");
        if(!result.data)
            return new PublicKey(new Uint8Array(0));

        let resBuffer = result.data as ArrayBuffer;
        return new PrivateKey(Uint8Array.wrap(resBuffer));
    }

}

export class CryptoRSA {

    static getKey(keyName: string): KeyRSA | null {
        if (CryptoImpl.keyExists(keyName))
            return new KeyRSA(keyName);
        return null
    }

    static generateKey(keyName: string, moduluslength: u32 = 2048): Result<KeyRSA, Error>
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        if(moduluslength != 2048 && moduluslength != 3072 && moduluslength != 4096)
            return {data: null, err: new Error("Invalid modulus length: modulus length must be 2048, 3072, or 4096")};

        let shaAlgo = "sha2-256";
        if(moduluslength == 3072)
            shaAlgo = "sha2-384";
        else if(moduluslength == 4096)
            shaAlgo = "sha2-512";

        let shaMetadata = CryptoUtil.getShaMetadata(shaAlgo);
        let algoMetadata = {modulus: moduluslength, sha_metadata: shaMetadata.data} as idlV1.rsa_metadata;
        const key = CryptoImpl.generateKeyAndPersist(keyName, idlV1.key_algorithm.rsa, String.UTF8.encode(JSON.stringify(algoMetadata)), true, ["sign", "decrypt"]);
        if (!key.data) {
            return {data: null, err: new Error("Failed to generate RSA key")};
        }

        let keyData = key.data as Key;
        let rsaKey = new KeyRSA(keyData.name);
        rsaKey.moduluslength = moduluslength;

        return {data: rsaKey, err: null};
    }

    static importPrivateKey(keyName: string, keyData: ArrayBuffer, moduluslength: u32 = 2048): Result<KeyRSA, Error> 
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if (keyData.byteLength == 0)
            return {data: null, err: new Error("Invalid key data: key data cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        if(moduluslength != 2048 && moduluslength != 3072 && moduluslength != 4096)
            return {data: null, err: new Error("Invalid modulus length: modulus length must be 2048, 3072, or 4096")};

        let formatMetadata = CryptoUtil.getKeyFormat("pkcs1");
        if (!formatMetadata)
            return {data: null, err: new Error("Invalid key format")};

        let shaAlgo = "sha2-256";
        if(moduluslength == 3072)
            shaAlgo = "sha2-384";
        else if(moduluslength == 4096)
            shaAlgo = "sha2-512";

        let shaMetadata = CryptoUtil.getShaMetadata(shaAlgo);
        let algoMetadata = {modulus: moduluslength, sha_metadata: shaMetadata.data} as idlV1.rsa_metadata;
        let algoMetadataStr = String.UTF8.encode(JSON.stringify(algoMetadata));
        let formatData = formatMetadata.data as KeyFormatWrapper;
        
        let keyImportResult = CryptoImpl.importKey(formatData.format, keyData, idlV1.key_algorithm.rsa, algoMetadataStr, true, ["sign", "decrypt"]);

        if (!keyImportResult.data)
            return {data: null, err: new Error("Failed to import key")};

        const key = new KeyRSA(keyName);
        key.moduluslength = moduluslength;
        return {data: key, err: null};
    }

    static importPublicKey(keyName: string, keyData: ArrayBuffer, moduluslength: u32 = 2048): Result<KeyRSA, Error> 
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if (keyData.byteLength == 0)
            return {data: null, err: new Error("Invalid key data: key data cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        if(moduluslength != 2048 && moduluslength != 3072 && moduluslength != 4096)
            return {data: null, err: new Error("Invalid modulus length: modulus length must be 2048, 3072, or 4096")};

        let formatMetadata = CryptoUtil.getKeyFormat("spki");
        if (!formatMetadata)
            return {data: null, err: new Error("Invalid key format")};

        let shaAlgo = "sha2-256";
        if(moduluslength == 3072)
            shaAlgo = "sha2-384";
        else if(moduluslength == 4096)
            shaAlgo = "sha2-512";

        let shaMetadata = CryptoUtil.getShaMetadata(shaAlgo);
        let algoMetadata = {modulus: moduluslength, sha_metadata: shaMetadata.data} as idlV1.rsa_metadata;
        let algoMetadataStr = String.UTF8.encode(JSON.stringify(algoMetadata));
        let formatData = formatMetadata.data as KeyFormatWrapper;
        
        let keyImportResult = CryptoImpl.importKey(formatData.format, keyData, idlV1.key_algorithm.rsa, algoMetadataStr, true, ["verify", "encrypt"]);

        if (!keyImportResult.data)
            return {data: null, err: new Error("Failed to import key")};

        const key = new KeyRSA(keyName);
        key.moduluslength = moduluslength;
        return {data: key, err: null};
    }

    static exportPrivateKey(keyName: string): Result<ArrayBuffer, Error>
    {
        return CryptoImpl.exportKey(keyName, "pkcs1");
    }

    static exportPublicKey(keyName: string): Result<ArrayBuffer, Error>
    {
        return CryptoImpl.exportKey(keyName, "spki");
    }
}
