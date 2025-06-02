//! Environment definitions for compiling Klave Trustless Applications.
//! WASI NN module for Klave SDK

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LoadStatus {
    LoadedInRam,
    UnloadedFromRam,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum TensorType {
    Fp16 = 0,
    Fp32 = 1,
    Fp64 = 2,
    Bf16 = 3,
    U8 = 4,
    I32 = 5,
    I64 = 6,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tensor {
    pub dimensions: Vec<u32>,
    pub tensor_type: TensorType,
    pub data: Vec<u8>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum GraphEncoding {
    Openvino = 0,
    Onnx = 1,
    Tensorflow = 2,
    Pytorch = 3,
    TensorflowLite = 4,
    Ggml = 5,
    Llama2 = 6,
    PaddlePaddle = 7,
    Caffe = 8,
    Mxnet = 9,
    Autodetect = 127,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamedTensor {
    pub name: String,
    pub tensor: Tensor,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum ExecutionTarget {
    Cpu = 0,
    Gpu = 1,
    Tpu = 2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphLoadInput {
    pub builder: String,
    pub encoding: GraphEncoding,
    pub target: ExecutionTarget,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphInitExecutionContextInput {
    pub metadata: String,
}