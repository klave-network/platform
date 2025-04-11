import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { SCP, Key, Constants, Utils } from '@secretarium/connector';
import { httpApi } from './api';

export const client = new SCP({
    logger: process.env.NODE_ENV === 'development' ? console : undefined
});

let connectionKey: Key;
let connectionKeyStarted = false;
let connectionInfo: Array<string>;

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
    syncNodeInfo()
        .catch(() => { return; });
}, 1000 * 60 * 5);

interface State<ResultType, ErrorType> {
    isLoading: boolean;
    indentity?: Key;
    data?: Array<ResultType>
    errors?: Array<Error | ErrorType>;
    refetch: () => void;
}

type Cache<T> = { [url: string]: Array<T> };

// discriminated union type
type Action<ResultType, ErrorType> =
    | { type: 'reset' }
    | { type: 'loading' }
    | { type: 'fetched'; payload: Array<ResultType> }
    | { type: 'error'; payload: Array<Error | ErrorType> };

type SecretariumQueryOptions = {
    app: string;
    route: string;
    cluster?: string;
    key?: Key;
    args?: string | Record<string, unknown>;
    live?: boolean;
};

export function useSecretariumQuery<ResultType = unknown, ErrorType = unknown>(options: SecretariumQueryOptions, deps: Array<unknown> = []): State<ResultType, ErrorType> {

    const [count, setCount] = useState(0);
    const [opts, setOpts] = useState<SecretariumQueryOptions>();
    const { app, route, args, key, cluster } = opts ?? {};
    const argPrint = useMemo(() => {
        if (typeof args === 'undefined' || args === null)
            return '';
        if (typeof args === 'string')
            return args;
        if (typeof args === 'object')
            return Object.entries(args).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v).join('|');
        return Math.random().toString().replaceAll('.', '');
    }, [args]);
    const argDigest = Utils.hash(Uint8Array.from(argPrint));
    const cacheKey = useMemo(() => `${app}|${route}|${argDigest}|${count}`, [count]);
    const dataCache = useRef<Cache<ResultType>>({});
    const errorsCache = useRef<Cache<Error | ErrorType>>({});
    const querySent = useRef<boolean>(false);

    // Used to prevent state update if the component is unmounted
    const cancelRequest = useRef<boolean>(false);

    const initialState: State<ResultType, ErrorType> = {
        isLoading: false,
        indentity: undefined,
        errors: undefined,
        data: undefined,
        refetch: () => {
            dispatch({ type: 'reset' });
        }
    };

    // Keep state logic separated
    const fetchReducer = (state: State<ResultType, ErrorType>, action: Action<ResultType, ErrorType>): State<ResultType, ErrorType> => {
        switch (action.type) {
            case 'reset':
                setOpts(options);
                return { ...initialState, indentity: connectionKey };
            case 'loading':
                return { ...initialState, isLoading: true, indentity: connectionKey };
            case 'fetched':
                return { ...initialState, data: action.payload, isLoading: false, indentity: connectionKey };
            case 'error':
                return { ...initialState, errors: action.payload.length ? action.payload : undefined, isLoading: false, indentity: connectionKey };
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
                dispatch({ type: 'fetched', payload: dataCache.current[cacheKey] ?? [] });
                return;
            }

            try {

                if (!connectionInfo)
                    await syncNodeInfo();

                if (connectionKey && key && await connectionKey.getRawPublicKeyHex() !== await key.getRawPublicKeyHex()) {
                    console.debug('Renewing Secretarium key...');
                    client.close();
                    await new Promise((resolve, reject) => {
                        const bail = setTimeout(() => {
                            clearInterval(timer);
                            reject(new Error('Timeout'));
                        }, 30000);
                        const timer = setInterval(() => {
                            if (!client.isConnected() && client.state === Constants.ConnectionState.closed) {
                                clearTimeout(bail);
                                clearInterval(timer);
                                resolve(true);
                            }
                        }, 100);
                    });
                    connectionKeyStarted = false;
                    connectionKey = key;
                }

                if (!connectionKey && !connectionKeyStarted) {
                    if (key) {
                        console.debug('Using provided Secretarium key...');
                        connectionKey = key;
                    } else {
                        console.debug('Generating a new Secretarium key...');
                        connectionKey = await Key.createKey();
                    }
                    connectionKeyStarted = true;
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

                if (!connectionKey) {
                    dispatch({ type: 'error', payload: [new Error('Missing Secretarium key')] });
                    return;
                }

                const [node, trustKey] = cluster ? [cluster] : (connectionInfo ?? []);
                if (!node) {
                    dispatch({ type: 'error', payload: [new Error('Missing Secretarium node URI')] });
                    return;
                }

                if (client.state === Constants.ConnectionState.closed) {
                    console.debug('Connecting to Secretarium...');
                    await client.connect(node, connectionKey, trustKey);
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
                await client.newTx<ResultType, ErrorType>(app, route, `klave-ui-runcommand-${argDigest}-${Math.random().toString().replaceAll('.', '').substring(0, 10)}`, args ?? {})
                    .onResult((result) => {

                        if (!dataCache.current[cacheKey])
                            dataCache.current[cacheKey] = [];

                        if (cancelRequest.current)
                            return;

                        dataCache.current[cacheKey]?.push(result);
                        dispatch({ type: 'fetched', payload: dataCache.current[cacheKey] ?? [] });

                    }).onError((error) => {

                        if (!errorsCache.current[cacheKey])
                            errorsCache.current[cacheKey] = [];

                        if (cancelRequest.current)
                            return;

                        if (error?.toString() !== '[UNKNOWN ERROR]' || errorsCache.current[cacheKey]?.length === 0)
                            errorsCache.current[cacheKey]?.push(error);

                        dispatch({ type: 'error', payload: errorsCache.current[cacheKey] ?? [] });

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