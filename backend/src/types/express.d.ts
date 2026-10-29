import type { AuthenticatedUser } from './user.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: AuthenticatedUser;
        sessionId: string;
        client: 'WEB' | 'NATIVE';
        credentialType: 'COOKIE' | 'BEARER';
      };
    }
  }
}

export {};
