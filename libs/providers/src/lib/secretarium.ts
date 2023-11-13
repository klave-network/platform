import { SCP, Key, Constants, EncryptedKeyPair } from '@secretarium/connector';
import { prisma } from '@klave/db';
import { logger } from './logger';

const client = new SCP();

let connectionKey: Key | undefined;
let reconnectAttempt = 0;
let reconnectionTimeout: NodeJS.Timeout | undefined;
let lastSCPState = Constants.ConnectionState.closed;

const planReconnection = async () => {
    return new Promise((resolve) => {
        if (!reconnectionTimeout) {
            reconnectionTimeout = setTimeout(() => {
                clearTimeout(reconnectionTimeout);
                reconnectionTimeout = undefined;
                scpOps.initialize().then(resolve).catch(() => { return; });
            }, 3000);
        }
    });
};

client.onStateChange((state) => {
    lastSCPState = state;
    if (lastSCPState !== Constants.ConnectionState.secure && lastSCPState !== Constants.ConnectionState.connecting)
        planReconnection();
});

export const scpOps = {
    initialize: async () => {
        const [node, trustKey] = process.env['KLAVE_SECRETARIUM_NODE']?.split('|') ?? [];
        if (!node || !trustKey)
            throw new Error('Missing Secretarium node or trust key');
        try {
            const dbSecret = process.env['KLAVE_SECRETARIUM_SECRET'];
            if (!dbSecret || (dbSecret?.length ?? 0) === 0)
                throw new Error('Missing Secretarium secret');
            if (!connectionKey) {
                const dbKey = process.env['KLAVE_SECRETARIUM_KEY'];
                if (!dbKey || (dbKey?.length ?? 0) === 0) {
                    const newKey = await Key.createKey();
                    await newKey.seal(dbSecret);
                    const exportedKey = await newKey.exportEncryptedKey();
                    await prisma.environment.create({
                        data: {
                            name: 'KLAVE_SECRETARIUM_KEY',
                            value: JSON.stringify(exportedKey)
                        }
                    });
                    connectionKey = newKey;
                } else {
                    const theKey = JSON.parse(dbKey) as EncryptedKeyPair;
                    connectionKey = await Key.importEncryptedKeyPair(theKey, dbSecret);
                }
            }
            await client.connect(node, connectionKey, trustKey);
            logger.info(`Connected to Secretarium ${node}`);
            logger.info(`PK ${await connectionKey.getRawPublicKeyHex()}`);
            reconnectAttempt = 0;
            return;
        } catch (e) {
            logger.error(`Connection ${++reconnectAttempt} to Secretarium ${node} failed: ${e}`);
            lastSCPState = Constants.ConnectionState.closed;
            await planReconnection();
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