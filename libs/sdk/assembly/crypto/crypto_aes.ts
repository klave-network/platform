/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { Utils } from './index';
import { Result} from '../index';
import { CryptoImpl, Key } from './crypto_impl';
import * as idlV1 from "./crypto_subtle_idl_v1"
import { CryptoUtil, KeyFormatWrapper } from './crypto_utils';

class KeyAES extends Key {

    length: u32 = 256;

    encrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> 
    {
        let iv = Utils.convertToUint8Array(CryptoImpl.getRandomBytes(12));
        let additionalData = new Uint8Array(0);
        let aesGcmParams: idlV1.aes_gcm_encryption_metadata = {iv: iv, additionalData: additionalData, tagLength: idlV1.aes_tag_length.TAG_96};
        return CryptoImpl.encrypt(this.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams)), data);
    }

    decrypt(data: ArrayBuffer): Result<ArrayBuffer, Error> 
    {
        let additionalData = new Uint8Array(0);
        let aesGcmParams: idlV1.aes_gcm_encryption_metadata = {iv: new Uint8Array(0), additionalData: additionalData, tagLength: idlV1.aes_tag_length.TAG_96};
        return CryptoImpl.decrypt(this.name, idlV1.encryption_algorithm.aes_gcm, String.UTF8.encode(JSON.stringify(aesGcmParams)), data);
    }
}

export class CryptoAES {

    static getKey(keyName: string): KeyAES | null {
        if (CryptoImpl.keyExists(keyName))
            return new KeyAES(keyName);
        return null
    }

    static generateKey(keyName: string, length: u32 = 256): Result<KeyAES, Error> 
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        if(length != 128 && length != 192 && length != 256)
            return {data: null, err: new Error("Invalid AES Key length: Length must be 128, 192, or 256")};

        let algorithm = {name: "AES-GCM", length: length} as AesKeyGenParams;
        let metadata = CryptoUtil.getAESMetadata(algorithm);
        if(!metadata.data)
            return {data: null, err: new Error("Invalid AES Metadata")};

        let aesMetadata = metadata.data as idlV1.aes_metadata;
        let key = CryptoImpl.generateKeyAndPersist(keyName, idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(aesMetadata)), true, ["decrypt", "encrypt"]);

        if(!key)
            return {data: null, err: new Error("Failed to generate AES Key")};

        let keyData = key.data as Key;
        let kAES = new KeyAES(keyData.name);
        kAES.length = length;
        return {data: kAES, err: null};
    }

    static importKey(keyName: string, keyData: ArrayBuffer, length: u32 = 256): Result<KeyAES, Error>
    {
        if(keyName == "")
            return {data: null, err: new Error("Invalid key name: key name cannot be empty")};

        if (keyData.byteLength == 0)
            return {data: null, err: new Error("Invalid key data: key data cannot be empty")};

        if(CryptoImpl.keyExists(keyName))
            return {data: null, err: new Error("Invalid key name: key name already exists")};

        if(length != 128 && length != 192 && length != 256)
            return {data: null, err: new Error("Invalid AES Key length: Length must be 128, 192, or 256")};

        let formatMetadata = CryptoUtil.getKeyFormat("raw");
        if (!formatMetadata)
            return {data: null, err: new Error("Invalid key format")};

        let format = formatMetadata.data as KeyFormatWrapper;
        let algorithm = {name: "AES-GCM", length: length} as AesKeyGenParams;
        let metadata = CryptoUtil.getAESMetadata(algorithm);
        if(!metadata.data)
            return {data: null, err: new Error("Invalid AES Metadata")};

        let aesMetadata = metadata.data as idlV1.aes_metadata;
        let key = CryptoImpl.importKeyAndPersist(keyName, format.format, keyData, idlV1.key_algorithm.aes, String.UTF8.encode(JSON.stringify(aesMetadata)), true, ["decrypt", "encrypt"]);
        
        if(!key)
            return {data: null, err: new Error("Failed to import AES Key")};

        let keyObject = key.data as Key;
        let kAES = new KeyAES(keyObject.name);
        kAES.length = length;
        return {data: kAES, err: null};
    }

    static exportKey(keyName: string): Result<ArrayBuffer, Error>
    {
        return CryptoImpl.exportKey(keyName, "raw");
    }
}

