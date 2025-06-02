//! Environment definitions for compiling Klave Trustless Applications.
//! LLM module for Klave SDK
use crate::sdk;

// Re-export the IDL modules
pub use crate::llm::llama2_idl_v1 as llama2;
pub use crate::llm::wasi_nn_idl_v1 as wasi_nn;

impl wasi_nn::LoadStatus {
    fn to_string(&self) -> &'static str {
        match self {
            wasi_nn::LoadStatus::LoadedInRam => "LOADED_IN_RAM",
            wasi_nn::LoadStatus::UnloadedFromRam => "UNLOADED_FROM_RAM",
            wasi_nn::LoadStatus::Failed => "FAILED",
        }
    }
}

pub fn graph_models() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    match sdk::graph_models() {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_tokenizers() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    match sdk::graph_tokenizers() {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_load(input: &str, encoding: i32, target: i32) -> Result<&'static str, Box<dyn std::error::Error>> {
    match sdk::graph_load(input, encoding, target) {
        Ok(_) => Ok(wasi_nn::LoadStatus::LoadedInRam.to_string()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_load_by_name(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_load_by_name(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_unload_by_name(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_unload_by_name(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_init_execution_context(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_init_execution_context(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_delete_execution_context(context_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_delete_execution_context(context_name) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_delete_all_execution_contexts() -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_delete_all_execution_contexts() {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_compute(input: &str, input_tensor: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_compute(input, input_tensor) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_add_prompt(context_name: &str, prompt: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::inference_add_prompt(context_name, prompt) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_get_piece(context_name: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_get_piece(context_name) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_get_aggregate_embeddings(context_name: &str, window_size: i32, agg_rule: i32) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_get_aggregate_embeddings(context_name, window_size, agg_rule) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_encode(context_name: &str, prompt: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_encode(context_name, prompt) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_decode(context_name: &str, token_ids: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_decode(context_name, token_ids) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_ingest(context_name: &str, token_ids: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::inference_ingest(context_name, token_ids) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}