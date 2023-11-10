import { createNodeMiddleware } from 'probot';
import { probot } from '@klave/providers';
import probotApp from '../probot';

export const probotMiddleware = createNodeMiddleware(probotApp, {
    probot
});
