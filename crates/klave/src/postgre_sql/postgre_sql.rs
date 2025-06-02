//! Environment definitions for compiling Klave Trustless Applications.
//! LLM module for Klave SDK
use crate::sdk;

pub fn pgsql_connection_open(uri: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::pgsql_connection_open(uri) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn pgsql_query(connection: &str, query: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::pgsql_query(connection, query) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn pgsql_execute(connection: &str, query: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::pgsql_exec(connection, query) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}
