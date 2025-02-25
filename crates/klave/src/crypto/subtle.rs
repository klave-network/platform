/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
use std::fmt::Display;
use serde::{Deserialize, Serialize};
// use crate::sdk;

use super::sdk_wrapper::CryptoImpl;
use super::subtle_idl_v1::{AesGcmEncryptionMetadata, AesKwWrappingMetadata, EcdsaSignatureMetadata, RsaOaepEncryptionMetadata, RsaPssSignatureMetadata};
use super::subtle_idl_v1_enums::{DerivationAlgorithm, DerivedKeyUsageAlgorithm, EncryptionAlgorithm, HashAlgorithm, KeyAlgorithm, SigningAlgorithm, WrappingAlgorithm};
use super::util;
use super::sdk_wrapper::VerifySignResult;


#[derive(Deserialize, Serialize)]
#[derive(Debug)]
#[derive(Clone)]
#[derive(PartialEq, Eq)]
pub struct CryptoKey {
    id: String,
    alias: Option<String>,
    #[serde(rename = "type")]
    key_type: String,
    extractable: bool,
    family: String,
    usages: Vec<String>,
    algorithm: String
}

impl Display for CryptoKey {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "CryptoKey: name: {}, algorithm: {}, extractable: {}, usages: {}", self.id, self.algorithm, self.extractable, self.usages.join(", "))
    }
}

impl CryptoKey {
    pub fn new(id: &str, key_type: &str, extractable: bool, usages: Vec<String>, algorithm: &str) -> CryptoKey {
        CryptoKey { id: id.to_string(), alias: None, key_type: key_type.to_string(), extractable: extractable, family: "".to_string(), usages: usages, algorithm: algorithm.to_string() }
    }

    pub fn name(self) -> String {
        self.id
    }
}

#[derive(Deserialize, Serialize)]
pub struct KeyPersistParams {
    key_id: String,
    key_name: String,
    key_type: String
}

#[derive(Deserialize, Serialize)]
pub struct AesKeyGenParams {
    pub length: u32
}

