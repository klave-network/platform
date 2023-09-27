import { SCP, Key, Constants } from '@secretarium/connector';
import { logger } from './logger';

const client = new SCP();

let connectionKey: Key | undefined;
let reconnectAttempt = 0;
let reconnectionTimeout: NodeJS.Timeout | undefined;
let lastSCPState = Constants.ConnectionState.closed;

const planReconnection = () => {
    if (!reconnectionTimeout) {
        reconnectionTimeout = setTimeout(() => {
            clearTimeout(reconnectionTimeout);
            reconnectionTimeout = undefined;
            scpOps.initialize().catch(() => { return; });
        }, 3000);
    }
};

client.onStateChange((state) => {
    lastSCPState = state;
    if (lastSCPState !== Constants.ConnectionState.secure && lastSCPState !== Constants.ConnectionState.connecting)
        planReconnection();
});

export const scpOps = {
    initialize: async () => {
        try {
            if (!connectionKey)
                connectionKey = await Key.createKey();
            const [node, trustKey] = process.env['NX_SECRETARIUM_NODE']?.split('|') ?? [];
            if (!node || !trustKey)
                throw new Error('Missing Secretarium node or trust key');
            await client.connect(node, connectionKey, trustKey);
            logger.info(`Connected to Secretarium ${node}`);
            reconnectAttempt = 0;
            return;
        } catch (e) {
            logger.error(`Connection ${++reconnectAttempt} to Secretarium failed: ${e}`);
            lastSCPState = Constants.ConnectionState.closed;
        }
    },
    isConnected: () => {
        return lastSCPState === Constants.ConnectionState.secure;
    },
    stop: async () => {
        try {
            await client.close();
            return;
        } catch (e) {
            //
        }
    }
};

export const scp = client;