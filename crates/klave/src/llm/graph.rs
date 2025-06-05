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

pub fn models() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    match sdk::graph_models() {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn tokenizers() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    match sdk::graph_tokenizers() {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn load(input: &str, encoding: i32, target: i32) -> Result<&'static str, Box<dyn std::error::Error>> {
    match sdk::graph_load(input, encoding, target) {
        Ok(_) => Ok(wasi_nn::LoadStatus::LoadedInRam.to_string()),
        Err(err) => Err(err.into()),
    }
}

pub fn load_by_name(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_load_by_name(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn unload_by_name(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_unload_by_name(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn init_execution_context(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_init_execution_context(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn delete_execution_context(context_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_delete_execution_context(context_name) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn delete_all_execution_contexts() -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_delete_all_execution_contexts() {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_model_n_embd(model_name: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::graph_model_n_embd(model_name) {
        Ok(size) => Ok(size),
        Err(err) => Err(err.into()),
    }
}
