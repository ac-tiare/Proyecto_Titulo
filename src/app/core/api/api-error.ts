import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorResponse } from './api.models';

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  const error = value['error'];
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error['code'] === 'string' &&
    'message' in error &&
    typeof error['message'] === 'string'
  );
};

export const apiErrorMessage = (error: unknown): string => {
  if (!(error instanceof HttpErrorResponse)) {
    return 'No se pudo completar la solicitud. Inténtalo nuevamente.';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
  }
  if (isApiErrorResponse(error.error)) {
    return error.error.error.message;
  }
  if (error.status >= 500) {
    return 'El servidor no pudo completar la solicitud. Inténtalo nuevamente.';
  }
  return 'Revisa los datos ingresados e inténtalo nuevamente.';
};
