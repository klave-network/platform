use crate::sdk;
use anyhow::Result;

pub fn notify(param: &str) {
    sdk::notify(&param);
}

pub fn send_json(json: &str) -> Result<(), Box<dyn std::error::Error>> {
    match serde_json::to_string(&json) {            
        Ok(v) => sdk::notify(&v),
        Err(e) => {
            return Err(e.into());
        }
    };
    Ok(())
}

pub fn notify_error(error: &str) {
    sdk::notify_error(&error);
}

pub fn on_success_notify(message: &str) {
    sdk::on_success_notify(&message);
}