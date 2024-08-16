import 'express';
import 'express-session';
import 'passport';
import { type User as UserEntity, GitHubToken, Web } from '@klave/db';

type FilteredUserEntity = Pick<UserEntity, 'id' | 'slug' | 'globalAdmin'> & { personalOrganisationId?: string };

declare module 'express-session' {
    interface SessionData {
        githubToken?: GitHubToken;
        currentChallenge?: string;
        user?: FilteredUserEntity;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {

        interface User extends FilteredUserEntity {
            readonly id: string;
        }
        interface Request {
            web: Web;
            webId: string;
        }
    }
}

export * from './types';

export type { Router } from './router';
export { router } from './router';

export type { Context } from './context';
export { createContext } from './context';
export { createCallerFactory } from './trpc';

export * from './deployment/deploymentController';
