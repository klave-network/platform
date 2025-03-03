use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::Display;

use super::keys::PublicKey;
use super::sdk_wrapper::{CryptoImpl, Key, VerifySignResult};
use super::subtle::CryptoKey;
use super::subtle_idl_v1::{EcdsaSignatureMetadata, SecpR1Metadata, ShaMetadata};
use super::subtle_idl_v1_enums::{
    KeyAlgorithm, SecpR1KeyBitsize, ShaAlgorithm, ShaDigestBitsize, SigningAlgorithm,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyECC {
    key: Key,
    #[allow(dead_code)]
    named_curve: String,
}

impl Default for KeyECC {
    fn default() -> Self {
        KeyECC {
            key: Key::new(&String::from("")),
            named_curve: String::from("P-256"),
        }
    }
}

impl Display for KeyECC {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "KeyECC: name: {}, named_curve: {}",
            self.key.name(),
            self.named_curve
        )
    }
}

impl KeyECC {
    pub fn new(name: &str, named_curve: &str) -> KeyECC {
        KeyECC {
            key: Key::new(name),
            named_curve: named_curve.to_string(),
        }
    }

    pub fn sign(&self, data: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let hash_algo = ShaMetadata {
            algo_id: ShaAlgorithm::Sha2,
            length: ShaDigestBitsize::Sha256,
        };
        let signature_metadata = EcdsaSignatureMetadata {
            sha_metadata: hash_algo,
        };
        match CryptoImpl::sign(
            &self.key.name(),
            SigningAlgorithm::Ecdsa as u32,
            &serde_json::to_string(&signature_metadata)?,
            &data,
        ) {
            Ok(result) => Ok(result),
            Err(err) => Err(err.into()),
        }
    }

    pub fn verify(
        &self,
        data: &[u8],
        signature: &[u8],
    ) -> Result<VerifySignResult, Box<dyn Error>> {
        let hash_algo = ShaMetadata {
            algo_id: ShaAlgorithm::Sha2,
            length: ShaDigestBitsize::Sha256,
        };
        let signature_metadata = EcdsaSignatureMetadata {
            sha_metadata: hash_algo,
        };
        match CryptoImpl::verify(
            &self.key.name(),
            SigningAlgorithm::Ecdsa as u32,
            &serde_json::to_string(&signature_metadata)?,
            &data,
            &signature,
        ) {
            Ok(result) => Ok(result),
            Err(err) => Err(err),
        }
    }

    pub fn get_public_key(&self) -> Result<PublicKey, Box<dyn Error>> {
        match CryptoImpl::get_public_key(&self.key.name()) {
            Ok(result) => Ok(PublicKey::new(&result)),
            Err(err) => Err(err),
        }
    }
}

pub fn get_key(name: &str) -> Result<KeyECC, Box<dyn Error>> {
    match CryptoImpl::key_exists(name) {
        Ok(_) => Ok(KeyECC::new(name, &String::from("P-256"))),
        Err(err) => Err(err),
    }
}

pub fn generate_key(name: &str) -> Result<KeyECC, Box<dyn Error>> {
    if name.is_empty() {
        return Err("Invalid key name: key name cannot be empty".into());
    }

    match CryptoImpl::key_exists(name) {
        Ok(exists) => {
            if exists == true {
                return Err(format!("Invalid key name: key name {} already exists", name).into());
            }
        }
        Err(e) => return Err(e),
    }

    let metadata = serde_json::to_string(&SecpR1Metadata {
        length: SecpR1KeyBitsize::SecpR1256,
    })?;
    let key: Vec<u8>;
    match CryptoImpl::generate_key(
        name,
        KeyAlgorithm::SecpR1 as u32,
        &metadata,
        true,
        &["sign"],
    ) {
        Ok(result) => {
            key = result;
        }
        Err(e) => return Err(e),
    }

    match CryptoImpl::save_key(name) {
        Ok(_) => (),
        Err(e) => return Err(e.into()),
    };

    match serde_json::from_str::<CryptoKey>(&String::from_utf8(key)?) {
        Ok(_) => (),
        Err(e) => return Err(e.into()),
    };

    Ok(KeyECC::new(name, "P-256"))
}
