use std::error::Error;
use super::subtle;

pub fn digest(algorithm: &str, text: &[u8]) -> Result<Vec<u8>, Box<dyn Error>> {        
    match subtle::digest(&algorithm, &text) {
        Ok(result) => Ok(result),
        Err(err) => Err(err)
    }
}
