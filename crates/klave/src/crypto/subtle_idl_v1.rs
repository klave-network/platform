use super::subtle_idl_v1_enums::{
    AesKeyBitsize, AesTagLength, DerivationAlgorithm, DerivedKeyUsageAlgorithm,
    EncryptionAlgorithm, HashAlgorithm, KeyAlgorithm, RsaKeyBitsize, SecpK1KeyBitsize,
    SecpR1KeyBitsize, ShaAlgorithm, ShaDigestBitsize, SigningAlgorithm, TaggedShaAlgorithm,
    WrappingAlgorithm,
};
/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct KeyGenerationInfo {
    algo_id: KeyAlgorithm,
    algo_metadata: String,
}

#[derive(Deserialize, Serialize)]
pub struct ShaMetadata {
    pub algo_id: ShaAlgorithm,
    pub length: ShaDigestBitsize,
}

#[derive(Deserialize, Serialize)]
pub struct TaggedShaMetadata {
    algo_id: TaggedShaAlgorithm,
    length: ShaDigestBitsize,
    tag: String,
}

#[derive(Deserialize, Serialize)]
pub struct HmacMetadata {
    pub sha_metadata: ShaMetadata,
    pub length: u32,
}

#[derive(Deserialize, Serialize)]
pub struct SecpR1Metadata {
    pub length: SecpR1KeyBitsize,
}

#[derive(Deserialize, Serialize)]
pub struct SecpK1Metadata {
    pub length: SecpK1KeyBitsize,
}

#[derive(Deserialize, Serialize)]
pub struct AesMetadata {
    pub length: AesKeyBitsize,
}

#[derive(Deserialize, Serialize)]
pub struct HashInfo {
    algo_id: HashAlgorithm,
    algo_metadata: String,
}

#[derive(Deserialize, Serialize)]
pub struct RsaMetadata {
    pub modulus: RsaKeyBitsize,
    pub public_exponent: u32,
    pub sha_metadata: ShaMetadata,
}

#[derive(Deserialize, Serialize)]
pub struct SchnorrSignatureMetadata {
    tagged_sha_metadata: TaggedShaMetadata,
}

#[derive(Deserialize, Serialize)]
pub struct EcdsaSignatureMetadata {
    pub sha_metadata: ShaMetadata,
}

#[derive(Deserialize, Serialize)]
pub struct RsaPssSignatureMetadata {
    #[serde(rename = "saltLength")]
    pub salt_length: u64,
}

#[derive(Deserialize, Serialize)]
pub struct SignatureInfo {
    algo_id: SigningAlgorithm,
    algo_metadata: String,
}

#[derive(Deserialize, Serialize)]
pub struct AesGcmEncryptionMetadata {
    pub iv: Vec<u8>,
    #[serde(rename = "additionalData")]
    pub additional_data: Vec<u8>,
    #[serde(rename = "tagLength")]
    pub tag_length: AesTagLength,
}

#[derive(Deserialize, Serialize)]
pub struct RsaOaepEncryptionMetadata {
    pub label: Vec<u8>,
}

#[derive(Deserialize, Serialize)]
pub struct RsaPkcs1V1_5EncryptionMetadata {
    label: Vec<u8>,
}

#[derive(Deserialize, Serialize)]
pub struct EncryptionInfo {
    algo_id: EncryptionAlgorithm,
    algo_metadata: String,
}

#[derive(Deserialize, Serialize)]
pub struct AesKwWrappingMetadata {
    pub with_padding: bool,
}

#[derive(Deserialize, Serialize)]
pub struct WrappingInfo {
    algo_id: WrappingAlgorithm,
    algo_metadata: String,
}

#[derive(Deserialize, Serialize)]
pub struct EcdhMetadata {
    pub public_key: String,
}

#[derive(Deserialize, Serialize)]
pub struct HkdfMetadata {
    pub salt: Vec<u8>,
    pub info: Vec<u8>,
    pub hash_info: ShaMetadata,
}

#[derive(Deserialize, Serialize)]
pub struct DerivationInfo {
    algo_id: DerivationAlgorithm,
    algo_metadata: String,
}

#[derive(Deserialize, Serialize)]
pub struct DerivedKeyUsageInfo {
    algo_id: DerivedKeyUsageAlgorithm,
    algo_metadata: String,
}
