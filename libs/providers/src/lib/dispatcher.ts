import WebSocket from 'ws';
import { logger } from './logger';

let reconnectAttempt = 0;
let pingInterval: NodeJS.Timeout | undefined = undefined;
let reconnectionTimeout: NodeJS.Timeout | undefined;

const planReconnection = async () => {
    return new Promise((resolve) => {
        if (!reconnectionTimeout) {
            reconnectionTimeout = setTimeout(() => {
                clearTimeout(reconnectionTimeout);
                reconnectionTimeout = undefined;
                dispatchOps.initialize().then(resolve).catch(() => { return; });
            }, 3000);
        }
    });
};

export const dispatchOps = {
    initialize: async () => {
        try {
            const dispatcherWs = process.env['KLAVE_DISPATCH_WS'] || 'ws://localhost:3334';
            const dispatcherSecret = process.env['KLAVE_DISPATCH_SECRET'];

            if (!dispatcherSecret) {
                logger.error('Dispatcher secret is not set');
                return;
            }

            const hookSocket = new WebSocket(dispatcherWs);
            hookSocket.addEventListener('open', () => {
                hookSocket.send(dispatcherSecret);
                logger.info(`Connected to dispatcher ${dispatcherWs}`);
                reconnectAttempt = 0;
                pingInterval = setInterval(() => {
                    hookSocket.ping();
                }, 30000);
            });
            hookSocket.addEventListener('error', (event) => {
                (async () => {
                    logger.error(`Connection ${++reconnectAttempt} to dispatcher failed: ${event.message}`);
                    if (pingInterval)
                        clearInterval(pingInterval);
                    pingInterval = undefined;
                    await planReconnection();
                })()
                    .catch(() => { return; });
            });
            hookSocket.addEventListener('close', (event) => {
                (async () => {
                    logger.error(`Connection ${++reconnectAttempt} to dispatcher has been closed: ${event.code} ${event.reason}`);
                    if (pingInterval)
                        clearInterval(pingInterval);
                    pingInterval = undefined;
                    await planReconnection();
                })()
                    .catch(() => { return; });
            });
            hookSocket.addEventListener('message', (event) => {
                const message = JSON.parse(event.data.toString()) as {
                    headers: Record<string, string>;
                    body: Array<number>
                };
                // TODO: Try to not use fetch on localhost here. Also get the actual port.
                fetch('http://127.0.0.1:3333/hook', {
                    method: 'POST',
                    headers: message.headers,
                    body: Uint8Array.from(message.body)
                }).catch(reason => {
                    logger.warn(`Hook passover failed: ${reason}`);
                });
            });
        } catch (e) {
            await planReconnection();
        }
    }
};