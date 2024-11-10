/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk
 */

import { JSON } from "@klave/as-json/assembly";
export { JSON }
import * as Crypto from "./crypto"
export { Crypto }

// @ts-ignore: decorator
@external("env", "add_user_query")
declare function runtime_add_user_query(s: ArrayBuffer): void;
// @ts-ignore: decorator
@external("env", "add_user_transaction")
declare function runtime_add_user_transaction(s: ArrayBuffer): void;
// @ts-ignore: decorator
@external("env", "notify")
declare function runtime_notify(s: ArrayBuffer): void;
// @ts-ignore: decorator
@external("env", "read_ledger")
declare function runtime_read_ledger_raw(table: ArrayBuffer, key: ArrayBuffer, key_size: i32, value: ArrayBuffer, value_size: i32): i32;
// @ts-ignore: decorator
@external("env", "write_ledger")
declare function runtime_write_ledger_raw(table: ArrayBuffer, key: ArrayBuffer, key_size: i32, value: ArrayBuffer, value_size: i32, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "remove_from_ledger")
declare function runtime_remove_from_ledger_raw(table: ArrayBuffer, key: ArrayBuffer, key_size: i32, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "query_context")
declare function runtime_query_context_raw(key: ArrayBuffer, value: ArrayBuffer, value_size: i32): i32;
// @ts-ignore: decorator
@external("env", "load_lightgbm_model")
declare function runtime_load_lightgbm_model(name: ArrayBuffer, model: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "unload_lightgbm_model")
declare function runtime_unload_lightgbm_model(name: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
// @ts-ignore: decorator
@external("env", "infer_from_lightgbm_model")
declare function runtime_infer_from_lightgbm_model(name: ArrayBuffer, data: ArrayBuffer, data_size: i32, nb_outputs: i32, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "https_query")
declare function https_query_raw(query: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
// @ts-ignore: decorator
@external("env", "start_recording")
declare function start_recording(): void;
// @ts-ignore: decorator
@external("env", "stop_recording")
declare function stop_recording(): void;
// @ts-ignore: decorator
@external("env", "cancel_transaction")
declare function abort_transaction(): void;

export class Result<T, E> {
    data!: T | null;
    err!: E | null;
}

export class Router {
    static addQuery(queryFunctionName: ArrayBuffer): void {
        runtime_add_user_query(queryFunctionName);
    }
    static addTransaction(transactionFunctionName: ArrayBuffer): void {
        runtime_add_user_transaction(transactionFunctionName);
    }
}

class Table {

    table: ArrayBuffer;
    constructor(table: string) {
        this.table = String.UTF8.encode(table, true);
    }

    getArrayBuffer(key: string): ArrayBuffer {
        let k = String.UTF8.encode(key, true);
        let value = new ArrayBuffer(64);
        let result = runtime_read_ledger_raw(this.table, k, k.byteLength, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = runtime_read_ledger_raw(this.table, k, k.byteLength, value, value.byteLength);
        }
        if (result < 0)
            return new ArrayBuffer(0); //TODO: Report error (or not found ?)
        return value.slice(0, result);
    }

    get(key: string): string {
        return String.UTF8.decode(this.getArrayBuffer(key), true);
    }

    set(key: string, value: string): i32 {
        let k = String.UTF8.encode(key, true);
        let v = String.UTF8.encode(value, true);
        let buf = new ArrayBuffer(64);
        return runtime_write_ledger_raw(this.table, k, k.byteLength, v, v.byteLength, buf, buf.byteLength);
    }

    unset(key: string): i32 {
        let k = String.UTF8.encode(key, true);
        let buf = new ArrayBuffer(64);
        return runtime_remove_from_ledger_raw(this.table, k, k.byteLength, buf, buf.byteLength);
    }
}

export class Ledger {

    static getTable(table: string): Table {
        return new Table(table);
    }
}

export class Context {

    static getArrayBuffer(key: string): ArrayBuffer {
        let k = String.UTF8.encode(key, true);
        let value = new ArrayBuffer(1);
        let result = runtime_query_context_raw(k, value, value.byteLength);
        if (result < 0)
            return new ArrayBuffer(0); //TODO: Report error (or not found ?)
        if (result > value.byteLength) {
            value = new ArrayBuffer(result);
            result = runtime_query_context_raw(k, value, value.byteLength);
            if (result < 0)
                return new ArrayBuffer(0); //TOTO: Report errors
        }
        return value;
    }

    static get(variable: string): string {
        return String.UTF8.decode(Context.getArrayBuffer(variable), true);
    }
}

export class Notifier {

    static notify(message: ArrayBuffer): void {
        runtime_notify(message);
    }

    static sendArrayBuffer(message: ArrayBuffer): void {
        runtime_notify(message);
    }

    static sendString(message: string): void {
        let buf = String.UTF8.encode(message, true);
        runtime_notify(buf);
    }

    static sendJson<T = unknown>(message: T): void {
        let buf = String.UTF8.encode(JSON.stringify<T>(message), true);
        runtime_notify(buf);
    }
}

export class Subscription {

    static setReplayStart(): void {
        start_recording();
    }

    static setReplayStop(): void {
        stop_recording();
    }
}

export class Transaction {
    static abort(): void {
        abort_transaction();
    }
}

@json
export class HttpRequest {
    hostname!: string;
    port: i32 = 443;
    method: string = 'GET';
    path: string = '';
    version: string = 'HTTP/1.1';
    headers: string[][] = [];
    body: string = '';
}
@json
export class HttpResponse {
    status_code: i32 = 200;
    headers: string[][] = [];
    body: string = '';
}

export class HTTP {

    static requestAsArrayBuffer(query: HttpRequest): ArrayBuffer | null {
        let p = String.UTF8.encode(JSON.stringify(query), true);
        let value = new ArrayBuffer(64);
        let result = https_query_raw(p, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = https_query_raw(p, value, value.byteLength);
        }
        if (result < 0)
            return null; // todo : report error
        return value.slice(0, result);
    }

    static requestAsString(query: HttpRequest): string | null {
        let value = HTTP.requestAsArrayBuffer(query);
        if (value === null)
            return null;
        return String.UTF8.decode(value);
    }

    static requestJson(query: HttpRequest): HttpResponse | null {
        let value = HTTP.requestAsString(query);
        if (value === null)
            return null;
        return JSON.parse<HttpResponse>(value);
    }

    static request(query: HttpRequest): HttpResponse | null {
        return HTTP.requestJson(query);
    }
}

export class ML {

    static loadLightGBMModel(name: string, model: string): i32 {
        let nameBuf = String.UTF8.encode(name, true);
        let modelBuf = String.UTF8.encode(model, true);
        let buf = new ArrayBuffer(64);
        return runtime_load_lightgbm_model(nameBuf, modelBuf, buf, buf.byteLength);
    }

    static unloadLightGBMModel(name: string): i32 {
        let nameBuf = String.UTF8.encode(name, true);
        let buf = new ArrayBuffer(64);
        return runtime_unload_lightgbm_model(nameBuf, buf, buf.byteLength);
    }

    static inferLightGBMModel(name: string, data: Float64Array): Float64Array {
        let nameBuf = String.UTF8.encode(name, true);
        let value = new ArrayBuffer(64);
        let result = runtime_infer_from_lightgbm_model(nameBuf, data.buffer, data.byteLength, 8, value, value.byteLength);
        if (abs(result) > value.byteLength) {
            // buffer not big enough, retry with a properly sized one
            value = new ArrayBuffer(abs(result));
            result = runtime_infer_from_lightgbm_model(nameBuf, data.buffer, data.byteLength, 8, value, value.byteLength);
        }
        if (result < 0)
            return new Float64Array(0); //TODO: Report errors
        return Float64Array.wrap(value.slice(0, result));
    }
}

export class Utils {

    static pointerToString(ptr: i32): string {
        let len = 0;
        while (load<u8>(ptr + len) != 0)
            len++;
        let buf = new ArrayBuffer(len + 1);
        memory.copy(changetype<usize>(buf), ptr, len + 1);
        return String.UTF8.decode(buf, true);
    }

    static stringToPointer(str: string): i32 {
        let buf = String.UTF8.encode(str, true);
        let ptr = changetype<usize>(buf);
        return ptr;
    }

}
