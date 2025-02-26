use crate::sdk;

pub fn get(param: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::query_context(&param) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into())
    }
}