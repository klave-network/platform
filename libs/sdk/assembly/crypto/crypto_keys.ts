/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { encode as b64encode } from 'as-base64/assembly';

export class PublicKey {

    bytes: Uint8Array;

    constructor(bytes: Uint8Array) {
        this.bytes = bytes;
    }

    getPem(): string {
        const pem = `-----BEGIN PUBLIC KEY-----
${b64encode(this.bytes)}
-----END PUBLIC KEY-----`;
        return pem;
    }
}

export class PrivateKey {

    bytes: Uint8Array;

    constructor(bytes: Uint8Array) {
        this.bytes = bytes;
    }

    getPem(): string {
        const pem = `-----BEGIN PRIVATE KEY-----
${b64encode(this.bytes)}
-----END PRIVATE KEY-----`;
        return pem;
    }
}
