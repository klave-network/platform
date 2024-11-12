/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { Result} from '../index';
import { SubtleCrypto } from './crypto_subtle';

export class CryptoSHA {

    static digest(algorithm: string, data: ArrayBuffer): Result<ArrayBuffer, Error>
    {
        return SubtleCrypto.digest(algorithm, data);
    }
}
