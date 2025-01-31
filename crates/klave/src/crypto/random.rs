use crate::sdk;

pub fn get_random_bytes(size: i32) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    match sdk::get_random_bytes(size) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into())
    }
}