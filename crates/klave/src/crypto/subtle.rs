use serde::{Deserialize, Serialize};
/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
use std::fmt::Display;
// use crate::sdk;

use super::sdk_wrapper::CryptoImpl;
use super::sdk_wrapper::VerifySignResult;
use super::subtle_idl_v1::HmacSignatureMetadata;
use super::subtle_idl_v1::{
    AesGcmEncryptionMetadata, AesKwWrappingMetadata, EcdsaSignatureMetadata,
    RsaOaepEncryptionMetadata, RsaPssSignatureMetadata,
};
use super::subtle_idl_v1_enums::{
    DerivationAlgorithm, DerivedKeyUsageAlgorithm, EncryptionAlgorithm, HashAlgorithm,
    KeyAlgorithm, SigningAlgorithm, WrappingAlgorithm,
};
use super::util;

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct CryptoKey {
    pub id: String,
    pub alias: Option<String>,
    #[serde(rename = "type")]
    pub key_type: String,
    pub extractable: bool,
    pub family: String,
    pub usages: Vec<String>,
    pub algorithm: String,
}

impl Display for CryptoKey {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "CryptoKey: name: {}, algorithm: {}, extractable: {}, usages: {}",
            self.id,
            self.algorithm,
            self.extractable,
            self.usages.join(", ")
        )
    }
}

impl CryptoKey {
    pub fn new(
        id: &str,
        key_type: &str,
        extractable: bool,
        usages: Vec<String>,
        algorithm: &str,
    ) -> CryptoKey {
        CryptoKey {
            id: id.to_string(),
            alias: None,
            key_type: key_type.to_string(),
            extractable,
            family: "".to_string(),
            usages,
            algorithm: algorithm.to_string(),
        }
    }

    pub fn name(self) -> String {
        self.id
    }
}

#[derive(Deserialize, Serialize)]
pub struct KeyPersistParams {
    key_id: String,
    key_name: String,
    key_type: String,
}

#[derive(Deserialize, Serialize)]
pub struct AesKeyGenParams {
    pub length: u32,
}

impl Default for AesKeyGenParams {
    fn default() -> Self {
        AesKeyGenParams { length: 256 }
    }
}

#[derive(Deserialize, Serialize)]
pub struct RsaHashedKeyGenParams {
    pub modulus_length: u32,
    pub public_exponent: u32,
    pub hash: String,
}

