import { prisma } from '../config/prisma.js';
const publicUserSelect = {
    id: true,
    name: true,
    surname: true,
    email: true,
};
export const userRepository = {
    findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    },
    findPublicById(id) {
        return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    },
    create(data) {
        return prisma.user.create({ data, select: publicUserSelect });
    },
    createWithSession(data, session) {
        return prisma.$transaction(async (transaction) => {
            const user = await transaction.user.create({
                data,
                select: publicUserSelect,
            });
            const createdSession = await transaction.session.create({
                data: { ...session, userId: user.id },
                select: { id: true },
            });
            return { user, session: createdSession };
        });
    },
    updatePublic(id, data) {
        return prisma.user.update({ where: { id }, data, select: publicUserSelect });
    },
};
