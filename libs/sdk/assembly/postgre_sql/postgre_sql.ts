/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/postgre_sql
 */

import { JSON } from "@klave/as-json/assembly";
import { Result } from '../index';


@external("env", "connection_open")
declare function wasm_connection_open(connection_string: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
@external("env", "sql_query")
declare function wasm_sql_query(connection: ArrayBuffer, query: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
@external("env", "sql_exec")
declare function wasm_sql_exec(connection: ArrayBuffer, command: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;


function connectionString(host: string, dbname: string, user: string, password: string): string
{
    return `host=${host} dbname=${dbname} user=${user} password=${password}`;
}
function connectionOpen(connection_string: string): Result<string, Error>
{
    let s = String.UTF8.encode(connection_string, true);
    let error = new ArrayBuffer(64);
    let result = wasm_connection_open(s, error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_connection_open(s, error, error.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: "", err: null };
}
function sqlQuery(connection: string, query: string): Result<string, Error>
{
    let cnx = String.UTF8.encode(connection, true);
    let q = String.UTF8.encode(query, true);
    let query_response = new ArrayBuffer(64);
    let result = wasm_sql_query(cnx, q, query_response, query_response.byteLength);
    if (abs(result) > query_response.byteLength) {
        // buffer not big enough, retry with a properly sized one
        query_response = new ArrayBuffer(abs(result));
        result = wasm_sql_query(cnx, q, query_response, query_response.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(query_response.slice(0, -result))) };
    return { data: String.UTF8.decode(query_response.slice(0, result)) , err: null };
}
function sqlExec(connection: string, command: string): Result<string, Error>
{
    let cnx = String.UTF8.encode(connection, true);
    let cmd = String.UTF8.encode(command, true);
    let error = new ArrayBuffer(64);
    let result = wasm_sql_exec(cnx, cmd, error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_sql_exec(cnx, cmd, error, error.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: "", err: null };
}
