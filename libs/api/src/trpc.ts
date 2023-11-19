/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { type Context } from './context';
import { transformer } from './transformer';

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC
    .context<Awaited<Context>>()
    .create({
        transformer,
        errorFormatter({ shape }) {
            return shape;
        }
    });

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
    // if (!ctx.session || !ctx.session.user) {
    if (!ctx.session) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
        ctx: {
            // infers the `session` as non-nullable
            // session: { ...ctx.session, user: ctx.session.user }
            session: { ...ctx.session }
        }
    });
});

/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);









// import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
// import { initTRPC, inferAsyncReturnType } from '@trpc/server';

// // You can use any variable name you like.
// // We use t to keep things simple.
// export const createContext = async ({
//     req
//     // res
// }: CreateExpressContextOptions) => {
//     async function getUserFromHeader() {
//         if (req.headers.authorization) {
//             return req.headers.authorization.split(' ')[1];
//         }
//         return null;
//     }
//     const authorization = await getUserFromHeader();
//     return {
//         authorization
//     };
// };
// type Context = inferAsyncReturnType<typeof createContext>;

// export const t = initTRPC.context<Context>().create();

// export const router = t.router;
// export const middleware = t.middleware;
// export const procedure = t.procedure;