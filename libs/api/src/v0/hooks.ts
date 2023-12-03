import { Prisma } from '@klave/db';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const hookRouter = createTRPCRouter({
    add: publicProcedure
        .input(z.object({ data: z.custom<Prisma.HookCreateInput>() }))
        .mutation(async ({ ctx: { prisma }, input: { data } }) => {
            return await prisma.hook.create({
                data: {
                    ...data,
                    payload: data.payload as any
                }
            });
        })
});

export default hookRouter;