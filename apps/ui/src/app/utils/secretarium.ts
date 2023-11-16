import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { SCP, Key, Constants } from '@secretarium/connector';
import { httpApi } from './api';

export const client = new SCP({
    logger: process.env.NODE_ENV === 'development' ? console : undefined
});

let connectionKey: Key | undefined;
let connectionKeyStarted = false;
let connectionInfo: Array<string> | undefined;

const syncNodeInfo = async () => {
    return await httpApi.v0.system.getSecretariumNode.query().then(node => {
        if (node)
            connectionInfo = node?.split('|') ?? [];
        else
            connectionInfo = import.meta.env['VITE_KLAVE_SECRETARIUM_NODE']?.split('|') ?? [];
        return node;
    });
};

setInterval(() => {
    syncNodeInfo();
}, 1000 * 60 * 5);

interface State<T> {
    isLoading: boolean;
    data?: Array<T>
    errors?: Array<Error>;
    refetch: () => void;
}

type Cache<T> = { [url: string]: Array<T> }

// discriminated union type
type Action<T> =
    | { type: 'reset' }
    | { type: 'loading' }
    | { type: 'fetched'; payload: Array<T> }
    | { type: 'error'; payload: Array<Error> }

type SecretariumQueryOptions = {
    app: string;
    route: string;
    args?: unknown;
    live?: boolean;
}

export function useSecretariumQuery<T = unknown>(options: SecretariumQueryOptions, deps: Array<any> = []): State<T> {

    const [count, setCount] = useState(0);
    const [opts, setOpts] = useState<SecretariumQueryOptions>();
    const { app, route, args } = opts ?? {};
    const argDigest = useMemo(() => {
        if (typeof args === 'undefined')
            return '';
        if (typeof args === 'string')
            return args;
        if (typeof args === 'object')
            return Object.entries(args as any as Record<string, any>).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v).join('|');
        return Math.random().toString().replaceAll('.', '');
    }, [args]);
    const cacheKey = useMemo(() => `${app}|${route}|${argDigest}|${count}`, [count]);
    const dataCache = useRef<Cache<T>>({});
    const errorsCache = useRef<Cache<Error>>({});
    const querySent = useRef<boolean>(false);

    // Used to prevent state update if the component is unmounted
    const cancelRequest = useRef<boolean>(false);

    const initialState: State<T> = {
        isLoading: false,
        errors: undefined,
        data: undefined,
        refetch: () => {
            dispatch({ type: 'reset' });
        }
    };

    // Keep state logic separated
    const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
        switch (action.type) {
            case 'reset':
                setOpts(options);
                return { ...initialState };
            case 'loading':
                return { ...initialState, isLoading: true };
            case 'fetched':
                return { ...initialState, data: action.payload, isLoading: false };
            case 'error':
                return { ...initialState, errors: action.payload.length ? action.payload : undefined, isLoading: false };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(fetchReducer, initialState);

    useEffect(() => {
        setCount(count + 1);
    }, [opts]);

    useEffect(() => {
        if (options?.live === false)
            return;
        setOpts(options);
    }, deps);

    useEffect(() => {
        querySent.current = false;
    }, [cacheKey]);

    useEffect(() => {

        // Do nothing if the url is not given
        if (!app || !route)
            return;

        cancelRequest.current = false;

        const fetchData = async () => {

            await Promise.resolve(); // wait for the initial cleanup in Strict mode - avoids double mutation
            if (cancelRequest.current || querySent.current)
                return;

            querySent.current = true;
            dispatch({ type: 'loading' });

            // If a cache exists for this url, return it
            if (dataCache.current[cacheKey]?.length) {
                dispatch({ type: 'fetched', payload: dataCache.current[cacheKey]! });
                return;
            }

            try {

                if (!connectionInfo)
                    await syncNodeInfo();

                if (!connectionKey && !connectionKeyStarted) {
                    console.debug('Generating a new Secretarium key...');
                    connectionKeyStarted = true;
                    connectionKey = await Key.createKey();
                }

                if (!connectionKey) {
                    await new Promise((resolve, reject) => {
                        const bail = setTimeout(() => {
                            clearInterval(timer);
                            reject(new Error('Timeout'));
                        }, 30000);
                        const timer = setInterval(() => {
                            if (connectionKey) {
                                clearTimeout(bail);
                                clearInterval(timer);
                                resolve(true);
                            }
                        }, 100);
                    });
                }

                const [node, trustKey] = connectionInfo ?? [];
                if (!node || !trustKey) {
                    dispatch({ type: 'error', payload: [new Error('Missing Secretarium node or trust key')] });
                    return;
                }
                if (client.state === Constants.ConnectionState.closed) {
                    console.debug('Connecting to Secretarium...');
                    await client.connect(node, connectionKey!, trustKey);
                }

                await new Promise((resolve, reject) => {
                    const bail = setTimeout(() => {
                        clearInterval(timer);
                        reject(new Error('Timeout'));
                    }, 30000);
                    const timer = setInterval(() => {
                        if (client.state === Constants.ConnectionState.secure) {
                            clearTimeout(bail);
                            clearInterval(timer);
                            resolve(true);
                        }
                    }, 100);
                });

                dataCache.current[cacheKey] = [];
                errorsCache.current[cacheKey] = [];
                await client.newTx(app, route, `klave-deployment-${Math.random().toString().replaceAll('.', '')}`, args as any)
                    .onResult((result: T) => {

                        if (!dataCache.current[cacheKey])
                            dataCache.current[cacheKey] = [];

                        if (cancelRequest.current)
                            return;

                        dataCache.current[cacheKey]?.push(result);
                        dispatch({ type: 'fetched', payload: dataCache.current[cacheKey]! });

                    }).onError((error: any) => {

                        if (!errorsCache.current[cacheKey])
                            errorsCache.current[cacheKey] = [];

                        if (cancelRequest.current)
                            return;

                        if (error.toString() !== '[UNKNOWN ERROR]' || errorsCache.current[cacheKey]!.length === 0)
                            errorsCache.current[cacheKey]!.push(error);

                        dispatch({ type: 'error', payload: errorsCache.current[cacheKey]! });

                    }).send();

            } catch (error) {

                if (cancelRequest.current)
                    return;

                dispatch({ type: 'error', payload: [error as Error] });
            }
        };

        if (!querySent.current)
            void fetchData();

        // Use the cleanup function for avoiding a possibly...
        // ...state update after the component was unmounted
        return () => {
            cancelRequest.current = true;
        };
    }, [cacheKey]);

    return state;
}