use crate::sdk;

pub struct Connection {
    handle: String,
}

impl Connection {
    pub fn connection_string(host: &str, dbname: &str, user: &str, password: &str) -> String {
        format!("host={host} dbname={dbname} user={user} password={password}")
    }

    pub fn open(uri: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let handle = sdk::connection_open(uri)?;
        Ok(Connection { handle })
    }

    fn normalise_sql(input: &str) -> Result<String, Box<dyn std::error::Error>> {
        let normalized = input.split_whitespace().collect::<Vec<_>>().join(" ");

        if normalized.is_empty() {
            return Err("SQL input cannot be empty".into());
        }

        Ok(normalized)
    }

    pub fn query(&self, query: &str) -> Result<String, Box<dyn std::error::Error>> {
        let query = Self::normalise_sql(query)?;
        sdk::sql_query(&self.handle, &query).map_err(Into::into)
    }

    pub fn execute(&self, command: &str) -> Result<String, Box<dyn std::error::Error>> {
        let command = Self::normalise_sql(command)?;
        sdk::sql_exec(&self.handle, &command).map_err(Into::into)
    }
}
