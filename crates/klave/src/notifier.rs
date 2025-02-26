use crate::sdk;
use serde::Serialize;

pub fn send_string(param: &str) {
    sdk::notify(&param);
}

pub fn send_json<T: Serialize>(value: &T) -> Result<(), Box<dyn std::error::Error>> {
    let json = serde_json::to_string(value)?; // Convert struct to JSON string
    sdk::notify(&json);
    Ok(())
}

pub fn on_success_notify(message: &str) {
    sdk::on_success_notify(&message);
}