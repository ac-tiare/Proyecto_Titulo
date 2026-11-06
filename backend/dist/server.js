import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { app } from './app.js';
const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'CONTIGO API listening');
});
const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down API');
    server.close((error) => {
        if (error) {
            logger.error({ err: error }, 'HTTP server did not close cleanly');
            process.exitCode = 1;
        }
        void prisma
            .$disconnect()
            .then(() => process.exit())
            .catch((disconnectError) => {
            logger.error({ err: disconnectError }, 'Failed to disconnect Prisma');
            process.exit(1);
        });
    });
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection');
});
