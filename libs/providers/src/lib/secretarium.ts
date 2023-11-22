import { SCP, Key, Constants, EncryptedKeyPair } from '@secretarium/connector';
import { prisma } from '@klave/db';
import { logger } from './logger';

const client = new SCP({
    logger: process.env['NODE_ENV'] === 'development' ? {
        debug: (message: string, obj: any) => {
            if (obj) {
                if (obj.requestId && obj.dcapp && obj.function)
                    logger.debug(`SCP (${obj.requestId}) ${obj.dcapp}/${obj.function}`);
                else if (obj.state)
                    logger.debug(`SCP (${obj.requestId}) T> ${obj.state}`);
                else
                    logger.debug(`SCP (${obj.requestId}) Q> Result`);
            }
            else
                logger.debug(message);
        },
        info: (message: string) => logger.info(message),
        warn: (message: string) => logger.warn(message),
        error: (message: string) => logger.error(message)
    } : undefined
});

let connectionKey: Key | undefined;
let reconnectAttempt = 0;
let reconnectionTimeout: NodeJS.Timeout | undefined;
let lastSCPState = Constants.ConnectionState.closed;
let secretariumCoreVersion: string | undefined;
let secretariumWasmVersion: string | undefined;
let secretariumBackendVersions: any;

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
        planReconnection()
            .catch(() => { return; });
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
            const cryptoContext = client.getCryptoContext();
            logger.info(`CS ${cryptoContext.type} (${cryptoContext.version})`);
            logger.info(`PK ${await connectionKey.getRawPublicKeyHex()}`);
            const version: any = await client.newTx('wasm-manager', 'version', 'version', '').send().catch((e) => {
                console.error(e);
            });
            secretariumBackendVersions = version?.version;
            const { wasm_version, core_version } = secretariumBackendVersions ?? { wasm_version: {}, core_version: {} };
            secretariumCoreVersion = `${core_version.major}.${core_version.minor}.${core_version.patch}`;
            secretariumWasmVersion = `${wasm_version.major}.${wasm_version.minor}.${wasm_version.patch}`;
            logger.info(`Core v${secretariumCoreVersion} (${core_version.build_number}) - WASM Manager v${secretariumWasmVersion} (${core_version.build_number})`);
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
    version: () => ({
        core: secretariumCoreVersion,
        wasm: secretariumWasmVersion,
        backend: secretariumBackendVersions
    }),
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