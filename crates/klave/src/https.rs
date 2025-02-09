
use serde::{Deserialize, Serialize};
use http::{Request, Response, StatusCode};
use std::fmt::Display;
use crate::sdk;

#[derive(Deserialize, Serialize, Debug)]
pub struct HttpRequest<T>
{
    method: String,
    hostname: String,
    port: i32,
    path: String,
    version: String,
    headers: Vec<Vec<String>>,
    body: T
}

impl Display for HttpRequest<String> {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "HttpRequest: method: {}, hostname: {}, port: {}, path: {}, version: {}, headers: {:?}, body: {}", self.method, self.hostname, self.port, self.path, self.version, self.headers, self.body)
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct HttpResponse<T>
{
    status_code: i32,
    headers: Vec<Vec<String>>,
    body: T
}

impl Display for HttpResponse<String> {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "HttpResponse: status_code: {}, headers: {:?}, body: {}", self.status_code, self.headers, self.body)
    }
}

/// Send a http request
pub fn request(request: &Request<String>) -> Result<Response<String>, Box<dyn std::error::Error>>
{
    let port = match request.uri().port() {
        Some(port) => port.as_u16(),
        None => 443
    };

    let http_request = HttpRequest {
        method: request.method().as_str().to_string(),
        hostname: request.uri().host().unwrap().to_string(),
        port: i32::from(port),
        path: request.uri().path().to_string(),
        version: format!("{:?}", request.version()),
        headers: request.headers().iter().map(|(name, value)| vec![name.as_str().to_string(), value.to_str().unwrap().to_string()]).collect(),
        body: request.body().to_string()
    };


    let http_request_str = match serde_json::to_string(&http_request) {
        Ok(http_request_str) => http_request_str,
        Err(e) => return Err(e.into())
    };

    let response = match sdk::https_query(&http_request_str){
        Ok(response) => response,
        Err(err) => return Err(err.into())
    };
    
    let http_response: HttpResponse<String> = match serde_json::from_str(&response){
        Ok(http_response) => http_response,
        Err(e) => return Err(e.into())
    };

    let mut parts = Response::new(String::new()).into_parts().0;
    parts.headers = http_response.headers.iter().map(|header| (
        header[0].parse::<http::header::HeaderName>().unwrap(),
        header[1].parse::<http::header::HeaderValue>().unwrap()
    )).collect();
    parts.status = StatusCode::from_u16(http_response.status_code as u16).unwrap();
    parts.version = request.version();

    let response = Response::from_parts(parts, http_response.body);
    Ok(response)
}
