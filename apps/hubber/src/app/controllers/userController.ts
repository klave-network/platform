import { prisma, Prisma } from '@klave/db';

export const createUser = async (user: Prisma.UserCreateInput) => {
    return prisma.user.create({ data: user });
};

export const getUsers = async (userFilter?: Prisma.UserWhereUniqueInput) => {
    if (userFilter)
        return await prisma.user.findUnique({ where: userFilter });
    return await prisma.user.findMany();
};
