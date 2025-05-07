use crate::sdk;

pub fn load_lightgbm_model(name: &str, model: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::load_lightgbm_model(name, model) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn unload_lightgbm_model(name: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::unload_lightgbm_model(name) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn infer_from_lightgbm_model(
    name: &str,
    data: Vec<f64>,
    nb_outputs: i32,
) -> Result<Vec<f64>, Box<dyn std::error::Error>> {
    match sdk::infer_from_lightgbm_model(name, &data, nb_outputs) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_load(input: &str, encoding: i32, target: i32) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_load(input, encoding, target) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_load_by_name(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_load_by_name(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn graph_init_execution_context(input: &str) -> Result<(), Box<dyn std::error::Error>> {
    match sdk::graph_init_execution_context(input) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

pub fn inference_compute(input: &str, input_tensor: &str) -> Result<String, Box<dyn std::error::Error>> {
    match sdk::inference_compute(input, input_tensor) {
        Ok(result) => Ok(result),
        Err(err) => Err(err.into()),
    }
}
