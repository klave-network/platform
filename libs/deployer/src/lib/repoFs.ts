export interface RepoFs {
    getFiles(dir?: string): Promise<string[]>;
    getFileContent(filename?: string): Promise<string | null>;
}