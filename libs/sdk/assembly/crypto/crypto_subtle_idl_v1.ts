/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

export enum key_algorithm {
    secp_r1 = 0,
    secp_k1 = 1,
    aes = 2,
    rsa = 3
}

@json
export class key_generation_info {
    algo_id!: key_algorithm;
    algo_metadata!: string;
}

export enum hash_algorithm {
    sha,
    tagged
    //hmac,
    //hkdf,
    //pbkdf2
    //etc
}

export enum sha_algorithm {
    none,
    sha2,
    sha3
}

export enum tagged_sha_algorithm {
    none,
    sha2,
    sha3
}

//Assumption is that we will always support the same digest size whether using sha2 or sha3
export enum sha_digest_bitsize {
    SHA_256 = 256,
    SHA_384 = 384,
    SHA_512 = 512
}

@json
export class sha_metadata {
    algo_id!: sha_algorithm;
    length!: sha_digest_bitsize;
}

@json
export class tagged_sha_metadata {
    algo_id!: tagged_sha_algorithm;
    length!: sha_digest_bitsize;
    tag!: string;
}

export enum secp_r1_key_bitsize {
    SECP_R1_256 = 256,
    SECP_R1_384 = 384,
    SECP_R1_521 = 521
}

@json
export class secp_r1_metadata {
    length!: secp_r1_key_bitsize;
}

export enum secp_k1_key_bitsize {
    SECP_K1_256 = 256
}

@json
export class secp_k1_metadata {
    length!: secp_k1_key_bitsize;
}

export enum aes_key_bitsize {
    AES_128 = 128,
    AES_192 = 192,
    AES_256 = 256
}

@json
export class aes_metadata {
    length!: aes_key_bitsize;
}

@json
export class hash_info {
    algo_id!: hash_algorithm;
    algo_metadata!: string;
}

export enum rsa_key_bitsize {
    RSA_2048 = 2048,
    RSA_3072 = 3072,
    RSA_4096 = 4096
}

@json
export class rsa_metadata {
    modulus!: rsa_key_bitsize;
    public_exponent!: u32;
    sha_metadata!: sha_metadata;
}

export enum subtle_key_usage {
    encrypt = 0,
    decrypt = 1,
    sign = 2,
    verify = 3,
    derive_key = 4,
    derive_bits = 5,
    wrap_key = 6,
    unwrap_key = 7
}

export enum encryption_algorithm {
    aes_gcm,
    rsa_oaep,
    rsa_pkcs1_v1_5
}

export enum wrapping_algorithm {
    aes_kw,
    aes_gcm,
    rsa_oaep,
    rsa_pkcs1_v1_5
}

export enum aes_tag_length {
    TAG_96 = 12,
    TAG_104 = 13,
    TAG_112 = 14,
    TAG_120 = 15,
    TAG_128 = 16
}

export enum signing_algorithm {
    ecdsa,
    schnorr,
    rsa_pss
}

@json
export class schnorr_signature_metadata {
    tagged_sha_metadata!: tagged_sha_metadata;
}

@json
export class ecdsa_signature_metadata {
    sha_metadata!: sha_metadata;
}

@json
export class rsa_pss_signature_metadata {
    saltLength!: u64;
}

@json
export class signature_info {
    algo_id!: signing_algorithm;
    algo_metadata!: string;
}

@json
export class aes_gcm_encryption_metadata {
    iv!: Array<u8>;
    additionalData!: Array<u8>;
    tagLength!: aes_tag_length;
}

@json
export class rsa_oaep_encryption_metadata {
    label!: Array<u8>;
}

@json
export class rsa_pkcs1_v1_5_encryption_metadata {
    label!: Array<u8>;
}

@json
export class encryption_info {
    algo_id!: encryption_algorithm;
    algo_metadata!: string;
}

@json
export class aes_kw_wrapping_metadata {
    with_padding!: boolean;
}

@json
export class wrapping_info {
    algo_id!: wrapping_algorithm;
    algo_metadata!: string;
}

//this is a bit mask so there are some helper functions to manipulate and interrogate this type
export enum key_usage {
    none = 0,
    encrypt = 1,
    decrypt = 2,
    sign = 4,
    verify = 8,
    derive_key = 16,
    derive_bits = 32,
    wrap_key = 64,
    unwrap_key = 128
}

export enum key_format {
    raw = 0,
    spki = 1,
    pkcs8 = 2,
    jwk = 3,
    sec1 = 4,
    pkcs1 = 5
}