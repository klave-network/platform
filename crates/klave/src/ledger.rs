use crate::sdk;
use serde_json::Value;
use anyhow::Result;

pub struct Table {
    // Define the fields for the Table struct
    name: String
}

impl Table {
    // Constructor to create a new Table
    pub fn new(name: &str) -> Self {
        Table {
            name: name.to_string()
        }
    }

    // Method to set a key-value pair into the table
    pub fn set(&mut self, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error>> {
        match sdk::write_ledger(&self.name, key.as_bytes(), value.as_bytes()) {
            Ok(_) => Ok(()),
            Err(err) => Err(err.into())
        }
    }

    pub fn set_from_json(&mut self, cmd: &str) -> Result<(), Box<dyn std::error::Error>> {
        let Ok(v) = serde_json::from_str::<Value>(&cmd) else {            
            return Err(format!("failed to parse '{}' as json", cmd).into());
        };

        let key = v["key"].as_str().expect("key is required");
        let value = v["value"].as_str().expect("value is required");

        match self.set(key, value) {
            Ok(_) => Ok(()),
            Err(err) => Err(err.into())
        }
    }


    // Method to get a value by key from the table
    pub fn get(&self, key: &str) -> Result<String, Box<dyn std::error::Error>> {
        match sdk::read_ledger(&self.name, key.as_bytes()) {
            Ok(result) => Ok(String::from_utf8(result).unwrap()),
            Err(err) => Err(err.into())
        }
    }

    // Method to remove a key-value pair from the table
    pub fn remove(&mut self, key: &str) -> Result<(), Box<dyn std::error::Error>> {
        match sdk::remove_from_ledger(&self.name, key.as_bytes()) {
            Ok(_) => Ok(()),
            Err(err) => Err(err.into())
        }
    }
}

pub fn get_table(table: &str) -> Table {
    Table::new(table)
}
