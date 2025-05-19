/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/llm
 */

export enum LoadStatus
{
    LOADED_IN_RAM,
    UNLOADED_FROM_RAM,
    FAILED
}

export enum TensorType {
    FP16 = 0,
    FP32 = 1,
    FP64 = 2,
    BF16 = 3,
    U8 = 4,
    I32 = 5,
    I64 = 6,
}

@json
export class Tensor
{
    dimensions!: Array<u32>;
    type!: TensorType;
    data!: Array<u8>;
}

export enum GraphEncoding {
    openvino = 0,
    onnx = 1,
    tensorflow = 2,
    pytorch = 3,
    tensorflow_lite = 4,
    ggml = 5,
    llama2 = 6,
    paddle_paddle = 7,
    caffe = 8,
    mxnet = 9,
    autodetect = 127,
}

@json
export class NamedTensor {
    name!: string;
    tensor!: Tensor;
}

export enum ExecutionTarget {
    cpu = 0,
    gpu = 1,
    tpu = 2,
}

@json
export class GraphLoadInput
{
    builder!: string;
    encoding!: GraphEncoding;
    target!: ExecutionTarget;
}

@json
export class GraphInitExecutionContextInput
{
    metadata!: string;
}
