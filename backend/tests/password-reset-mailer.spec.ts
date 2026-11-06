import { describe, expect, it, vi } from 'vitest';

import {
  createPasswordResetMailer,
  type MailTransport,
} from '../src/services/password-reset-mailer.js';

describe('password reset mailer', () => {
  it('creates an SMTP transport lazily and sends a temporary reset link', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'message-1' });
    const transport: MailTransport = { sendMail };
    const transportFactory = vi.fn(() => transport);
    const mailer = createPasswordResetMailer(
      {
        host: 'smtp.example.cl',
        port: 587,
        secure: false,
        user: 'mailer@example.cl',
        password: 'test-password',
        from: 'CONTIGO <mailer@example.cl>',
        publicAppUrl: 'https://contigo.example.cl',
      },
      transportFactory,
    );

    expect(mailer.isConfigured()).toBe(true);
    await mailer.send('person@example.cl', 'opaque-test-token');

    expect(transportFactory).toHaveBeenCalledWith({
      host: 'smtp.example.cl',
      port: 587,
      secure: false,
      auth: { user: 'mailer@example.cl', pass: 'test-password' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'CONTIGO <mailer@example.cl>',
        to: 'person@example.cl',
        subject: 'Restablece tu contraseña de CONTIGO',
        text: expect.stringContaining(
          'https://contigo.example.cl/reset-password?token=opaque-test-token',
        ),
        html: expect.stringContaining('El enlace vence en 15 minutos'),
      }),
    );
  });

  it('reports the transport as unavailable when SMTP is not configured', async () => {
    const mailer = createPasswordResetMailer({
      port: 587,
      secure: false,
      publicAppUrl: 'http://localhost:8080',
    });

    expect(mailer.isConfigured()).toBe(false);
    await expect(mailer.send('person@example.cl', 'token')).rejects.toThrow(
      'Password recovery mail transport is not configured.',
    );
  });
});
