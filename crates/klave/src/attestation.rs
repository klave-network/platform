use crate::sdk;

pub fn get_quote(challenge: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::get_quote(challenge) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn verify_quote(current_time: &str, binary_quote: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::verify_quote(current_time, binary_quote) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}
