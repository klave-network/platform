use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
use std::fmt::Display;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PublicKey {
    bytes: Vec<u8>,
}

impl Display for PublicKey {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "PublicKey: {}",
            general_purpose::STANDARD.encode(&self.bytes)
        )
    }
}

impl PublicKey {
    pub fn new(bytes: &[u8]) -> PublicKey {
        PublicKey {
            bytes: bytes.to_vec(),
        }
    }

    pub fn get_pem(&self) -> String {
        let pem = format!(
            "-----BEGIN PUBLIC KEY-----\n{}\n-----END PUBLIC-----",
            general_purpose::STANDARD.encode(&self.bytes)
        );
        pem
    }
}

#[derive(Default)]
pub struct PrivateKey {
    bytes: Vec<u8>,
}

impl PrivateKey {
    pub fn new(bytes: &[u8]) -> PrivateKey {
        PrivateKey {
            bytes: bytes.to_vec(),
        }
    }

    pub fn get_pem(&self) -> String {
        let pem = format!(
            "-----BEGIN PRIVATE KEY-----\n{}\n-----END PRIVATE KEY-----",
            general_purpose::STANDARD.encode(&self.bytes)
        );
        pem
    }
}
