import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado.' },
  });
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos ingresados.',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Ya existe un registro con esos datos.',
        },
      });
      return;
    }
    if (error.code === 'P2025') {
      response.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado.' },
      });
      return;
    }
  }

  logger.error(
    {
      requestId: request.id,
      method: request.method,
      path: request.path,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    },
    'Unhandled request error',
  );
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo nuevamente.',
    },
  });
};
