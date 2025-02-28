use std::error::Error;
use std::fmt::Display;
use serde::{Serialize, Deserialize};

use super::sdk_wrapper::Key;
use super::sdk_wrapper::CryptoImpl;
use super::random;
use super::subtle_idl_v1::AesGcmEncryptionMetadata;
use super::subtle_idl_v1_enums::{KeyAlgorithm, AesTagLength, EncryptionAlgorithm};
use super::subtle::{CryptoKey, AesKeyGenParams};

#[derive(Debug)]
#[derive(Clone)]
#[derive(Serialize, Deserialize)]
pub struct KeyAES {
    key: Key,
    #[allow(dead_code)]
    length: u32,
}

impl Default for KeyAES {
    fn default() -> Self {
        KeyAES { key: Key::new(&""), length: 256 }
    }
}

impl Display for KeyAES {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "KeyAES: name: {}, length: {}", self.key.name(), self.length)
    }
}

impl KeyAES 
{
    pub fn new(name: &str, length: u32) -> KeyAES {
        KeyAES { key: Key::new(name), length: length }
    }

    pub fn encrypt(&self, data: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let iv = match random::get_random_bytes(12) {
            Ok(iv) => iv,
            Err(e) => return Err(e.into())
        };
        let aes_gcm_params = AesGcmEncryptionMetadata { 
            iv: iv.clone(), 
            additional_data: vec![], 
            tag_length: AesTagLength::Tag96
        };
    
        match CryptoImpl::encrypt(&self.key.name(), EncryptionAlgorithm::AesGcm as u32, &serde_json::to_string(&aes_gcm_params)?, &data) {
            Ok(result) => {
                //Prepend iv to the result
                let result = iv.to_vec().into_iter().chain(result.into_iter()).collect::<Vec<u8>>();                
                Ok(result)
            },
            Err(err) => Err(err)
        }
    }

    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {
        let iv = &data[0..12];
        let data = &data[12..];
        let aes_gcm_params = AesGcmEncryptionMetadata { 
            iv: iv.to_vec(), 
            additional_data: vec![], 
            tag_length: AesTagLength::Tag96
        };

        match CryptoImpl::decrypt(&self.key.name(), EncryptionAlgorithm::AesGcm as u32, &serde_json::to_string(&aes_gcm_params)?, &data.to_vec()) {
            Ok(result) => Ok(result),
            Err(err) => Err(err)
        }
    }

}


pub fn get_key(name: &str) -> Result<KeyAES, Box<dyn Error>> {
    match CryptoImpl::key_exists(name) {
        Ok(_) => Ok(KeyAES::new(name, 256)),
        Err(err) => Err(err)
    }
}

pub fn generate_key(name: &str) -> Result<KeyAES, Box<dyn Error>> {
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

    let metadata = AesKeyGenParams { length: 256 };
    let key = match CryptoImpl::generate_key(name, KeyAlgorithm::Aes as u32, &serde_json::to_string(&metadata)?, true, &["encrypt", "decrypt"]) {
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

    Ok(KeyAES::new(name, 256))
}