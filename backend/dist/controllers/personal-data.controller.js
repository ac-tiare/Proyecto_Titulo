import { env } from '../config/env.js';
import { personalDataService } from '../services/personal-data.service.js';
import { AppError } from '../utils/app-error.js';
import { deleteAccountSchema } from '../validators/personal-data.validators.js';
const sessionCookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/api',
};
const csrfCookieOptions = {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
};
const authenticatedUserId = (request) => {
    const userId = request.auth?.user.id;
    if (!userId) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
    }
    return userId;
};
export const exportPersonalData = async (request, response) => {
    const data = await personalDataService.exportAccount(authenticatedUserId(request));
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Content-Disposition', `attachment; filename="contigo-datos-${new Date().toISOString().slice(0, 10)}.json"`);
    response.json({ data });
};
export const deletePersonalData = async (request, response) => {
    deleteAccountSchema.parse(request.body);
    await personalDataService.deleteAccount(authenticatedUserId(request));
    response.clearCookie('contigo_access', sessionCookieOptions);
    response.clearCookie('contigo_refresh', sessionCookieOptions);
    response.clearCookie('XSRF-TOKEN', csrfCookieOptions);
    response.status(204).end();
};
