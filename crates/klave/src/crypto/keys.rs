/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

use std::fmt::Display;
use serde::{Serialize, Deserialize};
use base64::{engine::general_purpose, Engine as _};

#[derive(Debug)]
#[derive(Clone)]
#[derive(Serialize, Deserialize)]
pub struct PublicKey {
    bytes: Vec<u8>
}

impl Default for PublicKey {
    fn default() -> Self {
        PublicKey { bytes: vec![] }
    }
}

impl Display for PublicKey {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "PublicKey: {}", general_purpose::STANDARD.encode(&self.bytes))
    }
}

impl PublicKey {
    pub fn new(bytes: &[u8]) -> PublicKey {
        PublicKey { bytes: bytes.to_vec() }
    }

    pub fn get_pem(&self) -> String {
        let pem = format!("-----BEGIN PUBLIC KEY-----\n{}\n-----END PUBLIC-----", general_purpose::STANDARD.encode(&self.bytes));
        pem
    }
}

pub struct PrivateKey {
    bytes: Vec<u8>
}

impl Default for PrivateKey {
    fn default() -> Self {
        PrivateKey { bytes: vec![] }
    }
}

impl PrivateKey {
    pub fn new(bytes: &[u8]) -> PrivateKey {
        PrivateKey { bytes: bytes.to_vec() }
    }

    pub fn get_pem(&self) -> String {
        let pem = format!("-----BEGIN PRIVATE KEY-----\n{}\n-----END PRIVATE KEY-----", general_purpose::STANDARD.encode(&self.bytes));
        pem
    }
} 