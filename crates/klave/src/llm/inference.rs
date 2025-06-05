//! Environment definitions for compiling Klave Trustless Applications.
//! LLM module for Klave SDK
use crate::sdk;

pub fn compute(input: &str, input_tensor: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_compute(input, input_tensor) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn add_prompt(context_name: &str, prompt: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::inference_add_prompt(context_name, prompt) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn get_piece(context_name: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_get_piece(context_name) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn model_n_embd(context_name: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::inference_model_n_embd(context_name) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn get_aggregate_embeddings(context_name: &str, window_size: i32, agg_rule: i32) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_get_aggregate_embeddings(context_name, window_size, agg_rule) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn encode(context_name: &str, prompt: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_encode(context_name, prompt) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn decode(context_name: &str, token_ids: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::inference_decode(context_name, token_ids) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn ingest(context_name: &str, token_ids: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::inference_ingest(context_name, token_ids) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}