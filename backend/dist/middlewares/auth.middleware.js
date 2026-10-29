import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
export const requireAuth = async (request, _response, next) => {
    try {
        const bearer = request.header('authorization')?.match(/^Bearer ([A-Za-z0-9_-]+)$/)?.[1];
        const cookieToken = request.cookies?.contigo_access;
        const token = bearer ?? cookieToken;
        if (!token) {
            throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
        }
        const session = await authService.authenticate(token);
        request.auth = {
            user: session.user,
            sessionId: session.sessionId,
            client: session.client,
            credentialType: bearer ? 'BEARER' : 'COOKIE',
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
export const requireCsrf = (request, _response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        next();
        return;
    }
    const isBearerRequest = request.header('authorization')?.startsWith('Bearer ');
    const isNativeClient = request.header('x-contigo-client') === 'native';
    const origin = request.header('origin');
    if (isBearerRequest ||
        (isNativeClient && origin && env.nativeOrigins.includes(origin))) {
        next();
        return;
    }
    const allowedOrigins = request.app.locals.webOrigins;
    const csrfCookie = request.cookies?.['XSRF-TOKEN'];
    const csrfHeader = request.header('x-xsrf-token');
    if (!origin ||
        !allowedOrigins.includes(origin) ||
        !csrfCookie ||
        !csrfHeader ||
        csrfCookie.length !== csrfHeader.length ||
        !cryptoSafeEqual(csrfCookie, csrfHeader)) {
        next(new AppError(403, 'CSRF_REJECTED', 'No se pudo validar la solicitud.'));
        return;
    }
    next();
};
const cryptoSafeEqual = (left, right) => timingSafeEqual(Buffer.from(left), Buffer.from(right));
