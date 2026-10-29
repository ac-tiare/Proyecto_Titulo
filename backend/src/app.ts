import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { requireCsrf } from './middlewares/auth.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { contactRoutes } from './routes/contact.routes.js';
import { emotionRoutes } from './routes/emotion.routes.js';
import { personalDataRoutes } from './routes/personal-data.routes.js';
import { safetyPlanRoutes } from './routes/safety-plan.routes.js';

export const app = express();
const allowedOrigins = [...new Set([...env.webOrigins, ...env.nativeOrigins])];

app.locals.webOrigins = env.webOrigins;
app.set('trust proxy', env.TRUST_PROXY ? 1 : false);
app.disable('x-powered-by');
app.use(
  pinoHttp<IncomingMessage, ServerResponse>({
    logger,
    genReqId: (request, response) => {
      const requestId = request.headers['x-request-id'];
      const id =
        typeof requestId === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(requestId)
          ? requestId
          : randomUUID();
      response.setHeader('x-request-id', id);
      return id;
    },
    serializers: {
      req: (request) => ({
        id: request.id,
        method: request.method,
        url: request.url,
        remoteAddress: request.socket?.remoteAddress,
      }),
      res: (response) => ({ statusCode: response.statusCode }),
    },
    customLogLevel: (_request, response, error) => {
      if (error || response.statusCode >= 500) return 'error';
      if (response.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-XSRF-TOKEN',
      'X-Contigo-Client',
    ],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: '32kb', strict: true }));
app.use(cookieParser());
app.use(requireCsrf);

app.get('/api/health', (_request, response) => {
  response.json({ data: { status: 'ok' } });
});

app.get('/api/ready', async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ data: { status: 'ready' } });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/emociones', emotionRoutes);
app.use('/api/privacy', personalDataRoutes);
app.use('/api/plan-seguridad', safetyPlanRoutes);
app.use('/api/contactos', contactRoutes);
app.use('/api', notFoundHandler);
app.use(errorHandler);
