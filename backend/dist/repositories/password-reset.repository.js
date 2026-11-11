import { prisma } from '../config/prisma.js';
export const passwordResetRepository = {
    findAccountByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true },
        });
    },
    issue(userId, tokenHash, expiresAt) {
        return prisma.$transaction(async (transaction) => {
            await transaction.passwordResetToken.deleteMany({ where: { userId } });
            return transaction.passwordResetToken.create({
                data: { userId, tokenHash, expiresAt },
                select: { id: true },
            });
        });
    },
    findValidToken(tokenHash, now) {
        return prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: { gt: now },
            },
            select: { id: true, userId: true },
        });
    },
    complete(tokenId, userId, passwordHash, now) {
        return prisma.$transaction(async (transaction) => {
            const consumed = await transaction.passwordResetToken.updateMany({
                where: {
                    id: tokenId,
                    userId,
                    usedAt: null,
                    expiresAt: { gt: now },
                },
                data: { usedAt: now },
            });
            if (consumed.count !== 1)
                return false;
            await transaction.user.update({
                where: { id: userId },
                data: { passwordHash, updatedAt: now },
            });
            await transaction.session.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: now },
            });
            await transaction.passwordResetToken.deleteMany({
                where: { userId, id: { not: tokenId } },
            });
            return true;
        });
    },
};
