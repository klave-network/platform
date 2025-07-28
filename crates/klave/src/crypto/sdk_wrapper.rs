use std::error::Error;
use std::fmt::Display;

use super::random;
use crate::sdk;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Key {
    name: String,
}

impl Key {
    pub fn new(name: &str) -> Key {
        if !name.is_empty() {
            Key {
                name: name.to_string(),
            }
        } else {
            let Ok(rand) = random::get_random_bytes(16) else {
                return Key {
                    name: name.to_string(),
                };
            };
            Key {
                name: rand.iter().fold(String::new(), |mut acc, b| {
                    use std::fmt::Write;
                    write!(acc, "{b:02x}").unwrap();
                    acc
                }),
            }
        }
    }

    pub fn name(&self) -> String {
        self.name.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifySignResult {
    #[allow(dead_code)]
    is_valid: bool,
}

impl VerifySignResult {
    pub fn is_valid(&self) -> bool {
        self.is_valid
    }
}

impl Display for VerifySignResult {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "is_valid: {}", self.is_valid)
    }
}

pub struct CryptoImpl;

impl CryptoImpl {
    fn usage(input: &str) -> u8 {
        match input {
            "encrypt" => 0,
            "decrypt" => 1,
            "sign" => 2,
            "verify" => 3,
            "derive_key" => 4,
            "derive_bits" => 5,
            "wrap_key" => 6,
            "unwrap_key" => 7,
            _ => u8::MAX,
        }
    }

    fn process_usages(usages: &[&str]) -> Vec<u8> {
        let mut local_usages = Vec::with_capacity(usages.len());
        for usage in usages {
            local_usages.push(CryptoImpl::usage(usage));
        }
        local_usages
    }

    pub fn key_exists(key_name: &str) -> Result<bool, Box<dyn Error>> {
        match sdk::key_exists(key_name) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn generate_key(
        key_name: &str,
        algorithm: u32,
        algo_metadata: &str,
        extractable: bool,
        usages: &[&str],
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::generate_key(
            key_name,
            algorithm as i32,
            algo_metadata,
            extractable as i32,
            &CryptoImpl::process_usages(usages),
        ) {
            Ok(result) => Ok(result.into_bytes()),
            Err(err) => Err(err.into()),
        }
    }

    pub fn encrypt(
        key_name: &str,
        algorithm: u32,
        algo_metadata: &str,
        clear_text: &[u8],
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::encrypt(key_name, algorithm as i32, algo_metadata, clear_text) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn decrypt(
        key_name: &str,
        algorithm: u32,
        algo_metadata: &str,
        cipher_text: &[u8],
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::decrypt(key_name, algorithm as i32, algo_metadata, cipher_text) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn sign(
        key_name: &str,
        algorithm: u32,
        algo_metadata: &str,
        data: &[u8],
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::sign(key_name, algorithm as i32, algo_metadata, data) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn verify(
        key_name: &str,
        algorithm: u32,
        algo_metadata: &str,
        data: &[u8],
        signature: &[u8],
    ) -> Result<VerifySignResult, Box<dyn Error>> {
        match sdk::verify(key_name, algorithm as i32, algo_metadata, data, signature) {
            Ok(result) => Ok(VerifySignResult { is_valid: result }),
            Err(err) => Err(err.into()),
        }
    }

    pub fn digest(algorithm: u32, hash_info: &str, text: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::digest(algorithm as i32, hash_info, text) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn import_key(
        format: u32,
        key_data: &[u8],
        algorithm: u32,
        algo_metadata: &str,
        extractable: bool,
        usages: &[&str],
        key_name: &str,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::import_key(
            key_name,
            format as i32,
            key_data,
            algorithm as i32,
            algo_metadata,
            extractable as i32,
            &CryptoImpl::process_usages(usages),
        ) {
            Ok(result) => Ok(result.into_bytes()),
            Err(err) => Err(err.into()),
        }
    }

    pub fn export_key(key_name: &str, format: u32) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::export_key(key_name, format as i32) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn unwrap_key(
        decryption_key_name: &str,
        unwrap_algo_id: u32,
        unwrap_metadata: &str,
        format: u32,
        wrapped_key: &[u8],
        key_gen_algorithm: u32,
        key_gen_algo_metadata: &str,
        extractable: bool,
        usages: &[&str],
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::unwrap_key(
            decryption_key_name,
            unwrap_algo_id as i32,
            unwrap_metadata,
            "",
            format as i32,
            wrapped_key,
            key_gen_algorithm as i32,
            key_gen_algo_metadata,
            extractable as i32,
            &CryptoImpl::process_usages(usages),
        ) {
            Ok(result) => Ok(result.into_bytes()),
            Err(err) => Err(err.into()),
        }
    }

    pub fn wrap_key(
        encryption_key_name: &str,
        algorithm: u32,
        algo_metadata: &str,
        key_name: &str,
        format: u32,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::wrap_key(
            key_name,
            format as i32,
            encryption_key_name,
            algorithm as i32,
            algo_metadata,
        ) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn get_public_key(key_name: &str) -> Result<Vec<u8>, Box<dyn Error>> {
        match sdk::get_public_key(key_name) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn get_public_key_as_crypto_key(key_name: &str) -> Result<String, Box<dyn Error>> {
        match sdk::get_public_key_as_cryptokey(key_name) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn derive_key(
        derivation_algorithm: u32,
        derivation_metadata: &str,
        derived_key_algorithm: u32,
        derived_key_metadata: &str,
        extractable: bool,
        usages: &[&str],
        key_name: &str,
    ) -> Result<String, Box<dyn Error>> {
        match sdk::derive_key(
            key_name,
            derivation_algorithm as i32,
            derivation_metadata,
            derived_key_algorithm as i32,
            derived_key_metadata,
            extractable as i32,
            &CryptoImpl::process_usages(usages),
        ) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn save_key(key_name: &str) -> Result<(), Box<dyn Error>> {
        match sdk::save_key(key_name) {
            Ok(_) => Ok(()),
            Err(err) => Err(err.into()),
        }
    }

    pub fn persist_key(key_persist_data: &[u8]) -> Result<(), Box<dyn Error>> {
        match sdk::persist_key(&String::from_utf8(key_persist_data.to_vec())?) {
            Ok(_) => Ok(()),
            Err(err) => Err(err.into()),
        }
    }

    pub fn load_key(key_name: &str) -> Result<String, Box<dyn Error>> {
        match sdk::load_key(key_name) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn delete_key(key_name: &str) -> Result<(), Box<dyn Error>> {
        match sdk::delete_key(key_name) {
            Ok(_) => Ok(()),
            Err(err) => Err(err.into()),
        }
    }
}
