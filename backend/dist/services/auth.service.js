import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { createSessionToken, hashSessionToken } from '../utils/session-token.js';
const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
});
const createCredentials = () => {
    const accessToken = createSessionToken();
    const refreshToken = createSessionToken();
    const now = Date.now();
    return {
        accessToken,
        refreshToken,
        accessTokenHash: hashSessionToken(accessToken),
        refreshTokenHash: hashSessionToken(refreshToken),
        accessExpiresAt: new Date(now + env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000),
        refreshExpiresAt: new Date(now + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
    };
};
const createSession = async (user, client) => {
    const credentials = createCredentials();
    const session = await sessionRepository.create({
        userId: user.id,
        accessTokenHash: credentials.accessTokenHash,
        refreshTokenHash: credentials.refreshTokenHash,
        client,
        accessExpiresAt: credentials.accessExpiresAt,
        refreshExpiresAt: credentials.refreshExpiresAt,
    });
    return {
        user: publicUser(user),
        sessionId: session.id,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        accessExpiresAt: credentials.accessExpiresAt,
        refreshExpiresAt: credentials.refreshExpiresAt,
        csrfToken: createSessionToken(),
    };
};
const isUniqueViolation = (error) => typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002';
export const authService = {
    async register(input, client) {
        const passwordHash = await argon2.hash(input.password, {
            type: argon2.argon2id,
            memoryCost: 19_456,
            timeCost: 2,
            parallelism: 1,
            salt: randomBytes(16),
        });
        const credentials = createCredentials();
        try {
            const created = await userRepository.createWithSession({
                name: input.name,
                surname: input.surname || null,
                email: input.email,
                passwordHash,
            }, {
                accessTokenHash: credentials.accessTokenHash,
                refreshTokenHash: credentials.refreshTokenHash,
                client,
                accessExpiresAt: credentials.accessExpiresAt,
                refreshExpiresAt: credentials.refreshExpiresAt,
            });
            return {
                user: publicUser(created.user),
                sessionId: created.session.id,
                accessToken: credentials.accessToken,
                refreshToken: credentials.refreshToken,
                accessExpiresAt: credentials.accessExpiresAt,
                refreshExpiresAt: credentials.refreshExpiresAt,
                csrfToken: createSessionToken(),
            };
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Ese correo ya está registrado.');
            }
            throw error;
        }
    },
    async login(input, client) {
        const user = await userRepository.findByEmail(input.email);
        if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
            throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
        }
        return createSession(user, client);
    },
    async refresh(refreshToken, client) {
        const credentials = createCredentials();
        const session = await sessionRepository.rotate({
            currentRefreshTokenHash: hashSessionToken(refreshToken),
            nextAccessTokenHash: credentials.accessTokenHash,
            nextRefreshTokenHash: credentials.refreshTokenHash,
            client,
            now: new Date(),
            accessExpiresAt: credentials.accessExpiresAt,
            refreshExpiresAt: credentials.refreshExpiresAt,
        });
        if (!session) {
            throw new AppError(401, 'UNAUTHENTICATED', 'La sesión no es válida o expiró.');
        }
        return {
            user: publicUser(session.user),
            sessionId: session.id,
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            accessExpiresAt: credentials.accessExpiresAt,
            refreshExpiresAt: credentials.refreshExpiresAt,
            csrfToken: createSessionToken(),
        };
    },
    async authenticate(accessToken) {
        const session = await sessionRepository.findActiveByAccessTokenHash(hashSessionToken(accessToken), new Date());
        if (!session) {
            throw new AppError(401, 'UNAUTHENTICATED', 'La sesión no es válida o expiró.');
        }
        return {
            user: session.user,
            sessionId: session.id,
            client: session.client,
        };
    },
    async logout(sessionId, userId) {
        await sessionRepository.revoke(sessionId, userId, new Date());
    },
    async updateProfile(userId, input) {
        try {
            return await userRepository.updatePublic(userId, {
                name: input.name,
                surname: input.surname ?? null,
                email: input.email,
            });
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Ese correo ya está registrado.');
            }
            throw error;
        }
    },
};
