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