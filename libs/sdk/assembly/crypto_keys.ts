/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

import { encode as b64encode } from 'as-base64/assembly';

export class PublicKey {

    bytes: u8[];

    constructor(bytes: u8[]) {
        this.bytes = bytes;
    }

    getPem(): string {
        const buffer = new Uint8Array(this.bytes.length);        
        buffer.set(this.bytes);        
        const pem = `-----BEGIN PUBLIC KEY-----
${b64encode(buffer)}
-----END PUBLIC KEY-----`;
        return pem;
    }
}

export class PrivateKey {

    bytes: u8[];

    constructor(bytes: u8[]) {
        this.bytes = bytes;
    }

    getPem(): string {
        const buffer = new Uint8Array(this.bytes.length);
        buffer.set(this.bytes);
        const pem = `-----BEGIN PRIVATE KEY-----
${b64encode(buffer)}
-----END PRIVATE KEY-----`;
        return pem;
    }
}

@JSON
export class SimpleKeyPair {
    privateKey: string | null = null;
    publicKey: string | null = null;
}
