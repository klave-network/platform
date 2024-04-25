import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';

export const userRouter = createTRPCRouter({
    infiniteUsers: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish() // <-- "cursor" needs to exist, but can be any type
            })
        )
        .query(async ({ ctx: { session, prisma }, input }) => {

            if (!session.user?.globalAdmin) {
                throw new Error('Not authenticated');
            }

            const userCount = await prisma.user.count();
            const { cursor } = input;
            const limit = input.limit ?? 50;
            const users = await prisma.user.findMany({
                take: limit + 1, // get an extra item at the end which we'll use as next cursor
                cursor: cursor ? {
                    id: cursor
                } : undefined,
                orderBy: {
                    id: 'asc'
                },
                include: {
                    createdOrganisations: true
                }
            });
            let nextCursor: typeof cursor | undefined = undefined;
            if (users.length > limit) {
                const nextItem = users.pop();
                nextCursor = nextItem?.id;
            }
            return {
                data: users,
                meta: {
                    totalRowCount: userCount
                },
                nextCursor
            };
        })
});

export default userRouter;