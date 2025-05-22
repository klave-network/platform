use crate::sdk;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetQuoteResponse {
    pub quote: SgxQuote3,
    pub quote_binary: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SgxQuote3 {
    pub header: SgxQuoteHeader,
    pub report_body: SgxReportBody,
    pub signature_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SgxQuoteHeader {
    pub version: u16,
    pub att_key_type: u16,
    pub att_key_data_0: u32,
    pub qe_svn: u16,
    pub pce_svn: u16,
    pub vendor_id: Vec<u8>,
    pub user_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SgxReportBody {
    pub cpu_svn: Vec<u8>,
    pub misc_select: u32,
    pub reserved1: Vec<u8>,
    pub isv_ext_prod_id: Vec<u8>,
    pub attributes: SgxAttributes,
    pub mr_enclave: Measurement,
    pub reserved2: Vec<u8>,
    pub mr_signer: Measurement,
    pub reserved3: Vec<u8>,
    pub config_id: Vec<u8>,
    pub isv_prod_id: u16,
    pub isv_svn: u16,
    pub config_svn: u16,
    pub reserved4: Vec<u8>,
    pub isv_family_id: Vec<u8>,
    pub report_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SgxAttributes {
    pub flags: u64,
    pub xfrm: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Measurement {
    pub m: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyQuoteResponse
{
    collateral_expiration_status: u32,
    quote_verification_result: i32,
    quote_verification_result_description: String,
    sa_list: Option<String>,
    supp_data: TeeSuppDataDescriptor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeeSuppDataDescriptor
{
    major_version: u16,
    data: Vec<u8>,
}

pub fn get_quote(challenge: &[u8]) -> Result<GetQuoteResponse, Box<dyn std::error::Error>> {
    let quote_str = sdk::get_quote(challenge)
        .map_err(|e| -> String {format!("Failed to get quote: {}", e).into()})?;

    //Deserialize the quote into a GetQuoteResponse
    let quote_response: GetQuoteResponse = serde_json::from_str(&quote_str)
        .map_err(|e| -> String {format!("Failed to deserialize quote: {}", e).into()})?;

    Ok(quote_response)
}

pub fn verify_quote(quote: &[u8], current_time: i64) -> Result<VerifyQuoteResponse, Box<dyn std::error::Error>> {

    let response_str = sdk::verify_quote(current_time, quote)
        .map_err(|e| -> String {format!("Failed to verify quote: {}", e).into()})?;

    //Deserialize the response into a VerifyQuoteResponse
    let response: VerifyQuoteResponse = serde_json::from_str(&response_str)
        .map_err(|e| -> String {format!("Failed to deserialize response: {}", e).into()})?;

    Ok(response)
}
