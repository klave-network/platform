export const config = {
    get: (prop: string, fallback = ''): string => {
        return config.get(prop) ?? fallback;
    }
};