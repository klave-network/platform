use crate::sdk;
use serde::{de::DeserializeOwned, Serialize};
use std::error::Error;

pub struct Table {
    name: String,
}

impl Table {
    /// Create a new Table instance
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
        }
    }

    /// Insert or update a key-value pair with raw bytes
    pub fn set(&self, key: &str, value: &[u8]) -> Result<(), Box<dyn Error>> {
        sdk::write_ledger(&self.name, key.as_bytes(), value).map_err(Into::into)
    }

    /// Insert or update a key-value pair with a string value
    pub fn set_string(&self, key: &str, value: &str) -> Result<(), Box<dyn Error>> {
        self.set(key, value.as_bytes())
    }

    /// Insert an object as a JSON string
    pub fn set_json<T: Serialize>(&self, key: &str, value: &T) -> Result<(), Box<dyn Error>> {
        let json = serde_json::to_string(value)?;
        self.set_string(key, &json)
    }

    /// Retrieve a value as raw bytes
    pub fn get(&self, key: &str) -> Result<Vec<u8>, Box<dyn Error>> {
        sdk::read_ledger(&self.name, key.as_bytes()).map_err(Into::into)
    }

    /// Retrieve a value as a UTF-8 string
    pub fn get_string(&self, key: &str) -> Result<String, Box<dyn Error>> {
        let bytes = self.get(key)?;
        String::from_utf8(bytes).map_err(Into::into)
    }

    /// Retrieve an object by deserializing from JSON
    pub fn get_json<T: DeserializeOwned>(&self, key: &str) -> Result<T, Box<dyn Error>> {
        let json = self.get_string(key)?;
        let obj = serde_json::from_str(&json)?;
        Ok(obj)
    }

    /// List all keys in the table
    pub fn list_keys(&self) -> Result<Vec<String>, Box<dyn Error>> {
        match sdk::list_keys_from_ledger(&self.name) {
            Ok(res) => {
                let v: serde_json::Value = serde_json::from_str(&res)?;
                if let Some(keys) = v["keys"].as_array() {
                    let keys_list = keys
                        .iter()
                        .filter_map(|key| {
                            key.as_array().map(|key_bytes| {
                                key_bytes
                                    .iter()
                                    .filter_map(|b| b.as_u64().map(|byte| byte as u8))
                                    .collect::<Vec<_>>()
                            })
                        })
                        .filter_map(|key| String::from_utf8(key).ok())
                        .collect::<Vec<_>>();
                    Ok(keys_list)
                } else {
                    Err("Invalid format: 'keys' is not an array".into())
                }
            }
            Err(err) => {
                let error_message = format!("Error while listing keys: {err}");
                Err(error_message.into())
            }
        }
    }

    /// Check if a key exists in the table
    pub fn exists(&self, key: &str) -> Result<bool, Box<dyn Error>> {
        sdk::key_exists_in_ledger(&self.name, key.as_bytes()).map_err(Into::into)
    }

    /// Remove a key-value pair from the table
    pub fn remove(&self, key: &str) -> Result<(), Box<dyn Error>> {
        sdk::remove_from_ledger(&self.name, key.as_bytes()).map_err(Into::into)
    }
}

/// Retrieve a Table instance
pub fn get_table(table: &str) -> Table {
    Table::new(table)
}
