
use http::{Request, Response};
use super::https::{self, Protocol};

/// Send a http request
pub fn request(request: &Request<String>) -> Result<Response<String>, Box<dyn std::error::Error>>
{
    return https::request_impl(request, Some(Protocol::Http));
}