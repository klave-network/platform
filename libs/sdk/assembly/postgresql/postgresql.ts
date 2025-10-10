/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/postgresql
 */
import { Result } from '../index';

@external("env", "connection_open")
declare function wasm_connection_open(connection_string: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
@external("env", "sql_query")
declare function wasm_sql_query(connection: ArrayBuffer, query: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;
@external("env", "sql_exec")
declare function wasm_sql_exec(connection: ArrayBuffer, command: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;

function connectionOpen(connection_string: string): Result<string, Error> {
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
    return { data: String.UTF8.decode(error.slice(0, result)), err: null };
}

function sqlQuery(connectionHandle: ArrayBuffer, query: string): Result<string, Error> {
    let q = String.UTF8.encode(query, true);
    let query_response = new ArrayBuffer(64);
    let result = wasm_sql_query(connectionHandle, q, query_response, query_response.byteLength);
    if (abs(result) > query_response.byteLength) {
        // buffer not big enough, retry with a properly sized one
        query_response = new ArrayBuffer(abs(result));
        result = wasm_sql_query(connectionHandle, q, query_response, query_response.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(query_response.slice(0, -result))) };
    return { data: String.UTF8.decode(query_response.slice(0, result)), err: null };
}

function sqlExec(connectionHandle: ArrayBuffer, command: string): Result<string, Error> {
    let cmd = String.UTF8.encode(command, true);
    let error = new ArrayBuffer(64);
    let result = wasm_sql_exec(connectionHandle, cmd, error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_sql_exec(connectionHandle, cmd, error, error.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: String.UTF8.decode(error.slice(0, result)), err: null };
}

function normaliseQuery(query: string): string {
    // This function normalizes whitespace in the query string.
    // Note: This does NOT provide SQL injection protection.

    // Trim whitespace from both ends
    let trimmed = query.trim();

    // Replace newlines and carriage returns with spaces
    let normalized = trimmed.replaceAll("\n", " ").replaceAll("\r", " ");

    // Split by whitespace, filter out empty strings, and join with single spaces
    let parts = normalized.split(" ");
    let filtered: string[] = [];

    for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
            filtered.push(parts[i]);
        }
    }

    return filtered.join(" ");
}

export class Connection {

    handle: ArrayBuffer;
    constructor(handle: string) {
        this.handle = String.UTF8.encode(handle, true);
    }

    query(query: string): Result<string, Error> {
        let sanitizedQuery = normaliseQuery(query);
        return sqlQuery(this.handle, sanitizedQuery);
    }

    execute(command: string): Result<string, Error> {
        let sanitizedCommand = normaliseQuery(command);
        return sqlExec(this.handle, sanitizedCommand);
    }
}

export function open(uri: string): Result<Connection, Error> {
    let conn = connectionOpen(uri);
    if (conn.err) {
        return { data: null, err: new Error(`Failed to open connection: ${conn.err!.message}`) };
    } else {
        return { data: new Connection(conn.data!), err: null };
    }
}

export function connectionString(host: string, dbname: string, user: string, password: string): string {
    return `host=${host} dbname=${dbname} user=${user} password=${password}`;
}
