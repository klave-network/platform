use serde::de::{self, Visitor};
/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;

macro_rules! serialize_copy {
    ($($type:ty),*) => {
        $(
            impl Serialize for $type {
                fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
                where
                    S: Serializer,
                {
                    serializer.serialize_u32(self.clone() as u32)
                }
            }
        )*
    };
}

macro_rules! deserialize_copy {
    ($($type:ty, $visitor:ident, $($matcher:pat $(if $pred:expr)* => $result:expr),*);*) => {
        $(
            struct $visitor;

            impl<'de> Visitor<'de> for $visitor {
                type Value = $type;

                fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                    formatter.write_str("a valid $type variant")
                }

                fn visit_u32<E>(self, value: u32) -> Result<$type, E>
                where
                    E: de::Error,
                {
                    match value {
                        $($matcher $(if $pred)* => $result),*
                    }
                }
            }

            impl<'de> Deserialize<'de> for $type {
                fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
                where
                    D: Deserializer<'de>,
                {
                    deserializer.deserialize_u32($visitor)
                }
            }
        )*
    }
}

#[derive(Debug, Clone)]
pub enum KeyAlgorithm {
    SecpR1 = 0,
    SecpK1 = 1,
    Aes = 2,
    Rsa = 3,
    Hmac = 4,
}

