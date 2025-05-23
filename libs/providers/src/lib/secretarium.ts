import { SCP, Key, Constants, EncryptedKeyPair } from '@secretarium/connector';
import { prisma } from '@klave/db';
import { logger } from './logger';
import { BackendVersion, config } from '@klave/constants';

export const defaultSCPOptions: ConstructorParameters<typeof SCP>[0] = {
    logger: process.env['NODE_ENV'] === 'development' ? {
        debug: (message: string, obj) => {
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
        info: (message: string) => logger.info(`SCP> ${message}`),
        warn: (message: string) => logger.warn(`SCP> ${message}`),
        error: (message: string) => logger.error(`SCP> ${message}`)
    } : undefined
};

const client = new SCP(defaultSCPOptions);

let connectionKey: Key | undefined;
let reconnectAttempt = 0;
let reconnectionTimeout: NodeJS.Timeout | undefined;
let lastSCPState = Constants.ConnectionState.closed;
let secretariumCoreVersion: string | undefined;
let secretariumWasmVersion: string | undefined;
let secretariumBackendVersions: BackendVersion['version'] | undefined;
let secretariumVersionUpdateTimer: NodeJS.Timeout | undefined;

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

const getBackendVersions = async () => {
    if (client.isConnected()) {
        const isFirstVersionFetch = !secretariumBackendVersions;
        const previousSecretariumCoreVersion = secretariumCoreVersion;
        const previousSecretariumWasmVersion = secretariumWasmVersion;
        const previousSecretariumCoreBuild = secretariumBackendVersions?.core_version?.build_number;
        const previousSecretariumWasmBuild = secretariumBackendVersions?.wasm_version?.build_number;
        const version = await client.newTx<BackendVersion>(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'version', 'version', '').send().catch((e) => {
            console.error(e);
        });
        secretariumBackendVersions = version?.version;
        const { wasm_version, core_version } = secretariumBackendVersions ?? { wasm_version: {}, core_version: {} };
        secretariumCoreVersion = `${core_version.major}.${core_version.minor}.${core_version.patch}`;
        secretariumWasmVersion = `${wasm_version.major}.${wasm_version.minor}.${wasm_version.patch}`;
        if (previousSecretariumCoreVersion !== secretariumCoreVersion || previousSecretariumWasmVersion !== secretariumWasmVersion || previousSecretariumCoreBuild !== core_version.build_number || previousSecretariumWasmBuild !== wasm_version.build_number) {
            if (!isFirstVersionFetch)
                logger.info('Secretarium backend versions changed');
            logger.info(`Core v${secretariumCoreVersion} (${core_version.build_number}) - WASM Manager v${secretariumWasmVersion} (${core_version.build_number})`);
        }
    }
    if (secretariumVersionUpdateTimer !== undefined)
        secretariumVersionUpdateTimer = setTimeout(() => { getBackendVersions().catch(() => { return; }); }, 300000);
};

const getKreditPipelineInformation = async () => {
    if (client.isConnected()) {
        await client.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'configure_kredit_reporting', 'configure_kredit_reporting', {
            report_url: process.env['KLAVE_KREDIT_REPORTING_URL']
        }).send().catch((e) => {
            console.error(e);
        });
        const kreditReportPK = (await client.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_kredit_pk', 'get_kredit_pk', '').send().catch((e) => {
            console.error(e);
        }))?.pk;
        const kreditCosts = (await client.newTx(config.get('KLAVE_DEPLOYMENT_MANDLER'), 'get_kredit_costs', 'get_kredit_costs', '').send().catch((e) => {
            console.error(e);
        }))?.kredit_costs;

        if (kreditReportPK)
            logger.info(`Kredit Reporting PK ${kreditReportPK}`);
        if (kreditCosts)
            logger.info(`Kredit Costs ${kreditCosts}`);
    }
};

client.onError((error) => {
    logger.error(`Connection to Secretarium errored: ${error}`);
    lastSCPState = Constants.ConnectionState.closed;
    planReconnection()
        .catch(() => { return; });
});

client.onStateChange((state) => {
    logger.info(`Connection to Secretarium's state changed from ${lastSCPState} to ${state}`);
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
            const sessionInfo = client.getSessionInfo();
            const connectionInfo = client.getConnectionInfo();
            const cryptoContext = client.getCryptoContext();
            logger.info(`Connected to Secretarium ${node} (${connectionInfo.protocol}:${connectionInfo.protocolVersion}${connectionInfo.server ? ` via ${connectionInfo.server}:${connectionInfo.serverVersion}` : ''} - ${connectionInfo.serverComment})`);
            if (sessionInfo.gatewaySessionId)
                logger.info(`Session via gateway G:${sessionInfo.gatewaySessionId} S:${sessionInfo.sessionId} (N:${sessionInfo.nodeId})`);
            logger.info(`CS ${cryptoContext.type} (${cryptoContext.version})`);
            logger.info(`PK ${await connectionKey.getRawPublicKeyHex()}`);
            await getBackendVersions();
            await getKreditPipelineInformation();
            reconnectAttempt = 0;
            return;
        } catch (e) {
            logger.error(`Connection ${++reconnectAttempt} to Secretarium ${node} failed: ${e}`);
            lastSCPState = Constants.ConnectionState.closed;
            await planReconnection();
        }
    },
    getRunningKey: () => connectionKey,
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
            console.error(e?.toString());
        }
    }
};

export const scp = client;