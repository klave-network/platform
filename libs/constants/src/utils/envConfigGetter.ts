export const config = {
    get: (prop: string, fallback = ''): string => {
        return process.env[prop] ?? fallback;
    }
};