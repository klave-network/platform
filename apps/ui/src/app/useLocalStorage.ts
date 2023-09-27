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
        })();
    }, []);

    const setValue = useCallback((value: any) => {
        async function set(value: any) {
            try {
                setStoredValue(value);
                await localForage.setItem(key, value);
            } catch (e) {
                error(e as Error);
            }
        }

        set(value);
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

        remove();
    }, [key]);

    return [storedValue, setValue, removeValue] as const;
}