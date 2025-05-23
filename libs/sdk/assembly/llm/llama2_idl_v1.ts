/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/llm
 */
import { GraphEncoding, TensorType } from "./wasi_nn_idl_v1";

export enum EncryptionType {
    NONE = 0,
    AES_GCM = 1,
    AES_CTR = 2,
    AES_ECB = 3
}

export enum HashType {
    NONE            = 0,
    SHA1            = 1,
    SHA2_256        = 2,
    SHA2_384        = 3,
    SHA2_512        = 4,
    SHA3_256        = 5,
    SHA3_384        = 6,
    SHA3_512        = 7,
    MD5             = 8,
    CMAC_128        = 11
}

@json
export class Model {
    name!: string;
    tokenizer_name!: string;
    local_path!: string;
    url!: string;
    description!: string;
    model_format!: GraphEncoding;
    tensor_type!: TensorType;
    encryption_type!: EncryptionType;
    encryption_key!: ArrayBuffer;
    hash_type!: HashType;
    hash!: ArrayBuffer;
    is_loaded!: boolean;
    system_prompt!: ArrayBuffer;
    max_threads!: i16;
    max_conccurent_queries!: i16;
    max_conccurent_queries_per_user!: i16;
    inactivitiy_timeout!: i64;
}

@json
export class Tokenizer
{
    name!: string;
    local_path!: string;
    url!: string;
    description!: string;
    model_format!: GraphEncoding;
    tensor_type!: TensorType;
    encryption_type!: EncryptionType;
    encryption_key!: ArrayBuffer;
    hash_type!: HashType;
    hash!: ArrayBuffer;
    is_loaded!: boolean;
}

@json
export class GraphBuilder {
    model!: Model;
    tokenizer!: Tokenizer;
}

@json
export class GraphInitContext {
    model_name!: string;
    context_name!: string;
    system_prompt!: string;
    temperature!: f32;  // 0.0 = greedy deterministic. 1.0 = original. don't set higher
    topp!: f32;         // top-p in nucleus sampling. 1.0 = off. 0.9 works well, but slower
    steps!: i32;        // number of steps to run for
}

@json 
export class InferenceIteration {
    piece!: ArrayBuffer;
    complete!: boolean;
}