serialize_copy!(KeyAlgorithm);
deserialize_copy!(KeyAlgorithm,
    KeyAlgorithmVisitor,
    0 => Ok(KeyAlgorithm::SecpR1),
    1 => Ok(KeyAlgorithm::SecpK1),
    2 => Ok(KeyAlgorithm::Aes),
    3 => Ok(KeyAlgorithm::Rsa),
    _ => Err(de::Error::custom("invalid KeyAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum EncryptionAlgorithm {
    AesGcm,
    RsaOaep,
    RsaPkcs1V1_5,
}
serialize_copy!(EncryptionAlgorithm);
deserialize_copy!(EncryptionAlgorithm,
    EncryptionAlgorithmVisitor,
    0 => Ok(EncryptionAlgorithm::AesGcm),
    1 => Ok(EncryptionAlgorithm::RsaOaep),
    2 => Ok(EncryptionAlgorithm::RsaPkcs1V1_5),
    _ => Err(de::Error::custom("invalid EncryptionAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum WrappingAlgorithm {
    AesKw,
    AesGcm,
    RsaOaep,
    RsaPkcs1V1_5,
}
serialize_copy!(WrappingAlgorithm);
deserialize_copy!(WrappingAlgorithm,
    WrappingAlgorithmVisitor,
    0 => Ok(WrappingAlgorithm::AesKw),
    1 => Ok(WrappingAlgorithm::AesGcm),
    2 => Ok(WrappingAlgorithm::RsaOaep),
    3 => Ok(WrappingAlgorithm::RsaPkcs1V1_5),
    _ => Err(de::Error::custom("invalid WrappingAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum SigningAlgorithm {
    Ecdsa,
    Schnorr,
    RsaPss,
    Hmac,
}
serialize_copy!(SigningAlgorithm);
deserialize_copy!(SigningAlgorithm,
    SigningAlgorithmVisitor,
    0 => Ok(SigningAlgorithm::Ecdsa),
    1 => Ok(SigningAlgorithm::Schnorr),
    2 => Ok(SigningAlgorithm::RsaPss),
    _ => Err(de::Error::custom("invalid SigningAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum DerivationAlgorithm {
    Ecdh = 0,
    Hkdf = 1,
}

serialize_copy!(DerivationAlgorithm);
deserialize_copy!(DerivationAlgorithm,
    DerivationAlgorithmVisitor,
    0 => Ok(DerivationAlgorithm::Ecdh),
    1 => Ok(DerivationAlgorithm::Hkdf),
    _ => Err(de::Error::custom("invalid DerivationAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum DerivedKeyUsageAlgorithm {
    Aes = 0,
    Hmac = 1,
}

serialize_copy!(DerivedKeyUsageAlgorithm);
deserialize_copy!(DerivedKeyUsageAlgorithm,
    DerivedKeyUsageAlgorithmVisitor,
    0 => Ok(DerivedKeyUsageAlgorithm::Aes),
    1 => Ok(DerivedKeyUsageAlgorithm::Hmac),
    _ => Err(de::Error::custom("invalid DerivedKeyUsageAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum HashAlgorithm {
    Sha = 0,
    Tagged = 1,
}

serialize_copy!(HashAlgorithm);
deserialize_copy!(HashAlgorithm,
    HashAlgorithmVisitor,
    0 => Ok(HashAlgorithm::Sha),
    1 => Ok(HashAlgorithm::Tagged),
    _ => Err(de::Error::custom("invalid HashAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum ShaAlgorithm {
    None = 0,
    Sha2 = 1,
    Sha3 = 2,
    Sha1 = 3,
}

serialize_copy!(ShaAlgorithm);
deserialize_copy!(ShaAlgorithm,
    ShaAlgorithmVisitor,
    0 => Ok(ShaAlgorithm::None),
    1 => Ok(ShaAlgorithm::Sha2),
    2 => Ok(ShaAlgorithm::Sha3),
    3 => Ok(ShaAlgorithm::Sha1),
    _ => Err(de::Error::custom("invalid ShaAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum TaggedShaAlgorithm {
    None = 0,
    Sha2 = 1,
    Sha3 = 2,
}

serialize_copy!(TaggedShaAlgorithm);
deserialize_copy!(TaggedShaAlgorithm,
    TaggedShaAlgorithmVisitor,
    0 => Ok(TaggedShaAlgorithm::None),
    1 => Ok(TaggedShaAlgorithm::Sha2),
    2 => Ok(TaggedShaAlgorithm::Sha3),
    _ => Err(de::Error::custom("invalid TaggedShaAlgorithm variant"))
);

#[derive(Debug, Clone)]
pub enum ShaDigestBitsize {
    Sha256 = 256,
    Sha384 = 384,
    Sha512 = 512,
    Sha1 = 160,
}

serialize_copy!(ShaDigestBitsize);
deserialize_copy!(ShaDigestBitsize,
    ShaDigestBitsizeVisitor,
    256 => Ok(ShaDigestBitsize::Sha256),
    384 => Ok(ShaDigestBitsize::Sha384),
    512 => Ok(ShaDigestBitsize::Sha512),
    160 => Ok(ShaDigestBitsize::Sha1),
    _ => Err(de::Error::custom("invalid ShaDigestBitsize variant"))
);

#[derive(Debug, Clone)]
pub enum SecpR1KeyBitsize {
    SecpR1256 = 256,
    SecpR1384 = 384,
    SecpR1521 = 521,
}

serialize_copy!(SecpR1KeyBitsize);
deserialize_copy!(SecpR1KeyBitsize,
    SecpR1KeyBitsizeVisitor,
    256 => Ok(SecpR1KeyBitsize::SecpR1256),
    384 => Ok(SecpR1KeyBitsize::SecpR1384),
    521 => Ok(SecpR1KeyBitsize::SecpR1521),
    _ => Err(de::Error::custom("invalid SecpR1KeyBitsize variant"))
);

#[derive(Debug, Clone)]
pub enum SecpK1KeyBitsize {
    SecpK1256 = 256,
}

serialize_copy!(SecpK1KeyBitsize);
deserialize_copy!(SecpK1KeyBitsize,
    SecpK1KeyBitsizeVisitor,
    256 => Ok(SecpK1KeyBitsize::SecpK1256),
    _ => Err(de::Error::custom("invalid SecpK1KeyBitsize variant"))
);

#[derive(Debug, Clone)]
pub enum AesKeyBitsize {
    Aes128 = 128,
    Aes192 = 192,
    Aes256 = 256,
}

serialize_copy!(AesKeyBitsize);
deserialize_copy!(AesKeyBitsize,
    AesKeyBitsizeVisitor,
    128 => Ok(AesKeyBitsize::Aes128),
    192 => Ok(AesKeyBitsize::Aes192),
    256 => Ok(AesKeyBitsize::Aes256),
    _ => Err(de::Error::custom("invalid AesKeyBitsize variant"))
);

#[derive(Debug, Clone)]
pub enum RsaKeyBitsize {
    Rsa2048 = 2048,
    Rsa3072 = 3072,
    Rsa4096 = 4096,
}

serialize_copy!(RsaKeyBitsize);
deserialize_copy!(RsaKeyBitsize,
    RsaKeyBitsizeVisitor,
    2048 => Ok(RsaKeyBitsize::Rsa2048),
    3072 => Ok(RsaKeyBitsize::Rsa3072),
    4096 => Ok(RsaKeyBitsize::Rsa4096),
    _ => Err(de::Error::custom("invalid RsaKeyBitsize variant"))
);

#[derive(Debug, Clone)]
pub enum SubtleKeyUsage {
    Encrypt = 0,
    Decrypt = 1,
    Sign = 2,
    Verify = 3,
    DeriveKey = 4,
    DeriveBits = 5,
    WrapKey = 6,
    UnwrapKey = 7,
}

serialize_copy!(SubtleKeyUsage);
deserialize_copy!(SubtleKeyUsage,
    SubtleKeyUsageVisitor,
    0 => Ok(SubtleKeyUsage::Encrypt),
    1 => Ok(SubtleKeyUsage::Decrypt),
    2 => Ok(SubtleKeyUsage::Sign),
    3 => Ok(SubtleKeyUsage::Verify),
    4 => Ok(SubtleKeyUsage::DeriveKey),
    5 => Ok(SubtleKeyUsage::DeriveBits),
    6 => Ok(SubtleKeyUsage::WrapKey),
    7 => Ok(SubtleKeyUsage::UnwrapKey),
    _ => Err(de::Error::custom("invalid SubtleKeyUsage variant"))
);

#[derive(Debug, Clone)]
pub enum AesTagLength {
    Tag96 = 12,
    Tag104 = 13,
    Tag112 = 14,
    Tag120 = 15,
    Tag128 = 16,
}

serialize_copy!(AesTagLength);
deserialize_copy!(AesTagLength,
    AesTagLengthVisitor,
    12 => Ok(AesTagLength::Tag96),
    13 => Ok(AesTagLength::Tag104),
    14 => Ok(AesTagLength::Tag112),
    15 => Ok(AesTagLength::Tag120),
    16 => Ok(AesTagLength::Tag128),
    _ => Err(de::Error::custom("invalid AesTagLength variant"))
);

#[derive(Debug, Clone)]
pub enum KeyUsage {
    None = 0,
    Encrypt = 1,
    Decrypt = 2,
    Sign = 4,
    Verify = 8,
    DeriveKey = 16,
    DeriveBits = 32,
    WrapKey = 64,
    UnwrapKey = 128,
}

serialize_copy!(KeyUsage);
deserialize_copy!(KeyUsage,
    KeyUsageVisitor,
    0 => Ok(KeyUsage::None),
    1 => Ok(KeyUsage::Encrypt),
    2 => Ok(KeyUsage::Decrypt),
    4 => Ok(KeyUsage::Sign),
    8 => Ok(KeyUsage::Verify),
    16 => Ok(KeyUsage::DeriveKey),
    32 => Ok(KeyUsage::DeriveBits),
    64 => Ok(KeyUsage::WrapKey),
    128 => Ok(KeyUsage::UnwrapKey),
    _ => Err(de::Error::custom("invalid KeyUsage variant"))
);

#[derive(Debug, Clone)]
pub enum KeyFormat {
    Raw = 0,
    Spki = 1,
    Pkcs8 = 2,
    Jwk = 3,
    Sec1 = 4,
    Pkcs1 = 5,
}

serialize_copy!(KeyFormat);
deserialize_copy!(KeyFormat,
    KeyFormatVisitor,
    0 => Ok(KeyFormat::Raw),
    1 => Ok(KeyFormat::Spki),
    2 => Ok(KeyFormat::Pkcs8),
    3 => Ok(KeyFormat::Jwk),
    4 => Ok(KeyFormat::Sec1),
    5 => Ok(KeyFormat::Pkcs1),
    _ => Err(de::Error::custom("invalid KeyFormat variant"))
);
