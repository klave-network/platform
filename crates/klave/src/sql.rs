use crate::sdk;

pub fn connection_open(uri: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::connection_open(uri) {
        Ok(opaque_handle) => Ok(opaque_handle),
        Err(err) => Err(err.into()),
    }
}

pub fn query(connection: &str, query: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::sql_query(connection, query) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn execute(connection: &str, query: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::sql_exec(connection, query) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}
