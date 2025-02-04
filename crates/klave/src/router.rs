use crate::sdk;

pub fn add_user_query(query_function_name: &str) {
    sdk::add_user_query(&query_function_name);    
}

pub fn add_user_transaction(transaction_function_name: &str) {
    sdk::add_user_transaction(&transaction_function_name);    
}

pub fn cancel_transaction() {
    sdk::cancel_transaction();    
}