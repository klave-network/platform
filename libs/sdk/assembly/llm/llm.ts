/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/llama2_c
 */

import { JSON } from "@klave/as-json/assembly";
import { Result } from '../index';
import * as Llama2Idl from './llama2_idl_v1';
export { Llama2Idl as Llama2 };
import * as WasiNnIdl from './wasi_nn_idl_v1';
export { WasiNnIdl as WasiNn };

@external("env", "graph_models")
declare function wasm_graph_models(result: ArrayBuffer, result_size: i32): i32;
@external("env", "graph_tokenizers")
declare function wasm_graph_tokenizers(result: ArrayBuffer, result_size: i32): i32;
@external("env", "graph_load")
declare function wasm_graph_load(builder: ArrayBuffer, encoding: i32, target: i32, error: ArrayBuffer, error_size: i32): i32;
@external("env", "graph_load_by_name")
declare function wasm_graph_load_by_name(model_name: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
@external("env", "graph_unload_by_name")
declare function wasm_graph_unload_by_name(model_name: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
@external("env", "graph_init_execution_context")
declare function wasm_graph_init_execution_context(metadata: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
@external("env", "graph_delete_execution_context")
declare function wasm_graph_delete_execution_context(context_name: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
@external("env", "inference_compute")
declare function wasm_inference_compute(context_name: ArrayBuffer, input_tensor: ArrayBuffer, input_sensor_size: i32, output_tensor: ArrayBuffer, output_tensor_size: i32): i32;
@external("env", "inference_add_prompt")
declare function wasm_inference_add_prompt(context_name: ArrayBuffer, prompt: ArrayBuffer, prompt_size: i32, error: ArrayBuffer, error_size: i32): i32;
@external("env", "inference_get_piece")
declare function wasm_inference_get_piece(context_name: ArrayBuffer, inference_iteration: ArrayBuffer, inference_iteration_size: i32): i32;

export function graphModels(): Result<string, Error>
{
    let models = new ArrayBuffer(64);
    let result = wasm_graph_models(models, models.byteLength);
    if (abs(result) > models.byteLength) {
        // buffer not big enough, retry with a properly sized one
        models = new ArrayBuffer(abs(result));
        result = wasm_graph_models(models, models.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error("Failed to fetch models") };
    return { data: String.UTF8.decode(models.slice(0, result)), err: null };
}

export function graphTokenizers(): Result<string, Error>
{
    let models = new ArrayBuffer(64);
    let result = wasm_graph_tokenizers(models, models.byteLength);
    if (abs(result) > models.byteLength) {
        // buffer not big enough, retry with a properly sized one
        models = new ArrayBuffer(abs(result));
        result = wasm_graph_tokenizers(models, models.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error("Failed to fetch tokenizers") };
    return { data: String.UTF8.decode(models.slice(0, result)), err: null };
}

function LoadStatusToString(status: WasiNnIdl.LoadStatus): string
{
    switch (status) {
        case WasiNnIdl.LoadStatus.LOADED_IN_RAM:
            return "LOADED_IN_RAM";
        case WasiNnIdl.LoadStatus.UNLOADED_FROM_RAM:
            return "UNLOADED_FROM_RAM";
        case WasiNnIdl.LoadStatus.FAILED:
            return "FAILED";
        default:
            return "UNKNOWN";
    }
}

export function graphLoad(builder: string, encoding: i32, target: i32): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_graph_load(String.UTF8.encode(builder, true), encoding, target, error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_graph_load(String.UTF8.encode(builder, true), encoding, target, error, error.byteLength);
    }
    if (result < 0)
        return { data: LoadStatusToString(WasiNnIdl.LoadStatus.FAILED), err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: LoadStatusToString(WasiNnIdl.LoadStatus.LOADED_IN_RAM), err: null };
}

export function graphLoadByName(model_name: string): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_graph_load_by_name(String.UTF8.encode(model_name, true), error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_graph_load_by_name(String.UTF8.encode(model_name, true), error, error.byteLength);
    }
    if (result < 0)
        return { data: LoadStatusToString(WasiNnIdl.LoadStatus.FAILED), err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: LoadStatusToString(WasiNnIdl.LoadStatus.LOADED_IN_RAM), err: null };
}

export function graphUnloadByName(model_name: string): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_graph_unload_by_name(String.UTF8.encode(model_name, true), error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_graph_unload_by_name(String.UTF8.encode(model_name, true), error, error.byteLength);
    }
    if (result < 0)
        return { data: LoadStatusToString(WasiNnIdl.LoadStatus.FAILED), err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: LoadStatusToString(WasiNnIdl.LoadStatus.UNLOADED_FROM_RAM), err: null };
}

export function graphInitExecutionContext(metadata: string): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_graph_init_execution_context(String.UTF8.encode(metadata, true), error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_graph_init_execution_context(String.UTF8.encode(metadata, true), error, error.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: "", err: null };
}

export function graphDeleteExecutionContext(context_name: string): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_graph_delete_execution_context(String.UTF8.encode(context_name, true), error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_graph_delete_execution_context(String.UTF8.encode(context_name, true), error, error.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: "Context " + context_name + " successfully deleted", err: null };
}

export function inferenceCompute(context_name: string, input_tensor: ArrayBuffer): Result<string, Error>
{
    let output_tensor = new ArrayBuffer(1024);
    let result = wasm_inference_compute(String.UTF8.encode(context_name, true), input_tensor, input_tensor.byteLength, output_tensor, output_tensor.byteLength);
    if (abs(result) > output_tensor.byteLength) {
        // buffer not big enough, retry with a properly sized one
        output_tensor = new ArrayBuffer(abs(result));
        result = wasm_inference_compute(String.UTF8.encode(context_name, true), input_tensor, input_tensor.byteLength, output_tensor, output_tensor.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(output_tensor.slice(0, -result))) };
    return { data: String.UTF8.decode(output_tensor.slice(0, result)), err: null };
}

export function inferenceAddPrompt(context_name: string, prompt: ArrayBuffer): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_inference_add_prompt(String.UTF8.encode(context_name, true), prompt, prompt.byteLength, error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_inference_add_prompt(String.UTF8.encode(context_name, true), prompt, prompt.byteLength, error, error.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: "Prompt successfully added", err: null };
}

export function inferenceGetPiece(context_name: string): Result<string, Error>
{
    let inference_iteration = new ArrayBuffer(64);
    let result = wasm_inference_get_piece(String.UTF8.encode(context_name, true), inference_iteration, inference_iteration.byteLength);
    if (abs(result) > inference_iteration.byteLength) {
        // buffer not big enough, retry with a properly sized one
        inference_iteration = new ArrayBuffer(abs(result));
        result = wasm_inference_get_piece(String.UTF8.encode(context_name, true), inference_iteration, inference_iteration.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(inference_iteration.slice(0, -result))) };
    return { data: String.UTF8.decode(inference_iteration.slice(0, result)) , err: null };
}
