import type { Request, Response } from 'express';

import { env } from '../config/env.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
import { createCsrfToken } from '../utils/session-token.js';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validators.js';

const sessionCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api',
  expires,
});

const csrfCookieOptions = (expires: Date) => ({
  httpOnly: false,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
  expires,
});

const clientType = (request: Request): 'WEB' | 'NATIVE' =>
  request.header('x-contigo-client') === 'native' ? 'NATIVE' : 'WEB';

const deliverSession = (
  request: Request,
  response: Response,
  result: Awaited<ReturnType<typeof authService.login>>,
  statusCode = 200,
) => {
  if (clientType(request) === 'NATIVE') {
    response.status(statusCode).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessExpiresAt: result.accessExpiresAt.toISOString(),
        refreshExpiresAt: result.refreshExpiresAt.toISOString(),
      },
    });
    return;
  }

  response.cookie(
    'contigo_access',
    result.accessToken,
    sessionCookieOptions(result.accessExpiresAt),
  );
  response.cookie(
    'contigo_refresh',
    result.refreshToken,
    sessionCookieOptions(result.refreshExpiresAt),
  );
  response.cookie(
    'XSRF-TOKEN',
    result.csrfToken,
    csrfCookieOptions(result.refreshExpiresAt),
  );
  response.status(statusCode).json({
    data: {
      user: result.user,
      accessExpiresAt: result.accessExpiresAt.toISOString(),
      refreshExpiresAt: result.refreshExpiresAt.toISOString(),
    },
  });
};

export const getCsrfToken = (_request: Request, response: Response): void => {
  const csrfToken = createCsrfToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  response.cookie('XSRF-TOKEN', csrfToken, csrfCookieOptions(expiresAt));
  response.json({ data: { csrfToken } });
};

export const register = async (request: Request, response: Response): Promise<void> => {
  const input = registerSchema.parse(request.body);
  const result = await authService.register(input, clientType(request));
  deliverSession(request, response, result, 201);
};

export const login = async (request: Request, response: Response): Promise<void> => {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input, clientType(request));
  deliverSession(request, response, result);
};

export const refresh = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const client = clientType(request);
  const refreshToken =
    client === 'NATIVE'
      ? refreshSchema.parse(request.body).refreshToken
      : request.cookies?.contigo_refresh;
  if (typeof refreshToken !== 'string') {
    throw new AppError(401, 'UNAUTHENTICATED', 'La sesión no es válida o expiró.');
  }
  const result = await authService.refresh(refreshToken, client);
  deliverSession(request, response, result);
};

export const logout = async (request: Request, response: Response): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'La sesión ya no está activa.' },
    });
    return;
  }
  await authService.logout(request.auth.sessionId, request.auth.user.id);
  response.clearCookie('contigo_access', sessionCookieOptions(new Date(0)));
  response.clearCookie('contigo_refresh', sessionCookieOptions(new Date(0)));
  response.clearCookie('XSRF-TOKEN', csrfCookieOptions(new Date(0)));
  response.status(204).end();
};

export const me = (request: Request, response: Response): void => {
  response.json({ data: request.auth?.user });
};

export const updateMe = async (request: Request, response: Response): Promise<void> => {
  const input = updateProfileSchema.parse(request.body);
  const user = await authService.updateProfile(request.auth!.user.id, input);
  response.json({ data: user });
};
