
import { useState, useEffect, useCallback } from 'react';
import { SCP, Key } from '@secretarium/connector';
import { httpApi } from './api';

export const client = new SCP();

let connectionKey: Key | undefined;
let connectionInfo: Array<string> | undefined;

const syncNodeInfo = async () => {
    return httpApi.v0.system.getSecretariumNode.query().then(node => {
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

export function useSecretariumQuery(app: string, route: string, args?: unknown) {

    const [config, setConfig] = useState({
        app,
        route,
        args
    });

    const [status, setStatus] = useState<{
        loading: boolean;
        errors?: Array<Error | string>;
        data: Array<any>;
    }>({
        loading: false,
        errors: [],
        data: []
    });

    const refetch = useCallback(async () => {
        const localResultAccu: Array<any> = [];
        const localErrorAccu: Array<any> = [];
        setStatus({ loading: true, data: localResultAccu, errors: localErrorAccu });
        if (!connectionInfo)
            await syncNodeInfo();
        if (!connectionKey)
            connectionKey = await Key.createKey();
        try {
            const [node, trustKey] = connectionInfo ?? [];
            if (!node || !trustKey)
                throw new Error('Missing Secretarium node or trust key');
            await client.connect(node, connectionKey, trustKey);
            client.newTx(app, route, `klave-deployment-${app}`, args as any)
                .onResult(result => {
                    localResultAccu.push(result);
                    setStatus({ loading: false, data: localResultAccu, errors: [] });
                }).onError((error: any) => {
                    if (error.toString() !== '[UNKNOWN ERROR]' || localErrorAccu.length === 0)
                        localErrorAccu.push(error);
                    setStatus({ loading: false, errors: localErrorAccu as any, data: [] });
                }).send().catch(() => {
                    // localErrorAccu.push(error);
                    setStatus({ loading: false, errors: localErrorAccu as any, data: [] });
                });
        } catch (error) {
            localErrorAccu.push(error);
            setStatus({ loading: false, errors: localErrorAccu as any, data: [] });
        }
    }, [app, route, args]);

    // useEffect(() => {
    //     if (app && route) {
    //         refetch();
    //     }
    // }, []);

    useEffect(() => {
        if (config.app !== app || config.route !== route)
            setStatus({ loading: false, errors: [], data: [] });
        setConfig({
            app,
            route,
            args
        });
    }, [app, route, args, config.app, config.route]);

    return { ...status, refetch };
}