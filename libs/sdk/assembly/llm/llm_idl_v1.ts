/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/crypto
 */

export enum LoadStatus
{
    LOADED_IN_RAM,
    UNLOADED_FROM_RAM,
    FAILED
}

export enum tensor_type {
    FP16 = 0,
    FP32 = 1,
    FP64 = 2,
    BF16 = 3,
    U8 = 4,
    I32 = 5,
    I64 = 6,
}

@json
export class tensor
{
    dimensions!: Array<u32>;
    type!: tensor_type;
    data!: Array<u8>;
}

export enum graph_encoding {
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
export class named_tensor {
    name!: string;
    tensor!: tensor;
}

export enum execution_target {
    cpu = 0,
    gpu = 1,
    tpu = 2,
}

export enum graph_builder_type {
    llama2_c = 0,
};

@json
export class graph_load_input
{
    type!: graph_builder_type;
    builder!: string;
    encoding!: graph_encoding;
    target!: execution_target;
}

@json
export class graph_init_execution_context_input
{
    type!: graph_builder_type;
    metadata!: string;
}

namespace llama2_c
{
    @json
    export class llm_model {
        name!: string;
        tokenizer_name!: string;
        local_path!: string;
        url!: string;
        description!: string;
        model_format!: graph_encoding;
    }

    @json
    export class tokenizer
    {
        name!: string;
        local_path!: string;
        url!: string;
        description!: string;
        model_format!: graph_encoding;
    }

    @json
    export class graph_builder {
        model!: llm_model;
        tokenizer!: tokenizer;
    }

    @json
    export class graph_init_context {
        model_name!: string;
        context_name!: string;
        system_prompt!: string;
        temperature!: f32;  // 0.0 = greedy deterministic. 1.0 = original. don't set higher
        topp!: f32;         // top-p in nucleus sampling. 1.0 = off. 0.9 works well, but slower
        steps!: i32;        // number of steps to run for
    }
}
