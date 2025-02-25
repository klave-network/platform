use crate::sdk;
use anyhow::Result;
use serde::{Serialize, de::DeserializeOwned};

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
    pub fn set(&mut self, key: &str, value: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
        sdk::write_ledger(&self.name, key.as_bytes(), value).map_err(Into::into)
    }

    /// Insert or update a key-value pair with a string value
    pub fn set_string(&mut self, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error>> {
        self.set(key, value.as_bytes()) // Reusing `set()`
    }

    /// Insert an object as a JSON string
    pub fn set_json<T: Serialize>(&mut self, key: &str, value: &T) -> Result<(), Box<dyn std::error::Error>> {
        let json = serde_json::to_string(value)?; // Convert struct to JSON string
        self.set_string(key, &json)
    }

    /// Retrieve a value as raw bytes
    pub fn get(&self, key: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        sdk::read_ledger(&self.name, key.as_bytes()).map_err(Into::into)
    }

    /// Retrieve a value as a UTF-8 string
    pub fn get_string(&self, key: &str) -> Result<String, Box<dyn std::error::Error>> {
        let bytes = self.get(key)?; // Reusing `get()`
        String::from_utf8(bytes).map_err(Into::into)
    }

    /// Retrieve an object by deserializing from JSON
    pub fn get_json<T: DeserializeOwned>(&self, key: &str) -> Result<T, Box<dyn std::error::Error>> {
        let json = self.get_string(key)?; // Retrieve JSON as string
        let obj = serde_json::from_str(&json)?; // Convert JSON string to object
        Ok(obj)
    }

    /// Remove a key-value pair from the table
    pub fn remove(&mut self, key: &str) -> Result<(), Box<dyn std::error::Error>> {
        sdk::remove_from_ledger(&self.name, key.as_bytes()).map_err(Into::into)
    }
}

/// Retrieve a Table instance
pub fn get_table(table: &str) -> Table {
    Table::new(table)
}
