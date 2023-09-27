import { createNodeMiddleware } from 'probot';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import { probot, logger } from '@klave/providers';
import probotApp from '../probot';

let reconnectAttempt = 0;
let pingInterval: NodeJS.Timeout | undefined = undefined;

const connectToDispatcher = () => {
    // TODO Ensure only ever one connection is open, we see multiple connections in the wild
    const hookSocket = new WebSocket(process.env.NX_DISPATCH_WS!);
    hookSocket.addEventListener('open', () => {
        hookSocket.send(process.env.NX_DISPATCH_SECRET!);
        logger.info(`Connected to dispatcher ${process.env.NX_DISPATCH_WS}`);
        pingInterval = setInterval(() => {
            hookSocket.ping();
        }, 30000);
    });
    hookSocket.addEventListener('error', (event) => {
        logger.error(`Connection ${++reconnectAttempt} to dispatcher failed: ${event.message}`);
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = undefined;
        }
        setTimeout(connectToDispatcher, 1000);
    });
    hookSocket.addEventListener('close', (event) => {
        logger.error(`Connection ${++reconnectAttempt} to dispatcher has been closed: ${event.code} ${event.reason}`);
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = undefined;
        }
        setTimeout(connectToDispatcher, 1000);
    });
    hookSocket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data.toString()) as any;
        fetch('http://127.0.0.1:3333/hook', {
            method: 'POST',
            headers: {
                ...message.headers
            },
            body: JSON.stringify(message.body)
        }).catch(reason => {
            logger.warn(`Hook passover failed: ${reason}`);
        });
    });
};

// TODO: Remove this when we are ready to go live
// if (process.env.NODE_ENV !== 'production')
connectToDispatcher();

export const probotMiddleware = createNodeMiddleware(probotApp, {
    probot
});
