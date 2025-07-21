import { RequestHandler } from 'express-serve-static-core';
import * as datefn from 'date-fns';
import { objectToCamel } from 'ts-case-convert';
import { config } from '@klave/constants';
import { GitHubToken } from '@klave/db';

export const integrationCredsRenewalMiddleware: RequestHandler = (req, __unusedRes, next) => {
    const { session, sessionStore, sessionID } = req;
    if (session.githubToken) {

        const creationDate = datefn.parseISO(session.githubToken.createdAt);
        const expiryDate = datefn.addSeconds(creationDate, session.githubToken.expiresIn - 300);
        const now = new Date();
        if (now < expiryDate)
            return next();

        const refreshTokenExpiryDate = datefn.addSeconds(creationDate, session.githubToken.refreshTokenExpiresIn - 300);
        if (refreshTokenExpiryDate < now) {
            delete session.githubToken;
            sessionStore.set(sessionID, { ...session }, () => {
                next();
            });
            return;
        }

        fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: config.get('KLAVE_GITHUB_CLIENTID'),
                client_secret: config.get('KLAVE_GITHUB_CLIENTSECRET'),
                grant_type: 'refresh_token',
                refresh_token: session.githubToken.refreshToken
            })
        }).then(async (result) => {
            const data = {
                ...objectToCamel(await result.json() as object),
                createdAt: new Date().toISOString()
            } as unknown as GitHubToken & { error?: string; errorDescription?: string; };

            if (!data.error) {
                session.githubToken = data;
                sessionStore.set(sessionID, {
                    ...session,
                    githubToken: data
                }, (err) => {
                    if (err)
                        console.error('Error saving session after token renewal:', err);
                    next();
                });
            } else {
                console.error('Error renewing GitHub token:', data.error, data.errorDescription);
                delete session.githubToken;
                sessionStore.set(sessionID, { ...session }, (err) => {
                    if (err)
                        console.error('Error saving session after token renewal failure:', err);
                    next();
                });
            }

        }).catch((error) => {
            console.error('Error renewing GitHub token:', error);
            delete session.githubToken;
            sessionStore.set(sessionID, { ...session }, (err) => {
                if (err)
                    console.error('Error saving session after token renewal failure:', err);
                next();
            });
        });
    } else {
        next();
    }
};