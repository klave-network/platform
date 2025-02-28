
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
        hostname: request.uri().host().ok_or("Missing host in URI")?.to_string(),
        port: i32::from(port),
        path: request.uri().path().to_string(),
        version: format!("{:?}", request.version()),
        headers: request.headers().iter().map(|(name, value)| vec![name.as_str().to_string(), value.to_str().unwrap().to_string()]).collect(),
        body: request.body().to_string()
    };

    let http_request_str = serde_json::to_string(&http_request)?;

    let response = sdk::https_query(&http_request_str)?;

    let http_response: HttpResponse<String> = serde_json::from_str(&response)?;

    let mut parts = Response::new(String::new()).into_parts().0;

    parts.headers = http_response.headers.iter()
        .map(|header| {
            match (header.get(0), header.get(1)) {
                (Some(name), Some(value)) => {
                    let parsed_name = name.parse::<http::header::HeaderName>()
                        .map_err(|e| format!("Failed to parse header name '{}': {}", name, e))?;
                    let parsed_value = value.parse::<http::header::HeaderValue>()
                        .map_err(|e| format!("Failed to parse header value '{}': {}", value, e))?;
                    Ok((parsed_name, parsed_value))
                },
                _ => Err::<_, String>("Malformed header entry: missing name or value".into())
            }
        }).collect::<Result<http::HeaderMap, _>>()?;
    
    parts.status = StatusCode::from_u16(http_response.status_code as u16)?;
    parts.version = request.version();

    let response = Response::from_parts(parts, http_response.body);
    Ok(response)
}
