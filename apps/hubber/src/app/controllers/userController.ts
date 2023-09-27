import db, { Prisma } from '../../utils/db';

export const createUser = async (user: Prisma.UserCreateInput) => {
    return db.user.create({ data: user });
};

export const getUsers = async (userFilter?: Prisma.UserWhereUniqueInput) => {
    if (userFilter)
        return await db.user.findUnique({ where: userFilter });
    return await db.user.findMany();
};
