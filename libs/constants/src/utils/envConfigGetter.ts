export const config = {
    get: (prop: string): string => {
        return process.env[prop] ?? '';
    }
};