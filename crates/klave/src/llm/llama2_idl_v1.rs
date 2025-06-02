//! Environment definitions for compiling Klave Trustless Applications.
//! LLM module for Klave SDK

use serde::{Deserialize, Serialize};

// Assuming these are defined in your wasi_nn_idl_v1 module
use crate::llm::wasi_nn_idl_v1::{GraphEncoding, TensorType};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum EncryptionType {
    None = 0,
    AesGcm = 1,
    AesCtr = 2,
    AesEcb = 3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum HashType {
    None = 0,
    Sha1 = 1,
    Sha2256 = 2,
    Sha2384 = 3,
    Sha2512 = 4,
    Sha3256 = 5,
    Sha3384 = 6,
    Sha3512 = 7,
    Md5 = 8,
    Cmac128 = 11,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Model {
    pub name: String,
    pub tokenizer_name: String,
    pub local_path: String,
    pub url: String,
    pub description: String,
    pub model_format: GraphEncoding,
    pub tensor_type: TensorType,
    pub encryption_type: EncryptionType,
    pub encryption_key: Vec<u8>,
    pub hash_type: HashType,
    pub hash: Vec<u8>,
    pub is_loaded: bool,
    pub system_prompt: Vec<u8>,
    pub max_threads: i16,
    pub max_conccurent_queries: i16,
    pub max_conccurent_queries_per_user: i16,
    pub inactivitiy_timeout: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tokenizer {
    pub name: String,
    pub local_path: String,
    pub url: String,
    pub description: String,
    pub model_format: GraphEncoding,
    pub tensor_type: TensorType,
    pub encryption_type: EncryptionType,
    pub encryption_key: Vec<u8>,
    pub hash_type: HashType,
    pub hash: Vec<u8>,
    pub is_loaded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphBuilder {
    pub model: Model,
    pub tokenizer: Tokenizer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphInitContext {
    pub model_name: String,
    pub context_name: String,
    pub system_prompt: String,
    pub temperature: f32,  // 0.0 = greedy deterministic. 1.0 = original. don't set higher
    pub topp: f32,         // top-p in nucleus sampling. 1.0 = off. 0.9 works well, but slower
    pub steps: i32,        // number of steps to run for
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceIteration {
    pub piece: Vec<u8>,
    pub complete: bool,
}