/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/attestation
 */

import { Result } from './index';
import { JSON } from '@klave/as-json/assembly';

// @ts-ignore: decorator
@external("env", "get_quote")
declare function get_quote(challenge: ArrayBuffer, challenge_size: i32, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "verify_quote")
declare function verify_quote(current_time: i64, quote_binary: ArrayBuffer, quote_binary_size: i32, result: ArrayBuffer, result_size: i32): i32;

@json
export class Quote {
    header!: QuoteHeader;
    @alias("report_body")
    reportBody!: ReportBody;
    @alias("signature_data")
    signatureData!: Array<u8>;
}

@json
export class QuoteHeader {
    version!: u16;
    @alias("att_key_type")
    attKeyType!: u16;
    @alias("att_key_data_0")
    attKeyData!: u32;
    @alias("qe_svn")
    qeSvn!: u16;
    @alias("pce_svn")
    pceSvn!: u16;
    @alias("vendor_id")
    vendorId!: Array<u8>;
    @alias("user_data")
    userData!: Array<u8>;
}

@json
export class ReportBody {
    @alias("cpu_svn")
    cpuSvn!: Array<u8>;
    @alias("misc_select")
    miscSelect!: u32;
    reserved1!: Array<u8>;
    @alias("isv_ext_prod_id")
    isvExtProdId!: Array<u8>;
    attributes!: QuoteAttributes;
    @alias("mr_enclave")
    mrenclave!: Array<u8>;
    reserved2!: Array<u8>;
    @alias("mr_signer")
    mrsigner!: Array<u8>;
    reserved3!: Array<u8>;
    @alias("config_id")
    configId!: Array<u8>;
    @alias("isv_prod_id")
    isvProdId!: u16;
    @alias("isv_svn")
    isvSvn!: u16;
    @alias("config_svn")
    configSvn!: u16;
    reserved4!: Array<u8>;
    @alias("isv_family_id")
    isvFamilyId!: Array<u8>;
    @alias("report_data")
    reportData!: Array<u8>;
}

@json
export class QuoteAttributes {
    flags!: u64;
    xfrm!: u64;
}

@json
export class QuoteResponse {
    quote!: Quote;
    @alias("quote_binary")
    quoteBinary!: Array<u8>;
}

@json
export class TeeSuppDataDescriptor {
    @alias("major_version")
    majorVersion!: u16;
    data!: Array<u8>;
}

@json
export class QuoteVerificationResponse {
    @alias("collateral_expiration_status")
    collateralExpirationStatus!: u32;
    @alias("quote_verification_result")
    quoteVerificationResult!: i32;
    @alias("quote_verification_result_description")
    quoteVerificationResultDescription!: string;
    @alias("sa_list")
    securityAdvisoryList!: string;
    @alias("supp_data")
    supp_data!: TeeSuppDataDescriptor;
}

export function getQuote(challenge: u8[]): Result<QuoteResponse, Error> {
    let challengeBuf = new Uint8Array(challenge.length);
    for (let i = 0; i < challenge.length; ++i) {
        challengeBuf[i] = challenge[i];
    }
    let result = new ArrayBuffer(20000);
    let res = get_quote(challengeBuf.buffer, challengeBuf.buffer.byteLength, result, result.byteLength);
    if (abs(res) > result.byteLength) {
        // buffer not big enough, retry with a properly sized one
        result = new ArrayBuffer(abs(res));
        res = get_quote(challengeBuf.buffer, challengeBuf.buffer.byteLength, result, result.byteLength);
    }
    if (res < 0)
        return { data: null, err: new Error("Failed to get quote : " + String.UTF8.decode(result.slice(0, -res))) };

    let quoteString = String.UTF8.decode(result.slice(0, res), true);
    let quote = JSON.parse<QuoteResponse>(quoteString);

    return { data: quote, err: null };
}

export function verifyQuote(current_time: i64, binaryQuote: Array<u8>): Result<QuoteVerificationResponse, Error> {
    let binaryQuoteBuf = new Uint8Array(binaryQuote.length);
    for (let i = 0; i < binaryQuote.length; ++i) {
        binaryQuoteBuf[i] = binaryQuote[i];
    }
    let result = new ArrayBuffer(2000);
    let res = verify_quote(current_time, binaryQuoteBuf.buffer, binaryQuoteBuf.buffer.byteLength, result, result.byteLength);
    if (abs(res) > result.byteLength) {
        // buffer not big enough, retry with a properly sized one
        result = new ArrayBuffer(abs(res));
        res = verify_quote(current_time, binaryQuoteBuf.buffer, binaryQuoteBuf.buffer.byteLength, result, result.byteLength);
    }
    if (res < 0)
        return { data: null, err: new Error("Failed to verify quote : " + String.UTF8.decode(result.slice(0, -res))) };

    let quoteString = String.UTF8.decode(result.slice(0, res), true);
    let quote = JSON.parse<QuoteVerificationResponse>(quoteString);
    return { data: quote, err: null };
}