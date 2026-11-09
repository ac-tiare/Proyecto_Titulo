import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('includes the field-level reason for validation errors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revisa los datos ingresados.',
          details: [
            { field: 'email', message: 'Ingresa un correo válido.' },
          ],
        },
      },
    });

    expect(apiErrorMessage(error)).toBe(
      'Revisa los datos ingresados. Ingresa un correo válido.',
    );
  });

  it('preserves the clear message returned for invalid credentials', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Correo o contraseña incorrectos.',
        },
      },
    });

    expect(apiErrorMessage(error)).toBe('Correo o contraseña incorrectos.');
  });

  it('keeps the API validation message when no detail is provided', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revisa los datos ingresados.',
        },
      },
    });

    expect(apiErrorMessage(error)).toBe('Revisa los datos ingresados.');
  });
});