impl Default for AesKeyGenParams {
    fn default() -> Self {
        AesKeyGenParams {
            length: 256,
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct RsaHashedKeyGenParams {
    pub modulus_length: u32,
    pub public_exponent: u32,
    pub hash: String
}

impl Default for RsaHashedKeyGenParams {
    fn default() -> Self {
        RsaHashedKeyGenParams {
            modulus_length: 2048,
            public_exponent: 65537,
            hash: "SHA-256".to_string()
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct EcKeyGenParams {
    pub named_curve: String
}

impl Default for EcKeyGenParams {
    fn default() -> Self {
        EcKeyGenParams {
            named_curve: "P-256".to_string()
        }
    }
}

impl Default for RsaOaepEncryptionMetadata {
    fn default() -> Self {
        RsaOaepEncryptionMetadata {
            label: vec![]
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct AesGcmParams {
    pub iv: Vec<u8>,
    pub additional_data: Vec<u8>,
    pub tag_length: u32
}

impl Default for AesGcmParams {
    fn default() -> Self {
        AesGcmParams {
            iv: vec![],
            additional_data: vec![],
            tag_length: 128
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct RsaOaepParams {
    pub label: Vec<u8>
}

impl Default for RsaOaepParams {
    fn default() -> Self {
        RsaOaepParams {
            label: vec![]
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct RsaPssParams {
    pub salt_length: u32
}

impl Default for RsaPssParams {
    fn default() -> Self {
        RsaPssParams {
            salt_length: 0
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct EcdsaParams {
    pub hash: String
}

impl Default for EcdsaParams {
    fn default() -> Self {
        EcdsaParams {
            hash: "SHA2-256".to_string()
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct NamedAlgorithm {
    pub name: String
}

#[derive(Deserialize, Serialize)]
pub enum GenAlgorithm {
    RsaHashedKeyGenParams(RsaHashedKeyGenParams),
    EcKeyGenParams(EcKeyGenParams),
    AesKeyGenParams(AesKeyGenParams),
}

impl From<EcKeyGenParams> for GenAlgorithm {
    fn from(params: EcKeyGenParams) -> Self {
        GenAlgorithm::EcKeyGenParams(params)
    }
}

impl From<AesKeyGenParams> for GenAlgorithm {
    fn from(params: AesKeyGenParams) -> Self {
        GenAlgorithm::AesKeyGenParams(params)
    }
}

impl From<RsaHashedKeyGenParams> for GenAlgorithm {
    fn from(params: RsaHashedKeyGenParams) -> Self {
        GenAlgorithm::RsaHashedKeyGenParams(params)
    }
}


#[derive(Deserialize, Serialize)]
pub enum EncryptAlgorithm {
    RsaOaepParams(RsaOaepParams),
    AesGcmParams(AesGcmParams),
}

impl From<RsaOaepParams> for EncryptAlgorithm {
    fn from(params: RsaOaepParams) -> Self {
        EncryptAlgorithm::RsaOaepParams(params)
    }
}

impl From<AesGcmParams> for EncryptAlgorithm {
    fn from(params: AesGcmParams) -> Self {
        EncryptAlgorithm::AesGcmParams(params)
    }
}

#[derive(Deserialize, Serialize)]
pub enum SignAlgorithm {
    EcdsaParams(EcdsaParams),
    RsaPssParams(RsaPssParams),
}

impl From<EcdsaParams> for SignAlgorithm {
    fn from(params: EcdsaParams) -> Self {
        SignAlgorithm::EcdsaParams(params)
    }
}

impl From<RsaPssParams> for SignAlgorithm {
    fn from(params: RsaPssParams) -> Self {
        SignAlgorithm::RsaPssParams(params)
    }
}

#[derive(Deserialize, Serialize)]
pub enum WrapAlgorithm {
    RsaOaepParams(RsaOaepParams),
    AesGcmParams(AesGcmParams),
    NamedAlgorithm(NamedAlgorithm),
}

impl From<RsaOaepParams> for WrapAlgorithm {
    fn from(params: RsaOaepParams) -> Self {
        WrapAlgorithm::RsaOaepParams(params)
    }
}

impl From<AesGcmParams> for WrapAlgorithm {
    fn from(params: AesGcmParams) -> Self {
        WrapAlgorithm::AesGcmParams(params)
    }
}

impl From<NamedAlgorithm> for WrapAlgorithm {
    fn from(params: NamedAlgorithm) -> Self {
        WrapAlgorithm::NamedAlgorithm(params)
    }
}

#[derive(Deserialize, Serialize)]
pub struct EcdhDerivParams {
    pub public: String,
}

#[derive(Deserialize, Serialize)]
pub struct HkdfDerivParams {
    pub salt: Vec<u8>,
    pub info: Vec<u8>,
    pub hash: String,
}

#[derive(Deserialize, Serialize)]
pub enum DerivAlgorithm {
    EcdhDerivParams(EcdhDerivParams),
    HkdfDerivParams(HkdfDerivParams),
}

impl From<EcdhDerivParams> for DerivAlgorithm {
    fn from(params: EcdhDerivParams) -> Self {
        DerivAlgorithm::EcdhDerivParams(params)
    }
}

impl From<HkdfDerivParams> for DerivAlgorithm {
    fn from(params: HkdfDerivParams) -> Self {
        DerivAlgorithm::HkdfDerivParams(params)
    }
}

#[derive(Deserialize, Serialize)]
pub enum DerivKeyAlgorithm {
    AesKeyGenParams(AesKeyGenParams),
}


impl From<AesKeyGenParams> for DerivKeyAlgorithm {
    fn from(params: AesKeyGenParams) -> Self {
        DerivKeyAlgorithm::AesKeyGenParams(params)
    }
}

pub fn generate_key(algorithm: &GenAlgorithm, extractable: bool, usages: &[&str]) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    match algorithm {
        GenAlgorithm::RsaHashedKeyGenParams(params) => {
            let rsa_metadata = match util::get_rsa_metadata(&params) {
                Ok(rsa_metadata) => rsa_metadata,
                Err(e) => return Err(e.into())
            };

            let key = match CryptoImpl::generate_key("", KeyAlgorithm::Rsa as u32, &serde_json::to_string(&rsa_metadata).unwrap(), extractable, &usages) {
                Ok(key) => key,
                Err(e) => return Err(e.into())
            };

            let crypto_key_json = String::from_utf8(key).unwrap();
            let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json).unwrap();
            Ok(crypto_key)
        }
        GenAlgorithm::EcKeyGenParams(params) => {
            let named_curve = params.named_curve.as_str();
            match named_curve {
                "P-256" | "P-384" | "P-521" => {
                    let secpr1_metadata = match util::get_secpr1_metadata(&params) {
                        Ok(secpr1_metadata) => secpr1_metadata,
                        Err(e) => return Err(e.into())
                    };
                    let str_secpr1_metadata = match serde_json::to_string(&secpr1_metadata) {
                        Ok(str_secpr1_metadata) => str_secpr1_metadata,
                        Err(e) => { return Err(e.into()); }
                    };        
                    let key = match CryptoImpl::generate_key("", KeyAlgorithm::SecpR1 as u32, &str_secpr1_metadata, extractable, &usages) {
                        Ok(key) => key,
                        Err(e) => return Err(e.into()),
                    };
                    let crypto_key_json = String::from_utf8(key).unwrap();
                    let crypto_key: CryptoKey = match serde_json::from_str(&crypto_key_json) {
                        Ok(crypto_key) => crypto_key,
                        Err(e) => return Err(e.into()),
                    };
                    Ok(crypto_key)
                },
                "secp256k1" | "SECP256K1" => {
                    let secpk1_metadata = match util::get_secpk1_metadata(&params) {
                        Ok(secpk1_metadata) => secpk1_metadata,
                        Err(e) => {
                            return Err(e.into());
                        }
                    };
                    let str_secpk1_metadata = match serde_json::to_string(&secpk1_metadata) {
                        Ok(str_secpk1_metadata) => str_secpk1_metadata,
                        Err(e) => { return Err(e.into()); }
                    };        
                    let key = match CryptoImpl::generate_key("", KeyAlgorithm::SecpK1 as u32, &str_secpk1_metadata, extractable, &usages) {
                        Ok(key) => key,
                        Err(e) => return Err(e.into()),
                    };
                    let crypto_key_json = String::from_utf8(key).unwrap();
                    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json).unwrap();
                    Ok(crypto_key)
                }
                _ => Err("Invalid curve name".into())
            }
        }
        GenAlgorithm::AesKeyGenParams(params) => {
            let aes_metadata = match util::get_aes_metadata(&params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) =>  {    return Err(e.into()); }
            };
            let str_aes_metadata = match serde_json::to_string(&aes_metadata) {
                Ok(str_aes_metadata) => str_aes_metadata,
                Err(e) => { return Err(e.into()); }
            };
            let key = match CryptoImpl::generate_key("", KeyAlgorithm::Aes as u32, &str_aes_metadata, extractable, &usages) {
                Ok(key) => key,
                Err(e) => return Err(e.into()),
            };
            let crypto_key_json = String::from_utf8(key).unwrap();
            let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json).unwrap();
            Ok(crypto_key)
        }
    }
}

pub fn encrypt(algorithm: &EncryptAlgorithm, key: &CryptoKey, clear_text: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if clear_text.is_empty() {
        return Err("Invalid clear text".into());        
    }
    let key_name = &key.id;
    match algorithm {
        EncryptAlgorithm::RsaOaepParams(params) => {
            let metadata = RsaOaepEncryptionMetadata { 
                label: params.label.clone()
            };
            let result = match CryptoImpl::encrypt(
                    &key_name, 
                    EncryptionAlgorithm::RsaOaep as u32, 
                    &serde_json::to_string(&metadata).unwrap(), 
                    &clear_text) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
        EncryptAlgorithm::AesGcmParams(params) => {
            let tag_length = match util::get_aes_tag_length(&params.tag_length) {
                Ok(tag_length) => tag_length,
                Err(e) => return Err(e.into())
            };
            let metadata = AesGcmEncryptionMetadata { 
                iv: params.iv.clone(), 
                additional_data: params.additional_data.clone(), 
                tag_length: tag_length
            };
            let result = match CryptoImpl::encrypt(
                    &key_name, 
                    EncryptionAlgorithm::AesGcm as u32, 
                    &serde_json::to_string(&metadata).unwrap(), 
                    &clear_text) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
    }
}

pub fn decrypt(algorithm: &EncryptAlgorithm, key: &CryptoKey, cipher_text: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if cipher_text.is_empty() {
        return Err("Invalid cipher_text text".into());
    }
    let key_name = &key.id;
    match algorithm {
        EncryptAlgorithm::RsaOaepParams(params) => {
            let metadata = RsaOaepEncryptionMetadata { 
                label: params.label.clone()
            };
            let result = match CryptoImpl::decrypt(&key_name, EncryptionAlgorithm::RsaOaep as u32, &serde_json::to_string(&metadata).unwrap(), &cipher_text) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
        EncryptAlgorithm::AesGcmParams(params) => {
            let tag_length = match util::get_aes_tag_length(&params.tag_length) {
                Ok(tag_length) => tag_length,
                Err(e) => return Err(e.into())
            };
            let metadata = AesGcmEncryptionMetadata { 
                iv: params.iv.clone(), 
                additional_data: params.additional_data.clone(), 
                tag_length: tag_length
            };
            let result = match CryptoImpl::decrypt(&key_name, EncryptionAlgorithm::AesGcm as u32, &serde_json::to_string(&metadata).unwrap(), &cipher_text) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
    }
}

pub fn sign(algorithm: &SignAlgorithm, key: &CryptoKey, data: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Invalid data".into());
    }
    let key_name = &key.id;
    match algorithm {
        SignAlgorithm::RsaPssParams(params) => {
            let metadata = RsaPssSignatureMetadata { 
                salt_length: params.salt_length as u64
            };
            let result = match CryptoImpl::sign(&key_name, SigningAlgorithm::RsaPss as u32, &serde_json::to_string(&metadata).unwrap(), &data) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
        SignAlgorithm::EcdsaParams(params) => {
            let sha_metadata = match util::get_sha_metadata(&params.hash) {
                Ok(sha_metadata) => sha_metadata,
                Err(e) => return Err(e.into())
            };
            let metadata = EcdsaSignatureMetadata { 
                sha_metadata: sha_metadata
            };
            let result = match CryptoImpl::sign(&key_name, SigningAlgorithm::Ecdsa as u32, &serde_json::to_string(&metadata).unwrap(), &data) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
    }
}

pub fn verify(algorithm: &SignAlgorithm, key: &CryptoKey, data: &[u8], signature: &[u8]) -> Result<VerifySignResult, Box<dyn std::error::Error>> {
    if signature.is_empty() || data.is_empty() {
        return Err("Invalid signature or data".into());
    }
    let key_name = &key.id;
    match algorithm {
        SignAlgorithm::RsaPssParams(params) => {
            let metadata = RsaPssSignatureMetadata { 
                salt_length: params.salt_length as u64
            };
            let result = match CryptoImpl::verify(&key_name, SigningAlgorithm::RsaPss as u32, &serde_json::to_string(&metadata).unwrap(), &data, &signature) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
        SignAlgorithm::EcdsaParams(params) => {
            let sha_metadata = match util::get_sha_metadata(&params.hash) {
                Ok(sha_metadata) => sha_metadata,
                Err(e) => return Err(e.into())
            };
            let metadata = EcdsaSignatureMetadata { 
                sha_metadata: sha_metadata
            };
            let result = match CryptoImpl::verify(&key_name, SigningAlgorithm::Ecdsa as u32, &serde_json::to_string(&metadata).unwrap(), &data, &signature) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
    }
}

pub fn digest(algorithm: &str, data: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Invalid data".into());
    }
    let sha_metadata = match util::get_sha_metadata(&algorithm) {
        Ok(sha_metadata) => sha_metadata,
        Err(e) => return Err(e.into())
    };
    let result = match CryptoImpl::digest(HashAlgorithm::Sha as u32, &serde_json::to_string(&sha_metadata).unwrap(), &data) {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };
    Ok(result)
}

pub fn import_key(format: &str, key_data: &[u8], algorithm: &GenAlgorithm, extractable: bool, usages: &[&str]) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    let algo_metadata: String;
    let algo_id: KeyAlgorithm;

    let key_format = match util::get_key_format(&format) {
        Ok(key_format) => key_format,
        Err(e) => return Err(e.into())
    };

    if key_data.is_empty() {
        return Err("Invalid key data".into());
    }

    match algorithm {
        GenAlgorithm::RsaHashedKeyGenParams(params) => {
            let rsa_metadata = match util::get_rsa_metadata(&params) {
                Ok(rsa_metadata) => rsa_metadata,
                Err(e) => return Err(e.into())
            };
            algo_metadata = serde_json::to_string(&rsa_metadata).unwrap();
            algo_id = KeyAlgorithm::Rsa;
        }
        GenAlgorithm::EcKeyGenParams(params) => {
            let named_curve = params.named_curve.as_str();
            match named_curve {
                "P-256" | "P-384" | "P-521" => {
                    let secpr1_metadata = match util::get_secpr1_metadata(&params) {
                        Ok(secpr1_metadata) => secpr1_metadata,
                        Err(e) => return Err(e.into())
                    };
                    algo_metadata = serde_json::to_string(&secpr1_metadata).unwrap();
                    algo_id = KeyAlgorithm::SecpR1;
                },
                "secp256k1" | "SECP256K1" => {
                    let secpk1_metadata = match util::get_secpk1_metadata(&params) {
                        Ok(secpk1_metadata) => secpk1_metadata,
                        Err(e) => return Err(e.into())
                    };
                    algo_metadata = serde_json::to_string(&secpk1_metadata).unwrap();
                    algo_id = KeyAlgorithm::SecpK1;
                }
                _ => return Err("Invalid curve name".into())
            }
        }    
        GenAlgorithm::AesKeyGenParams(params) => {
            let aes_metadata = match util::get_aes_metadata(&params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) =>  {    return Err(e.into()); }
            };
            algo_metadata = serde_json::to_string(&aes_metadata).unwrap();
            algo_id = KeyAlgorithm::Aes;
        }                
    }

    let result = match CryptoImpl::import_key(key_format as u32, &key_data, algo_id as u32, &algo_metadata, extractable, &usages.to_vec(), "") {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };

    let crypto_key_json = String::from_utf8(result).unwrap();
    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json).unwrap();
    Ok(crypto_key)
}

pub fn wrap_key(format: &str, key: &CryptoKey, wrapping_key: &CryptoKey, algorithm: &WrapAlgorithm) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let key_format = match util::get_key_format(&format) {
        Ok(key_format) => key_format,
        Err(e) => return Err(e.into())
    };
    let key_name = &key.id;
    let wrapping_key_name = &wrapping_key.id;

    if key_name.is_empty() || wrapping_key_name.is_empty() {
        return Err("Invalid key".into());
    }

    match algorithm {
        WrapAlgorithm::RsaOaepParams(params) => {
            let metadata = RsaOaepEncryptionMetadata { 
                label: params.label.clone()
            };
            let result = match CryptoImpl::wrap_key(
                    &wrapping_key_name, 
                    EncryptionAlgorithm::RsaOaep as u32, 
                    &serde_json::to_string(&metadata).unwrap(),
                    &key_name,
                    key_format as u32) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
        WrapAlgorithm::AesGcmParams(params) => {
            let tag_length = match util::get_aes_tag_length(&params.tag_length) {
                Ok(tag_length) => tag_length,
                Err(e) => return Err(e.into())
            };
            let metadata = AesGcmEncryptionMetadata { 
                iv: params.iv.clone(), 
                additional_data: params.additional_data.clone(), 
                tag_length: tag_length
            };
            let result = match CryptoImpl::wrap_key(
                    &wrapping_key_name, 
                    EncryptionAlgorithm::AesGcm as u32, 
                    &serde_json::to_string(&metadata).unwrap(),
                    &key_name,
                    key_format as u32) {
                Ok(result) => result,
                Err(e) => return Err(e.into())
            };
            Ok(result)
        }
        WrapAlgorithm::NamedAlgorithm(params) => {
            let algo_name = params.name.as_str();
            match algo_name {
                "AES-KW" | "aes-kw" => {
                    let metadata = AesKwWrappingMetadata { with_padding: true };
                    let result = match CryptoImpl::wrap_key(
                            &wrapping_key_name, 
                            WrappingAlgorithm::AesKw as u32, 
                            &serde_json::to_string(&metadata).unwrap(),
                            &key_name,
                            key_format as u32) {
                        Ok(result) => result,
                        Err(e) => return Err(e.into())
                    };
                    Ok(result)
                }
                _ => Err("Invalid algorithm".into())
            }
        }
        
    }
}

pub fn unwrap_key(
        format: &str, 
        wrapped_key: &[u8], 
        unwrapping_key: &CryptoKey, 
        unwrap_algorithm: &WrapAlgorithm, 
        unwrapped_key_algorithm: &GenAlgorithm,
        extractable: bool, 
        usages: &[&str]) -> Result<CryptoKey, Box<dyn std::error::Error>> 
{
    let key_format = match util::get_key_format(&format) {
        Ok(key_format) => key_format,
        Err(e) => return Err(e.into())
    };

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
        WrapAlgorithm::RsaOaepParams(params) => {
            let metadata = RsaOaepEncryptionMetadata { 
                label: params.label.clone()
            };
            wrapping_algo_metadata = serde_json::to_string(&metadata).unwrap();
            wrapping_algo_id = WrappingAlgorithm::RsaOaep;
        }
        WrapAlgorithm::AesGcmParams(params) => {
            let tag_length = match util::get_aes_tag_length(&params.tag_length) {
                Ok(tag_length) => tag_length,
                Err(e) => return Err(e.into())
            };
            let metadata = AesGcmEncryptionMetadata { 
                iv: params.iv.clone(), 
                additional_data: params.additional_data.clone(), 
                tag_length: tag_length
            };
            wrapping_algo_metadata = serde_json::to_string(&metadata).unwrap();
            wrapping_algo_id = WrappingAlgorithm::AesGcm;
        }
        WrapAlgorithm::NamedAlgorithm(params) => {
            let algo_name = params.name.as_str();
            match algo_name {
                "AES-KW" | "aes-kw" => {
                    let metadata = AesKwWrappingMetadata { with_padding: true };
                    wrapping_algo_metadata = serde_json::to_string(&metadata).unwrap();
                    wrapping_algo_id = WrappingAlgorithm::AesKw;
                }
                _ => return Err("Invalid algorithm".into())
            }
        }
    }

    let key_gen_algo_metadata: String;
    let key_gen_algo_id: KeyAlgorithm;

    match unwrapped_key_algorithm {
        GenAlgorithm::RsaHashedKeyGenParams(params) => {
            let rsa_metadata = match util::get_rsa_metadata(&params) {
                Ok(rsa_metadata) => rsa_metadata,
                Err(e) => return Err(e.into())
            };
            key_gen_algo_metadata = serde_json::to_string(&rsa_metadata).unwrap();
            key_gen_algo_id = KeyAlgorithm::Rsa;
        }
        GenAlgorithm::EcKeyGenParams(params) => {
            let named_curve = params.named_curve.as_str();
            match named_curve {
                "P-256" | "P-384" | "P-521" => {
                    let secpr1_metadata = match util::get_secpr1_metadata(&params) {
                        Ok(secpr1_metadata) => secpr1_metadata,
                        Err(e) => return Err(e.into())
                    };
                    key_gen_algo_metadata = serde_json::to_string(&secpr1_metadata).unwrap();
                    key_gen_algo_id = KeyAlgorithm::SecpR1;
                },
                "secp256k1" | "SECP256K1" => {
                    let secpk1_metadata = match util::get_secpk1_metadata(&params) {
                        Ok(secpk1_metadata) => secpk1_metadata,
                        Err(e) => return Err(e.into())
                    };
                    key_gen_algo_metadata = serde_json::to_string(&secpk1_metadata).unwrap();
                    key_gen_algo_id = KeyAlgorithm::SecpK1;
                }
                _ => return Err("Invalid curve name".into())
            }
        }
        GenAlgorithm::AesKeyGenParams(params) => {
            let aes_metadata = match util::get_aes_metadata(&params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) =>  {    return Err(e.into()); }
            };
            key_gen_algo_metadata = serde_json::to_string(&aes_metadata).unwrap();
            key_gen_algo_id = KeyAlgorithm::Aes;
        }
    }

    let result = match CryptoImpl::unwrap_key(
            &unwrapping_key_name, 
            wrapping_algo_id as u32, 
            &wrapping_algo_metadata,
            key_format as u32,
            &wrapped_key,
            key_gen_algo_id as u32,
            &key_gen_algo_metadata,
            extractable,
            &usages.to_vec()) {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };
    let crypto_key_json = String::from_utf8(result).unwrap();
    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json).unwrap();
    Ok(crypto_key)

}

pub fn export_key(format: &str, key: &CryptoKey) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    if key.id.is_empty() {
        return Err("Invalid key".into());
    }
    let key_name = &key.id;
    let key_format = match util::get_key_format(&format) {
        Ok(key_format) => key_format,
        Err(e) => return Err(e.into())
    };
    let result = match CryptoImpl::export_key(&key_name, key_format as u32) {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };
    Ok(result)
}

pub fn get_public_key(key: &CryptoKey) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    if key.id.is_empty() {
        return Err("Invalid key".into());
    }
    let key_name = &key.id;
    
    let key_type = key.key_type.as_str();
    match key_type {
        "secret" | "aes" => return Err("Invalid key type: AES symmetric key cannot have public key".into()),
        "public" => return Err("Invalid key type".into()),
        _ => ()
    };

    let crypto_key_json = match CryptoImpl::get_public_key_as_crypto_key(&key_name) {
        Ok(crypto_key_json) => crypto_key_json,
        Err(e) => return Err(e.into()),
    };

    let crypto_key: CryptoKey = match serde_json::from_str(&crypto_key_json) {
        Ok(crypto_key) => crypto_key,
        Err(e) => return Err(e.into()),
    };
    
    Ok(crypto_key)
}

pub fn derive_key(derivation_algorithm: &DerivAlgorithm, base_key: &CryptoKey, derived_key_algorithm: &DerivKeyAlgorithm, extractable: bool, usages: &[&str]) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    if base_key.id.is_empty() {
        return Err("Invalid key".into());
    }
    let base_key_name = &base_key.id;

    let derivation_algo_metadata: String;
    let derivation_algo_id: DerivationAlgorithm;

    match derivation_algorithm {
        DerivAlgorithm::EcdhDerivParams(params) => {
            derivation_algo_metadata = match util::get_ecdh_metadata(params) {
                Ok(result) => serde_json::to_string(&result).unwrap(),
                Err(e) => return Err(e.into())
            };
            derivation_algo_id = DerivationAlgorithm::Ecdh;
        }
        DerivAlgorithm::HkdfDerivParams(params) => {
            derivation_algo_metadata = match util::get_hkdf_metadata(params) {
                Ok(result) => serde_json::to_string(&result).unwrap(),
                Err(e) => return Err(e.into())
            };
            derivation_algo_id = DerivationAlgorithm::Hkdf;
        }                
    }

    let derived_key_algo_metadata: String;
    let derived_key_algo_id: DerivedKeyUsageAlgorithm;
    match derived_key_algorithm {
        DerivKeyAlgorithm::AesKeyGenParams(params) => {
            let aes_metadata = match util::get_aes_metadata(&params) {
                Ok(aes_metadata) => aes_metadata,
                Err(e) =>  {    return Err(e.into()); }
            };
            derived_key_algo_metadata = match serde_json::to_string(&aes_metadata) {
                Ok(result) => result,
                Err(e) => { return Err(e.into()); }
            };
            derived_key_algo_id = DerivedKeyUsageAlgorithm::Aes;
        }
    }

    let crypto_key_json = match CryptoImpl::derive_key(derivation_algo_id as u32, &derivation_algo_metadata, derived_key_algo_id as u32, &derived_key_algo_metadata, extractable, &usages.to_vec(), &base_key_name) {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };
    
    let crypto_key: CryptoKey = serde_json::from_str(&crypto_key_json).unwrap();
    Ok(crypto_key)
}

pub fn save_key(key: &CryptoKey, key_persisted_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    if key.id.is_empty() {
        return Err("Invalid key".into());
    }
    if key_persisted_name.is_empty() {
        return Err("Invalid key name: cannot be null or empty".into());
    }
    let existing_key = match CryptoImpl::key_exists(&key_persisted_name) {
        Ok(existing_key) => existing_key,
        Err(e) => return Err(e.into())
    };

    if existing_key {
        return Err(format!("Invalid key name: key name {} already exists", key_persisted_name).into());
    }

    let params = KeyPersistParams {
        key_id: key.id.clone(),
        key_name: key_persisted_name.to_string(),
        key_type: key.key_type.clone()
    };                
    match CryptoImpl::persist_key(&serde_json::to_string(&params).unwrap().into_bytes() ) {
        Ok(_) => (),
        Err(e) => return Err(e.into())
    };
    Ok(())
}

pub fn load_key(key_name: &str) -> Result<CryptoKey, Box<dyn std::error::Error>> {
    if key_name.is_empty() {
        return Err("Invalid key name: cannot be null or empty".into());
    }
    let key_json = match CryptoImpl::load_key(&key_name) {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };
    let crypto_key: CryptoKey = serde_json::from_str(&key_json).unwrap();
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
