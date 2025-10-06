use crate::sdk;
use serde::{Deserialize, Deserializer, Serialize};

#[derive(Deserialize)]
#[serde(untagged)]
enum VecWrapper {
    Data { data: Vec<u8> },
    Rand { rand: Vec<u8> },
}

fn deserialize_vec_u8<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
where
    D: Deserializer<'de>,
{
    let wrapper = VecWrapper::deserialize(deserializer)?;
    match wrapper {
        VecWrapper::Data { data } => Ok(data),
        VecWrapper::Rand { rand } => Ok(rand),
    }
}

fn deserialize_vec_of_vec_u8<'de, D>(deserializer: D) -> Result<Vec<Vec<u8>>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    struct Wrapper {
        data: Vec<u8>,
    }

    let wrappers: Vec<Wrapper> = Vec::deserialize(deserializer)?;
    Ok(wrappers.into_iter().map(|tm| tm.data).collect())
}

fn deserialize_vec_u32<'de, D>(deserializer: D) -> Result<Vec<u32>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    struct Wrapper {
        a: Vec<u32>,
    }

    let wrapper = Wrapper::deserialize(deserializer)?;
    Ok(wrapper.a)
}

fn deserialize_nested_u16<'de, D>(deserializer: D) -> Result<u16, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    struct Inner {
        data: u16,
    }

    let inner = Inner::deserialize(deserializer)?;
    Ok(inner.data)
}

fn deserialize_nested_u32<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    struct Inner {
        data: u32,
    }

    let inner = Inner::deserialize(deserializer)?;
    Ok(inner.data)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote3 {
    pub header: Quote3Header,
    pub report_body: ReportBody,
    pub signature_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote3Header {
    pub version: u16,
    pub att_key_type: u16,
    pub att_key_data_0: u32,
    #[serde(deserialize_with = "deserialize_nested_u16")]
    pub qe_svn: u16,
    #[serde(deserialize_with = "deserialize_nested_u16")]
    pub pce_svn: u16,
    pub vendor_id: Vec<u8>,
    pub user_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportBody {
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub cpu_svn: Vec<u8>,
    #[serde(deserialize_with = "deserialize_nested_u32")]
    pub misc_select: u32,
    pub reserved1: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub isv_ext_prod_id: Vec<u8>,
    pub attributes: QuoteAttributes,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_enclave: Vec<u8>,
    pub reserved2: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_signer: Vec<u8>,
    pub reserved3: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub config_id: Vec<u8>,
    #[serde(deserialize_with = "deserialize_nested_u16")]
    pub isv_prod_id: u16,
    #[serde(deserialize_with = "deserialize_nested_u16")]
    pub isv_svn: u16,
    #[serde(deserialize_with = "deserialize_nested_u16")]
    pub config_svn: u16,
    pub reserved4: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub isv_family_id: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub report_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteAttributes {
    pub flags: u64,
    pub xfrm: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote4 {
    pub header: Quote4Header,
    pub report_body: Report2Body,
    pub signature_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote4Header {
    pub version: u16,
    pub att_key_type: u16,
    pub tee_type: u32,
    pub reserved: u32,
    pub vendor_id: Vec<u8>,
    pub user_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report2Body {
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub tee_tcb_svn: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_seam: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_signer_seam: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u32")]
    pub seam_attributes: Vec<u32>,
    #[serde(deserialize_with = "deserialize_vec_u32")]
    pub td_attributes: Vec<u32>,
    #[serde(deserialize_with = "deserialize_vec_u32")]
    pub xfam: Vec<u32>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_td: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_config_id: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_owner: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_owner_config: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_of_vec_u8")]
    pub rt_mr: Vec<Vec<u8>>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub report_data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QlQeReportInfo {
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub nonce: Vec<u8>,
    pub enclave_target_info: TargetInfo,
    pub qe_report: Report,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetInfo {
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mr_enclave: Vec<u8>,
    pub attributes: QuoteAttributes,
    pub reserved1: Vec<u8>,
    #[serde(deserialize_with = "deserialize_nested_u16")]
    pub config_svn: u16,
    #[serde(deserialize_with = "deserialize_nested_u32")]
    pub misc_select: u32,
    pub reserved2: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub config_id: Vec<u8>,
    pub reserved3: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub body: ReportBody,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub key_id: Vec<u8>,
    #[serde(deserialize_with = "deserialize_vec_u8")]
    pub mac: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyQuoteResponse {
    pub collateral_expiration_status: u32,
    pub quote_verification_result: i32,
    pub qve_report_info: QlQeReportInfo,
    pub quote_verification_result_description: String,
    pub sa_list: Option<String>,
    pub supp_data: TeeSuppDataDescriptor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeeSuppDataDescriptor {
    pub major_version: u16,
    pub data: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "version")]
pub enum Quote {
    V3(Quote3),
    V4(Quote4),
}

pub fn get_quote(challenge: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let quote_bytes =
        sdk::get_quote(challenge).map_err(|e| -> String { format!("Failed to get quote: {e}") })?;

    Ok(quote_bytes)
}

pub fn verify_quote(
    quote: &[u8],
    current_time: i64,
) -> Result<VerifyQuoteResponse, Box<dyn std::error::Error>> {
    let response_str = sdk::verify_quote(current_time, quote)
        .map_err(|e| -> String { format!("Failed to verify quote: {e}") })?;

    //Deserialize the response into a VerifyQuoteResponse
    let response: VerifyQuoteResponse = serde_json::from_str(&response_str)
        .map_err(|e| -> String { format!("Failed to deserialize response: {e}") })?;

    Ok(response)
}

pub fn parse_quote(quote: &[u8]) -> Result<Quote, Box<dyn std::error::Error>> {
    let version = quote.first().ok_or("Quote is empty")?;

    let quote_parsed_string =
        sdk::parse_quote(quote).map_err(|e| format!("Failed to parse quote: {e}"))?;

    let parsed: Quote = match version {
        3 => {
            let q3 = serde_json::from_str::<Quote3>(&quote_parsed_string)
                .map_err(|e| format!("Failed to parse Quote3: {e}"))?;
            Quote::V3(q3)
        }
        4 => {
            let q4 = serde_json::from_str::<Quote4>(&quote_parsed_string)
                .map_err(|e| format!("Failed to parse Quote4: {e}"))?;
            Quote::V4(q4)
        }
        _ => return Err("Unsupported quote version".into()),
    };

    Ok(parsed)
}
