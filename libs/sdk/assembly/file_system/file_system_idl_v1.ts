/**
 * Environment definitions for compiling Klave Trustless Applications.
 * @module klave/sdk/file_system
 */

export enum DownloadStatus
{
    DOWNLOADING,
    DOWNLOADED,
    STARTING,
    NOT_FOUND,
    FAILED
};

export enum FileType
{
    FILE,
    DIRECTORY,
    UNKNOWN
};

@json
export class FileInfo
{
    name!: string;
    type!: FileType;
    size!: u64;
    last_modified!: u64;
    user_owner!: string;
    group_owner!: string;
    permissions!: u32;
}

