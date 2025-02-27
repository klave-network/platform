use std::error::Error;
use std::fmt::Display;
use serde::{Serialize, Deserialize};

use super::sdk_wrapper::Key;
use super::sdk_wrapper::CryptoImpl;
use super::sdk_wrapper::VerifySignResult;
use super::subtle_idl_v1::{RsaMetadata, RsaOaepEncryptionMetadata, RsaPssSignatureMetadata};
use super::subtle_idl_v1_enums::{KeyAlgorithm, RsaKeyBitsize, EncryptionAlgorithm, SigningAlgorithm};
use super::subtle::CryptoKey;
use super::util;

#[derive(Debug)]
#[derive(Clone)]
#[derive(Serialize, Deserialize)]
pub struct KeyRSA {
    key: Key,
    #[allow(dead_code)]
    modulus_length: u32,
}

impl Default for KeyRSA {
    fn default() -> Self {
        KeyRSA { key: Key::new(&""), modulus_length: 2048 }
    }
}

impl Display for KeyRSA {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "KeyRSA: name: {}, length: {}", self.key.name(), self.modulus_length)
    }
}

impl KeyRSA
{
    pub fn new(name: &str, modulus_length: u32) -> KeyRSA {
        KeyRSA { key: Key::new(name), modulus_length: modulus_length }
    }

    pub fn encrypt(&self, data: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let rsa_oaep_encryption_metadata = RsaOaepEncryptionMetadata { 
            label: vec![]
        };
        match CryptoImpl::encrypt(&self.key.name(), EncryptionAlgorithm::RsaOaep as u32, &serde_json::to_string(&rsa_oaep_encryption_metadata)?, &data) {
            Ok(result) => Ok(result),
            Err(err) => Err(err)
        }
    }

    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let rsa_oaep_encryption_metadata = RsaOaepEncryptionMetadata { 
            label: vec![]
        };
        match CryptoImpl::decrypt(&self.key.name(), EncryptionAlgorithm::RsaOaep as u32, &serde_json::to_string(&rsa_oaep_encryption_metadata)?, &data.to_vec()) {
            Ok(result) => Ok(result),
            Err(err) => Err(err)
        }
    }

    pub fn sign(&self, data: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let salt_length = 32;
        let signature_metadata = RsaPssSignatureMetadata { salt_length: salt_length };        
        match CryptoImpl::sign(&self.key.name(), SigningAlgorithm::RsaPss as u32, &serde_json::to_string(&signature_metadata)?, &data) {
            Ok(result) => Ok(result),
            Err(err) => Err(err)
        }
    }

    pub fn verify(&self, data: &[u8], signature: &[u8]) -> Result<VerifySignResult, Box<dyn Error>> {
        let salt_length = 32;
        let signature_metadata = RsaPssSignatureMetadata { salt_length: salt_length };        
        match CryptoImpl::verify(&self.key.name(), SigningAlgorithm::RsaPss as u32,  &serde_json::to_string(&signature_metadata)?, &data, &signature) {
            Ok(result) => Ok(result),
            Err(err) => Err(err)
        }
    }

    pub fn get_public_key(&self) -> Result<Vec<u8>, Box<dyn Error>> {
        match CryptoImpl::get_public_key(&self.key.name()) {
            Ok(result) => Ok(result),
            Err(err) => Err(err)
        }
    }
}

pub fn get_key(name: &str) -> Result<KeyRSA, Box<dyn Error>> {
    match CryptoImpl::key_exists(name) {
        Ok(_) => Ok(KeyRSA::new(name, 2048)),
        Err(err) => Err(err)
    }
}

pub fn generate_key(name: &str) -> Result<KeyRSA, Box<dyn Error>> {
    if name.is_empty() {
        return Err("Invalid key name: key name cannot be empty".into());
    }

    match CryptoImpl::key_exists(name) {
        Ok(exists) => {
            if exists == true {
                return Err(format!("Invalid key name: key name {} already exists", name).into());
            }
        }
        Err(e) => return Err(e)
    }

    let sha_algo = String::from("sha-256");
    let sha_metadata = match util::get_sha_metadata(&sha_algo) {
        Ok(result) => result,
        Err(e) => return Err(e.into())
    };
    let metadata = RsaMetadata { modulus: RsaKeyBitsize::Rsa2048, public_exponent: 0, sha_metadata: sha_metadata };
    let key = match CryptoImpl::generate_key(name, KeyAlgorithm::Rsa as u32, &serde_json::to_string(&metadata)?, true, &["sign", "decrypt"]) {
        Ok(result) => result,
        Err(e) => return Err(e)
    };

    match CryptoImpl::save_key(name) {
        Ok(_) => (),
        Err(e) => return Err(e.into())
    };

    match serde_json::from_str::<CryptoKey>(&String::from_utf8(key)?) {
        Ok(_) => (),
        Err(e) => return Err(e.into())
    };

    Ok(KeyRSA::new(name, 2048))
}
