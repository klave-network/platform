/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/file_system
 */

import { JSON } from "@klave/as-json/assembly";
import { Result } from '../index';
import * as FileSytemIdl from './file_system_idl_v1';

@external("env", "download_file")
declare function wasm_download_file(
    url: ArrayBuffer, file_path: ArrayBuffer, error: ArrayBuffer, error_size: i32): i32;
@external("env", "download_status")
declare function wasm_download_status(file_path: ArrayBuffer, result: ArrayBuffer, result_size: i32): i32;

function DownloadStatusToString(status: FileSytemIdl.DownloadStatus): string
{
    switch (status) {
        case FileSytemIdl.DownloadStatus.DOWNLOADING:
            return "DOWNLOADING";
        case FileSytemIdl.DownloadStatus.DOWNLOADED:
            return "DOWNLOADED";
        case FileSytemIdl.DownloadStatus.STARTING:
            return "STARTING";
        case FileSytemIdl.DownloadStatus.NOT_FOUND:
            return "NOT_FOUND";
        case FileSytemIdl.DownloadStatus.FAILED:
            return "FAILED";
        default:
            return "UNKNOWN";
    }
}

function downloadFile(url: string, file_path: string): Result<string, Error>
{
    let error = new ArrayBuffer(64);
    let result = wasm_download_file(String.UTF8.encode(url, true), String.UTF8.encode(file_path, true), error, error.byteLength);
    if (abs(result) > error.byteLength) {
        // buffer not big enough, retry with a properly sized one
        error = new ArrayBuffer(abs(result));
        result = wasm_download_file(String.UTF8.encode(url, true), String.UTF8.encode(file_path, true), error, error.byteLength);
    }
    if (result < 0)
        return { data: DownloadStatusToString(FileSytemIdl.DownloadStatus.FAILED), err: new Error(String.UTF8.decode(error.slice(0, -result))) };
    return { data: DownloadStatusToString(FileSytemIdl.DownloadStatus.STARTING), err: null };
}

function downloadStatus(file_path: string): Result<string, Error>
{
    let status = new ArrayBuffer(64);
    let result = wasm_download_status(String.UTF8.encode(file_path, true), status, status.byteLength);
    if (abs(result) > status.byteLength) {
        // buffer not big enough, retry with a properly sized one
        status = new ArrayBuffer(abs(result));
        result = wasm_download_status(String.UTF8.encode(file_path, true), status, status.byteLength);
    }
    if (result < 0)
        return { data: "", err: new Error(String.UTF8.decode(status.slice(0, -result))) };

    let statusString = String.UTF8.decode(status.slice(0, result), true);
    let download_status = JSON.parse<FileSytemIdl.DownloadStatus>(statusString);
    return { data: DownloadStatusToString(download_status), err: null };
}