import nodemailer from 'nodemailer';
export const createPasswordResetMailer = (config, transportFactory = (options) => nodemailer.createTransport(options)) => {
    let transport;
    return {
        isConfigured: () => Boolean(config.host && config.from),
        async send(email, token) {
            if (!config.host || !config.from) {
                throw new Error('Password recovery mail transport is not configured.');
            }
            transport ??= transportFactory({
                host: config.host,
                port: config.port,
                secure: config.secure,
                ...(config.user && config.password
                    ? { auth: { user: config.user, pass: config.password } }
                    : {}),
            });
            const resetUrl = new URL('/reset-password', `${config.publicAppUrl}/`);
            resetUrl.searchParams.set('token', token);
            await transport.sendMail({
                from: config.from,
                to: email,
                subject: 'Restablece tu contraseña de CONTIGO',
                text: [
                    'Hola,',
                    '',
                    'Recibimos una solicitud para restablecer la contraseña de tu cuenta CONTIGO.',
                    'Abre el siguiente enlace dentro de los próximos 15 minutos para crear una nueva contraseña:',
                    resetUrl.toString(),
                    '',
                    'Si no solicitaste este cambio, puedes ignorar este mensaje: tu contraseña seguirá siendo la misma.',
                    'Por seguridad, no compartas este enlace.',
                ].join('\n'),
                html: [
                    '<p>Hola,</p>',
                    '<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta CONTIGO.</p>',
                    `<p><a href="${resetUrl.toString()}">Crear una nueva contraseña</a></p>`,
                    '<p>El enlace vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje: tu contraseña seguirá siendo la misma.</p>',
                    '<p>Por seguridad, no compartas este enlace.</p>',
                ].join(''),
            });
        },
    };
};