impl Default for RsaHashedKeyGenParams {
    fn default() -> Self {
        RsaHashedKeyGenParams {
            modulus_length: 2048,
            public_exponent: 65537,
            hash: "SHA-256".to_string(),
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct EcKeyGenParams {
    pub named_curve: String,
}

impl Default for EcKeyGenParams {
    fn default() -> Self {
        EcKeyGenParams {
            named_curve: "P-256".to_string(),
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct HmacKeyGenParams {
    pub hash: String,
}

impl Default for HmacKeyGenParams {
    fn default() -> Self {
        HmacKeyGenParams {
            hash: "SHA2-256".to_string(),
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct AesGcmParams {
    pub iv: Vec<u8>,
    pub additional_data: Vec<u8>,
    pub tag_length: u32,
}

impl Default for AesGcmParams {
    fn default() -> Self {
        AesGcmParams {
            iv: vec![],
            additional_data: vec![],
            tag_length: 128,
        }
    }
}

#[derive(Default, Deserialize, Serialize)]
pub struct RsaOaepParams {
    pub label: Vec<u8>,
}

#[derive(Default, Deserialize, Serialize)]
pub struct RsaPssParams {
    pub salt_length: u32,
}

#[derive(Deserialize, Serialize)]
pub struct HmacParams {
    pub hash: String,
}

impl Default for HmacParams {
    fn default() -> Self {
        HmacParams {
            hash: "SHA2-256".to_string(),
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct EcdsaParams {
    pub hash: String,
}

impl Default for EcdsaParams {
    fn default() -> Self {
        EcdsaParams {
            hash: "SHA2-256".to_string(),
        }
    }
}

#[derive(Deserialize, Serialize)]
pub enum KeyGenAlgorithm {
    Rsa(RsaHashedKeyGenParams),
    Ecc(EcKeyGenParams),
    Aes(AesKeyGenParams),
    Hmac(HmacKeyGenParams),
}

#[derive(Deserialize, Serialize)]
pub enum EncryptAlgorithm {
    RsaOaep(RsaOaepParams),
    AesGcm(AesGcmParams),
}

#[derive(Deserialize, Serialize)]
pub enum SignAlgorithm {
    Ecdsa(EcdsaParams),
    RsaPss(RsaPssParams),
    Hmac(HmacParams),
}

#[derive(Deserialize, Serialize)]
pub enum KeyWrapAlgorithm {
    RsaOaep(RsaOaepParams),
    AesGcm(AesGcmParams),
    AesKw,
}

#[derive(Deserialize, Serialize)]
pub struct EcdhDerivParams {
    pub public: CryptoKey,
}

#[derive(Deserialize, Serialize)]
pub struct HkdfDerivParams {
    pub salt: Vec<u8>,
    pub info: Vec<u8>,
    pub hash: String,
}

#[derive(Deserialize, Serialize)]
pub enum KeyDerivationAlgorithm {
    Ecdh(EcdhDerivParams),
    Hkdf(HkdfDerivParams),
}

#[derive(Deserialize, Serialize)]
pub enum DerivedKeyAlgorithm {
    Aes(AesKeyGenParams),
    Hmac(HmacKeyGenParams),
}

pub fn generate_key(
    algorithm: &KeyGenAlgorithm,
    extractable: bool,
    usages: &[&str],
) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    match algorithm {
        KeyGenAlgorithm::Rsa(params) => {
            let rsa_metadata = util::get_rsa_metadata(params)?;

            let key = CryptoImpl::generate_key(
                "",
                KeyAlgorithm::Rsa as u32,
                &serde_json::to_string(&rsa_metadata)?,
                extractable,
                usages,
            )?;

            let crypto_key_json = String::from_utf8(key)?;
            let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
            Ok(crypto_key)
        }
        KeyGenAlgorithm::Ecc(params) => {
            let named_curve = params.named_curve.as_str();
            match named_curve {
                "P-256" | "P-384" | "P-521" => {
                    let secpr1_metadata = util::get_secpr1_metadata(params)?;
                    let str_secpr1_metadata = match serde_json::to_string(&secpr1_metadata) {
                        Ok(str_secpr1_metadata) => str_secpr1_metadata,
                        Err(e) => {
                            return Err(e.into());
                        }
                    };
                    let key = CryptoImpl::generate_key(
                        "",
                        KeyAlgorithm::SecpR1 as u32,
                        &str_secpr1_metadata,
                        extractable,
                        usages,
                    )?;
                    let crypto_key_json = String::from_utf8(key)?;
                    let crypto_key: CryptoKey = match serde_json::from_str(&crypto_key_json) {
                        Ok(crypto_key) => crypto_key,
                        Err(e) => return Err(e.into()),
                    };
                    Ok(crypto_key)
                }
                "secp256k1" | "SECP256K1" => {
                    let secpk1_metadata = match util::get_secpk1_metadata(params) {
                        Ok(secpk1_metadata) => secpk1_metadata,
                        Err(e) => {
                            return Err(e);
                        }
                    };
                    let str_secpk1_metadata = match serde_json::to_string(&secpk1_metadata) {
                        Ok(str_secpk1_metadata) => str_secpk1_metadata,
                        Err(e) => {
                            return Err(e.into());
                        }
                    };
                    let key = CryptoImpl::generate_key(
                        "",
                        KeyAlgorithm::SecpK1 as u32,
                        &str_secpk1_metadata,
                        extractable,
                        usages,
                    )?;
                    let crypto_key_json = String::from_utf8(key)?;
                    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
                    Ok(crypto_key)
                }
                _ => Err("Invalid curve name".into()),
            }
        }
        KeyGenAlgorithm::Aes(params) => {
            let aes_metadata = match util::get_aes_metadata(params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            let str_aes_metadata = match serde_json::to_string(&aes_metadata) {
                Ok(str_aes_metadata) => str_aes_metadata,
                Err(e) => {
                    return Err(e.into());
                }
            };
            let key = CryptoImpl::generate_key(
                "",
                KeyAlgorithm::Aes as u32,
                &str_aes_metadata,
                extractable,
                usages,
            )?;
            let crypto_key_json = String::from_utf8(key)?;
            let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
            Ok(crypto_key)
        }
        KeyGenAlgorithm::Hmac(params) => {
            let hmac_metadata = match util::get_hmac_metadata(params) {
                Ok(hmac_metadata) => hmac_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            let str_hmac_metadata = match serde_json::to_string(&hmac_metadata) {
                Ok(str_hmac_metadata) => str_hmac_metadata,
                Err(e) => {
                    return Err(e.into());
                }
            };
            let key = CryptoImpl::generate_key(
                "",
                KeyAlgorithm::Hmac as u32,
                &str_hmac_metadata,
                extractable,
                usages,
            )?;
            let crypto_key_json = String::from_utf8(key)?;
            let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
            Ok(crypto_key)
        }
    }
}

pub fn encrypt(
    algorithm: &EncryptAlgorithm,
    key: &CryptoKey,
    clear_text: &[u8],
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if clear_text.is_empty() {
        return Err("Invalid clear text".into());
    }
    let key_name = &key.id;
    match algorithm {
        EncryptAlgorithm::RsaOaep(params) => {
            let metadata = RsaOaepEncryptionMetadata {
                label: params.label.clone(),
            };
            let result = CryptoImpl::encrypt(
                key_name,
                EncryptionAlgorithm::RsaOaep as u32,
                &serde_json::to_string(&metadata)?,
                clear_text,
            )?;
            Ok(result)
        }
        EncryptAlgorithm::AesGcm(params) => {
            let tag_length = util::get_aes_tag_length(&params.tag_length)?;
            let metadata = AesGcmEncryptionMetadata {
                iv: params.iv.clone(),
                additional_data: params.additional_data.clone(),
                tag_length,
            };
            let result = CryptoImpl::encrypt(
                key_name,
                EncryptionAlgorithm::AesGcm as u32,
                &serde_json::to_string(&metadata)?,
                clear_text,
            )?;
            Ok(result)
        }
    }
}

pub fn decrypt(
    algorithm: &EncryptAlgorithm,
    key: &CryptoKey,
    cipher_text: &[u8],
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if cipher_text.is_empty() {
        return Err("Invalid cipher_text text".into());
    }
    let key_name = &key.id;
    match algorithm {
        EncryptAlgorithm::RsaOaep(params) => {
            let metadata = RsaOaepEncryptionMetadata {
                label: params.label.clone(),
            };
            let result = CryptoImpl::decrypt(
                key_name,
                EncryptionAlgorithm::RsaOaep as u32,
                &serde_json::to_string(&metadata)?,
                cipher_text,
            )?;
            Ok(result)
        }
        EncryptAlgorithm::AesGcm(params) => {
            let tag_length = util::get_aes_tag_length(&params.tag_length)?;
            let metadata = AesGcmEncryptionMetadata {
                iv: params.iv.clone(),
                additional_data: params.additional_data.clone(),
                tag_length,
            };
            let result = CryptoImpl::decrypt(
                key_name,
                EncryptionAlgorithm::AesGcm as u32,
                &serde_json::to_string(&metadata)?,
                cipher_text,
            )?;
            Ok(result)
        }
    }
}

pub fn sign(
    algorithm: &SignAlgorithm,
    key: &CryptoKey,
    data: &[u8],
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Invalid data".into());
    }
    let key_name = &key.id;
    match algorithm {
        SignAlgorithm::RsaPss(params) => {
            let metadata = RsaPssSignatureMetadata {
                salt_length: params.salt_length as u64,
            };
            let result = CryptoImpl::sign(
                key_name,
                SigningAlgorithm::RsaPss as u32,
                &serde_json::to_string(&metadata)?,
                data,
            )?;
            Ok(result)
        }
        SignAlgorithm::Ecdsa(params) => {
            let sha_metadata = util::get_sha_metadata(&params.hash)?;
            let metadata = EcdsaSignatureMetadata { sha_metadata };
            let result = CryptoImpl::sign(
                key_name,
                SigningAlgorithm::Ecdsa as u32,
                &serde_json::to_string(&metadata)?,
                data,
            )?;
            Ok(result)
        }
        SignAlgorithm::Hmac(params) => {
            let sha_metadata = util::get_sha_metadata(&params.hash)?;
            let metadata = HmacSignatureMetadata { sha_metadata };
            let result = CryptoImpl::sign(
                key_name,
                SigningAlgorithm::Hmac as u32,
                &serde_json::to_string(&metadata)?,
                data,
            )?;
            Ok(result)
        }
    }
}

pub fn verify(
    algorithm: &SignAlgorithm,
    key: &CryptoKey,
    data: &[u8],
    signature: &[u8],
) -> Result<VerifySignResult, Box<dyn std::error::Error>> {
    if signature.is_empty() || data.is_empty() {
        return Err("Invalid signature or data".into());
    }
    let key_name = &key.id;
    match algorithm {
        SignAlgorithm::RsaPss(params) => {
            let metadata = RsaPssSignatureMetadata {
                salt_length: params.salt_length as u64,
            };
            let result = CryptoImpl::verify(
                key_name,
                SigningAlgorithm::RsaPss as u32,
                &serde_json::to_string(&metadata)?,
                data,
                signature,
            )?;
            Ok(result)
        }
        SignAlgorithm::Ecdsa(params) => {
            let sha_metadata = util::get_sha_metadata(&params.hash)?;
            let metadata = EcdsaSignatureMetadata { sha_metadata };
            let result = CryptoImpl::verify(
                key_name,
                SigningAlgorithm::Ecdsa as u32,
                &serde_json::to_string(&metadata)?,
                data,
                signature,
            )?;
            Ok(result)
        }
        SignAlgorithm::Hmac(params) => {
            let sha_metadata = util::get_sha_metadata(&params.hash)?;
            let metadata = HmacSignatureMetadata { sha_metadata };
            let result = CryptoImpl::verify(
                key_name,
                SigningAlgorithm::Hmac as u32,
                &serde_json::to_string(&metadata)?,
                data,
                signature,
            )?;
            Ok(result)
        }
    }
}

pub fn digest(algorithm: &str, data: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Invalid data".into());
    }
    let sha_metadata = util::get_sha_metadata(algorithm)?;
    let result = CryptoImpl::digest(
        HashAlgorithm::Sha as u32,
        &serde_json::to_string(&sha_metadata)?,
        data,
    )?;
    Ok(result)
}

pub fn import_key(
    format: &str,
    key_data: &[u8],
    algorithm: &KeyGenAlgorithm,
    extractable: bool,
    usages: &[&str],
) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    let algo_metadata: String;
    let algo_id: KeyAlgorithm;

    let key_format = util::get_key_format(format)?;

    if key_data.is_empty() {
        return Err("Invalid key data".into());
    }

    match algorithm {
        KeyGenAlgorithm::Rsa(params) => {
            let rsa_metadata = util::get_rsa_metadata(params)?;
            algo_metadata = serde_json::to_string(&rsa_metadata)?;
            algo_id = KeyAlgorithm::Rsa;
        }
        KeyGenAlgorithm::Ecc(params) => {
            let named_curve = params.named_curve.as_str();
            match named_curve {
                "P-256" | "P-384" | "P-521" => {
                    let secpr1_metadata = util::get_secpr1_metadata(params)?;
                    algo_metadata = serde_json::to_string(&secpr1_metadata)?;
                    algo_id = KeyAlgorithm::SecpR1;
                }
                "secp256k1" | "SECP256K1" => {
                    let secpk1_metadata = util::get_secpk1_metadata(params)?;
                    algo_metadata = serde_json::to_string(&secpk1_metadata)?;
                    algo_id = KeyAlgorithm::SecpK1;
                }
                _ => return Err("Invalid curve name".into()),
            }
        }
        KeyGenAlgorithm::Aes(params) => {
            let aes_metadata = match util::get_aes_metadata(params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            algo_metadata = serde_json::to_string(&aes_metadata)?;
            algo_id = KeyAlgorithm::Aes;
        }
        KeyGenAlgorithm::Hmac(params) => {
            let hmac_metadata = match util::get_hmac_metadata(params) {
                Ok(hmac_metadata) => hmac_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            algo_metadata = serde_json::to_string(&hmac_metadata)?;
            algo_id = KeyAlgorithm::Hmac;
        }
    }

    let result = CryptoImpl::import_key(
        key_format as u32,
        key_data,
        algo_id as u32,
        &algo_metadata,
        extractable,
        usages,
        "",
    )?;

    let crypto_key_json = String::from_utf8(result)?;
    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
    Ok(crypto_key)
}

pub fn wrap_key(
    format: &str,
    key: &CryptoKey,
    wrapping_key: &CryptoKey,
    algorithm: &KeyWrapAlgorithm,
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let key_format = util::get_key_format(format)?;
    let key_name = &key.id;
    let wrapping_key_name = &wrapping_key.id;

    if key_name.is_empty() || wrapping_key_name.is_empty() {
        return Err("Invalid key".into());
    }

    match algorithm {
        KeyWrapAlgorithm::RsaOaep(params) => {
            let metadata = RsaOaepEncryptionMetadata {
                label: params.label.clone(),
            };
            let result = CryptoImpl::wrap_key(
                wrapping_key_name,
                EncryptionAlgorithm::RsaOaep as u32,
                &serde_json::to_string(&metadata)?,
                key_name,
                key_format as u32,
            )?;
            Ok(result)
        }
        KeyWrapAlgorithm::AesGcm(params) => {
            let tag_length = util::get_aes_tag_length(&params.tag_length)?;
            let metadata = AesGcmEncryptionMetadata {
                iv: params.iv.clone(),
                additional_data: params.additional_data.clone(),
                tag_length,
            };
            let result = CryptoImpl::wrap_key(
                wrapping_key_name,
                EncryptionAlgorithm::AesGcm as u32,
                &serde_json::to_string(&metadata)?,
                key_name,
                key_format as u32,
            )?;
            Ok(result)
        }
        KeyWrapAlgorithm::AesKw => {
            let metadata = AesKwWrappingMetadata { with_padding: true };
            let result = CryptoImpl::wrap_key(
                wrapping_key_name,
                WrappingAlgorithm::AesKw as u32,
                &serde_json::to_string(&metadata)?,
                key_name,
                key_format as u32,
            )?;
            Ok(result)
        }
    }
}

pub fn unwrap_key(
    format: &str,
    wrapped_key: &[u8],
    unwrapping_key: &CryptoKey,
    unwrap_algorithm: &KeyWrapAlgorithm,
    unwrapped_key_algorithm: &KeyGenAlgorithm,
    extractable: bool,
    usages: &[&str],
) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    let key_format = util::get_key_format(format)?;

    if wrapped_key.is_empty() {
        return Err("Invalid wrapped key".into());
    }

    let unwrapping_key_name = &unwrapping_key.id;
    if unwrapping_key_name.is_empty() {
        return Err("Invalid key".into());
    }

    let wrapping_algo_metadata: String;
    let wrapping_algo_id: WrappingAlgorithm;

    match unwrap_algorithm {
        KeyWrapAlgorithm::RsaOaep(params) => {
            let metadata = RsaOaepEncryptionMetadata {
                label: params.label.clone(),
            };
            wrapping_algo_metadata = serde_json::to_string(&metadata)?;
            wrapping_algo_id = WrappingAlgorithm::RsaOaep;
        }
        KeyWrapAlgorithm::AesGcm(params) => {
            let tag_length = util::get_aes_tag_length(&params.tag_length)?;
            let metadata = AesGcmEncryptionMetadata {
                iv: params.iv.clone(),
                additional_data: params.additional_data.clone(),
                tag_length,
            };
            wrapping_algo_metadata = serde_json::to_string(&metadata)?;
            wrapping_algo_id = WrappingAlgorithm::AesGcm;
        }
        KeyWrapAlgorithm::AesKw => {
            let metadata = AesKwWrappingMetadata { with_padding: true };
            wrapping_algo_metadata = serde_json::to_string(&metadata)?;
            wrapping_algo_id = WrappingAlgorithm::AesKw;
        }
    }

    let key_gen_algo_metadata: String;
    let key_gen_algo_id: KeyAlgorithm;

    match unwrapped_key_algorithm {
        KeyGenAlgorithm::Rsa(params) => {
            let rsa_metadata = util::get_rsa_metadata(params)?;
            key_gen_algo_metadata = serde_json::to_string(&rsa_metadata)?;
            key_gen_algo_id = KeyAlgorithm::Rsa;
        }
        KeyGenAlgorithm::Ecc(params) => {
            let named_curve = params.named_curve.as_str();
            match named_curve {
                "P-256" | "P-384" | "P-521" => {
                    let secpr1_metadata = util::get_secpr1_metadata(params)?;
                    key_gen_algo_metadata = serde_json::to_string(&secpr1_metadata)?;
                    key_gen_algo_id = KeyAlgorithm::SecpR1;
                }
                "secp256k1" | "SECP256K1" => {
                    let secpk1_metadata = util::get_secpk1_metadata(params)?;
                    key_gen_algo_metadata = serde_json::to_string(&secpk1_metadata)?;
                    key_gen_algo_id = KeyAlgorithm::SecpK1;
                }
                _ => return Err("Invalid curve name".into()),
            }
        }
        KeyGenAlgorithm::Aes(params) => {
            let aes_metadata = match util::get_aes_metadata(params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            key_gen_algo_metadata = serde_json::to_string(&aes_metadata)?;
            key_gen_algo_id = KeyAlgorithm::Aes;
        }
        KeyGenAlgorithm::Hmac(params) => {
            let hmac_metadata = match util::get_hmac_metadata(params) {
                Ok(hmac_metadata) => hmac_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            key_gen_algo_metadata = serde_json::to_string(&hmac_metadata)?;
            key_gen_algo_id = KeyAlgorithm::Hmac;
        }
    }

    let result = CryptoImpl::unwrap_key(
        unwrapping_key_name,
        wrapping_algo_id as u32,
        &wrapping_algo_metadata,
        key_format as u32,
        wrapped_key,
        key_gen_algo_id as u32,
        &key_gen_algo_metadata,
        extractable,
        usages,
    )?;
    let crypto_key_json = String::from_utf8(result)?;
    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
    Ok(crypto_key)
}

pub fn export_key(format: &str, key: &CryptoKey) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if key.id.is_empty() {
        return Err("Invalid key".into());
    }
    let key_name = &key.id;
    let key_format = util::get_key_format(format)?;
    let result = CryptoImpl::export_key(key_name, key_format as u32)?;
    Ok(result)
}

pub fn get_public_key(key: &CryptoKey) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    if key.id.is_empty() {
        return Err("Invalid key".into());
    }
    let key_name = &key.id;

    let key_type = key.key_type.as_str();
    match key_type {
        "secret" | "aes" => {
            return Err("Invalid key type: AES symmetric key cannot have public key".into())
        }
        "public" => return Err("Invalid key type".into()),
        _ => (),
    };

    let crypto_key_json = CryptoImpl::get_public_key_as_crypto_key(key_name)?;

    let crypto_key: CryptoKey = match serde_json::from_str(&crypto_key_json) {
        Ok(crypto_key) => crypto_key,
        Err(e) => return Err(e.into()),
    };

    Ok(crypto_key)
}

pub fn derive_key(
    derivation_algorithm: &KeyDerivationAlgorithm,
    base_key: &CryptoKey,
    derived_key_algorithm: &DerivedKeyAlgorithm,
    extractable: bool,
    usages: &[&str],
) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    if base_key.id.is_empty() {
        return Err("Invalid key".into());
    }
    let base_key_name = &base_key.id;

    let derivation_algo_metadata: String;
    let derivation_algo_id: DerivationAlgorithm;

    match derivation_algorithm {
        KeyDerivationAlgorithm::Ecdh(params) => {
            derivation_algo_metadata = match util::get_ecdh_metadata(params) {
                Ok(result) => serde_json::to_string(&result)?,
                Err(e) => return Err(e),
            };
            derivation_algo_id = DerivationAlgorithm::Ecdh;
        }
        KeyDerivationAlgorithm::Hkdf(params) => {
            derivation_algo_metadata = match util::get_hkdf_metadata(params) {
                Ok(result) => serde_json::to_string(&result)?,
                Err(e) => return Err(e),
            };
            derivation_algo_id = DerivationAlgorithm::Hkdf;
        }
    }

    let derived_key_algo_metadata: String;
    let derived_key_algo_id: DerivedKeyUsageAlgorithm;
    match derived_key_algorithm {
        DerivedKeyAlgorithm::Aes(params) => {
            let aes_metadata = match util::get_aes_metadata(params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            derived_key_algo_metadata = match serde_json::to_string(&aes_metadata) {
                Ok(result) => result,
                Err(e) => {
                    return Err(e.into());
                }
            };
            derived_key_algo_id = DerivedKeyUsageAlgorithm::Aes;
        }
        DerivedKeyAlgorithm::Hmac(params) => {
            let hmac_metadata = match util::get_hmac_metadata(params) {
                Ok(hmac_metadata) => hmac_metadata,
                Err(e) => {
                    return Err(e);
                }
            };
            derived_key_algo_metadata = match serde_json::to_string(&hmac_metadata) {
                Ok(result) => result,
                Err(e) => {
                    return Err(e.into());
                }
            };
            derived_key_algo_id = DerivedKeyUsageAlgorithm::Hmac;
        }
    }

    let crypto_key_json = CryptoImpl::derive_key(
        derivation_algo_id as u32,
        &derivation_algo_metadata,
        derived_key_algo_id as u32,
        &derived_key_algo_metadata,
        extractable,
        usages,
        base_key_name,
    )?;

    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json)?;
    Ok(crypto_key)
}

pub fn save_key(
    key: &CryptoKey,
    key_persisted_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    if key.id.is_empty() {
        return Err("Invalid key".into());
    }
    if key_persisted_name.is_empty() {
        return Err("Invalid key name: cannot be null or empty".into());
    }
    let existing_key = CryptoImpl::key_exists(key_persisted_name)?;

    if existing_key {
        return Err(
            format!("Invalid key name: key name {key_persisted_name} already exists").into(),
        );
    }

    let params = KeyPersistParams {
        key_id: key.id.clone(),
        key_name: key_persisted_name.to_string(),
        key_type: key.key_type.clone(),
    };
    match CryptoImpl::persist_key(&serde_json::to_string(&params)?.into_bytes()) {
        Ok(_) => (),
        Err(e) => return Err(e),
    };
    Ok(())
}

pub fn load_key(key_name: &str) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    if key_name.is_empty() {
        return Err("Invalid key name: cannot be null or empty".into());
    }
    let key_json = CryptoImpl::load_key(key_name)?;
    let crypto_key: CryptoKey = serde_json::from_str(&key_json)?;
    Ok(crypto_key)
}

pub fn delete_key(key: &CryptoKey) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(alias) = &key.alias {
        if alias.is_empty() {
            return Err("Invalid key name: cannot be null or empty".into());
        }
        match CryptoImpl::delete_key(alias) {
            Ok(_) => (),
            Err(e) => return Err(e),
        };
        Ok(())
    } else {
        Err("Invalid key name: cannot be null or empty".into())
    }
}
