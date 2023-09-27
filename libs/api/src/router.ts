import { createTRPCRouter } from './trpc';
import { v0Router } from './v0';

export const router = createTRPCRouter({
    v0: v0Router
});

export type Router = typeof router;