/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { CryptoImpl } from './crypto_impl';

export class CryptoSHA {

    static isValidAlgorithm(algorithm: string): boolean {
        if (algorithm != "sha2-256" && algorithm != "sha2_256" && algorithm != "sha256" &&
            algorithm != "sha2-384" && algorithm != "sha2_384" && algorithm != "sha384" &&
            algorithm != "sha2-512" && algorithm != "sha2_512" && algorithm != "sha512" &&
            algorithm != "sha3-256" && algorithm != "sha3_256" && 
            algorithm != "sha3-384" && algorithm != "sha3_384" && 
            algorithm != "sha3-512" && algorithm != "sha3_512")
            return false;
        return true;
    }

    static digestSize(algorithm: string): number {
        switch (algorithm)
        {
        case "sha3-256": 
        case "sha3_256": 
        case "sha2-256": 
        case "sha2_256": 
        case "sha256": 
            return 32;
        case "sha3-384": 
        case "sha3_384": 
        case "sha2-384": 
        case "sha2_384": 
        case "sha384": 
            return 48;
        case "sha3-512": 
        case "sha3_512": 
        case "sha2-512": 
        case "sha2_512": 
        case "sha512": 
            return 64;
        default:            
            break;
        }        
        return 0;
    }

    static digest(algorithm: string, hash_info: string, data: string): u8[]
    {        
        let ret: u8[] = [];
        if (!this.isValidAlgorithm(algorithm))
            return ret;

        return CryptoImpl.digest(algorithm, hash_info, data);
    }
}
