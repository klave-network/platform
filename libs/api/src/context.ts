// import { getServerAuthSession, type Session } from '@secretarium/hubber-auth';
// import { getServerAuthSession } from './get-session';
import { prisma } from '@klave/db';
import { type inferAsyncReturnType } from '@trpc/server';
// import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';

// /**
//  * 1. CONTEXT
//  *
//  * This section defines the "contexts" that are available in the backend API
//  *
//  * These allow you to access things like the database, the session, etc, when
//  * processing a request
//  *
//  */

// /**
//  * Replace this with an object if you want to pass things to createContextInner
//  */
// type CreateContextOptions = {
//     session: Session | null;
// };

// /**
//  * This helper generates the "internals" for a tRPC context. If you need to use
//  * it, you can export it from here
//  *
//  * Examples of things you may need it for:
//  * - testing, so we dont have to mock Next.js' req/res
//  * - trpc's `createSSGHelpers` where we don't have req/res
//  * @see https://beta.create.t3.gg/en/usage/trpc#-servertrpccontextts
//  */
// export const createContextInner = async (opts: CreateContextOptions) => {
//     return {
//         session: opts.session,
//         prisma
//     };
// };

// type CreateContextOptionsType = CreateNextContextOptions | CreateExpressContextOptions;
// /**
//  * This is the actual context you'll use in your router. It will be used to
//  * process every request that goes through your tRPC endpoint
//  * @link https://trpc.io/docs/context
//  */
// export const createContextWithNextAuth = async (opts: CreateContextOptionsType) => {
//     const { req, res } = opts;

//     // Get the session from the server using the unstable_getServerSession wrapper function
//     const session = await getServerAuthSession({ req, res });

//     return await createContextInner({
//         session
//     });
// };


export const createContext = async (opts: CreateExpressContextOptions) => {
    const { req } = opts;
    const { session, sessionID, sessionStore, /*user,*/ web, webId, body, login } = req;

    return {
        session,
        sessionID,
        sessionStore,
        // user,
        prisma,
        web,
        webId,
        body,
        login,
        req
    };
};


export type Context = inferAsyncReturnType<typeof createContext>;
