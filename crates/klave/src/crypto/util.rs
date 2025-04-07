use super::subtle::{
    AesKeyGenParams, EcKeyGenParams, EcdhDerivParams, HkdfDerivParams, RsaHashedKeyGenParams,
};
use super::subtle_idl_v1::{
    AesMetadata, EcdhMetadata, HkdfMetadata, RsaMetadata, SecpK1Metadata, SecpR1Metadata,
    ShaMetadata,
};
use super::subtle_idl_v1_enums::{
    AesKeyBitsize, AesTagLength, KeyFormat, RsaKeyBitsize, SecpK1KeyBitsize, SecpR1KeyBitsize,
    ShaAlgorithm, ShaDigestBitsize,
};
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Deserialize, Serialize)]
struct KeyFormatWrapper {
    pub format: KeyFormat,
}

pub fn is_valid_hash_algorithm(algorithm: &str) -> bool {
    matches!(
        algorithm,        
              "sha-256"
            | "sha-384"
            | "sha-512"
            | "sha2-256"
            | "sha2-384"
            | "sha2-512"
            | "sha3-256"
            | "sha3-384"
            | "sha3-512"
            | "SHA-256"
            | "SHA-384"
            | "SHA-512"
            | "SHA2-256"
            | "SHA2-384"
            | "SHA2-512"
            | "SHA3-256"
            | "SHA3-384"
            | "SHA3-512"
            | "sha1"
            | "SHA1"
            | "sha1-160"
            | "SHA1-160"
    )
}

pub fn digest_size(algorithm: &str) -> usize {
    match algorithm {
        "sha1" | "SHA1" | "sha1-160" | "SHA1-160" => 20,
        "sha-256" | "SHA-256" | "sha2-256" | "SHA2-256" | "sha3-256" | "SHA3-256" => 32,
        "sha-384" | "SHA-384" | "sha2-384" | "SHA2-384" | "sha3-384" | "SHA3-384" => 48,
        "sha-512" | "SHA-512" | "sha2-512" | "SHA2-512" | "sha3-512" | "SHA3-512" => 64,
        _ => 0,
    }
}

pub fn get_sha_metadata(algorithm: &str) -> Result<ShaMetadata, Box<dyn Error>> {
    match algorithm {
        "sha1" | "SHA1" | "sha1-160" | "SHA1-160" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha2,
            length: ShaDigestBitsize::Sha1,
        }),
        "sha-256" | "SHA-256" | "sha2-256" | "SHA2-256" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha2,
            length: ShaDigestBitsize::Sha256,
        }),
        "sha-384" | "SHA-384" | "sha2-384" | "SHA2-384" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha2,
            length: ShaDigestBitsize::Sha384,
        }),
        "sha-512" | "SHA-512" | "sha2-512" | "SHA2-512" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha2,
            length: ShaDigestBitsize::Sha512,
        }),
        "sha3-256" | "SHA3-256" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha3,
            length: ShaDigestBitsize::Sha256,
        }),
        "sha3-384" | "SHA3-384" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha3,
            length: ShaDigestBitsize::Sha384,
        }),
        "sha3-512" | "SHA3-512" => Ok(ShaMetadata {
            algo_id: ShaAlgorithm::Sha3,
            length: ShaDigestBitsize::Sha512,
        }),
        _ => Err("Invalid hash algorithm".into()),
    }
}

pub fn rsa_bitsize(modulus_length: u32) -> Result<RsaKeyBitsize, Box<dyn Error>> {
    match modulus_length {
        2048 => Ok(RsaKeyBitsize::Rsa2048),
        3072 => Ok(RsaKeyBitsize::Rsa3072),
        4096 => Ok(RsaKeyBitsize::Rsa4096),
        _ => Err("Invalid RSA modulus length".into()),
    }
}

pub fn get_rsa_metadata(params: &RsaHashedKeyGenParams) -> Result<RsaMetadata, Box<dyn Error>> {
    let hash = params.hash.as_str();
    if !is_valid_hash_algorithm(hash) {
        return Err("Invalid hash algorithm".into());
    }

    let digest_size = digest_size(hash);
    if digest_size == 0 {
        return Err("Invalid hash algorithm".into());
    }

    let Ok(rsa_bitsize) = rsa_bitsize(params.modulus_length) else {
        return Err("Invalid RSA modulus length".into());
    };

    let Ok(sha_metadata) = get_sha_metadata(hash) else {
        return Err("Invalid hash algorithm".into());
    };

    Ok(RsaMetadata {
        modulus: rsa_bitsize,
        public_exponent: params.public_exponent,
        sha_metadata,
    })
}

pub fn get_secpr1_metadata(params: &EcKeyGenParams) -> Result<SecpR1Metadata, Box<dyn Error>> {
    match params.named_curve.as_str() {
        "P-256" => Ok(SecpR1Metadata {
            length: SecpR1KeyBitsize::SecpR1256,
        }),
        "P-384" => Ok(SecpR1Metadata {
            length: SecpR1KeyBitsize::SecpR1384,
        }),
        "P-521" => Ok(SecpR1Metadata {
            length: SecpR1KeyBitsize::SecpR1521,
        }),
        _ => Err("Invalid curve name".into()),
    }
}

pub fn get_secpk1_metadata(params: &EcKeyGenParams) -> Result<SecpK1Metadata, Box<dyn Error>> {
    match params.named_curve.as_str() {
        "secp256k1" | "SECP256K1" => Ok(SecpK1Metadata {
            length: SecpK1KeyBitsize::SecpK1256,
        }),
        _ => Err("Invalid curve name".into()),
    }
}

pub fn get_aes_metadata(params: &AesKeyGenParams) -> Result<AesMetadata, Box<dyn Error>> {
    match params.length {
        128 => Ok(AesMetadata {
            length: AesKeyBitsize::Aes128,
        }),
        192 => Ok(AesMetadata {
            length: AesKeyBitsize::Aes192,
        }),
        256 => Ok(AesMetadata {
            length: AesKeyBitsize::Aes256,
        }),
        _ => Err("Invalid AES key length".into()),
    }
}

pub fn get_ecdh_metadata(params: &EcdhDerivParams) -> Result<EcdhMetadata, Box<dyn Error>> {
    Ok(EcdhMetadata {
        public_key: params.public.clone(),
    })
}

pub fn get_hkdf_metadata(params: &HkdfDerivParams) -> Result<HkdfMetadata, Box<dyn Error>> {
    Ok(HkdfMetadata {
        salt: params.salt.clone(),
        info: params.info.clone(),
        hash_info: get_sha_metadata(&params.hash)?,
    })
}

pub fn get_key_format(format: &str) -> Result<KeyFormat, Box<dyn Error>> {
    match format {
        "raw" | "RAW" => Ok(KeyFormat::Raw),
        "pkcs8" | "PKCS8" => Ok(KeyFormat::Pkcs8),
        "spki" | "SPKI" => Ok(KeyFormat::Spki),
        "sec1" | "SEC1" => Ok(KeyFormat::Sec1),
        "pkcs1" | "PKCS1" => Ok(KeyFormat::Pkcs1),
        _ => Err("Invalid key format".into()),
    }
}

pub fn get_aes_tag_length(tag_length: &u32) -> Result<AesTagLength, Box<dyn Error>> {
    match tag_length {
        96 => Ok(AesTagLength::Tag96),
        104 => Ok(AesTagLength::Tag104),
        112 => Ok(AesTagLength::Tag112),
        120 => Ok(AesTagLength::Tag120),
        128 => Ok(AesTagLength::Tag128),
        _ => Err("Invalid tag length".into()),
    }
}
