import { useState, useEffect, useCallback, useRef } from 'react';
import localForage from 'localforage';

type ErrorHandler = (e?: Error) => void;

const defaultErrorHandler: ErrorHandler = (e?: Error) => {
    console.error(e);
};

export { localForage };

export function useLocalForage<D>(key: string, initialValue: D, errorHandler?: ErrorHandler) {
    const [storedValue, setStoredValue] = useState<D | null>(initialValue);
    const _errorHandler = useRef(
        (typeof errorHandler == 'undefined' || errorHandler == null) ? defaultErrorHandler : errorHandler
    );

    const error = (e?: Error) => {
        _errorHandler.current(e);
    };

    useEffect(() => {
        (async function () {
            try {
                const value: D | null = await localForage.getItem(key);
                setStoredValue(value == null ? initialValue : value);
            } catch (e) {
                error(e as Error);
            }
        })().catch(error);
    }, []);

    const setValue = useCallback((value: D) => {
        async function set(value: D) {
            try {
                setStoredValue(value);
                await localForage.setItem(key, value);
            } catch (e) {
                error(e as Error);
            }
        }

        set(value).catch(error);
    }, [key]);

    const removeValue = useCallback(() => {
        async function remove() {
            try {
                setStoredValue(null);
                await localForage.removeItem(key);
            } catch (e) {
                error(e as Error);
            }
        }

        remove().catch(error);
    }, [key]);

    return [storedValue, setValue, removeValue] as const;
}