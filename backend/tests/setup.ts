process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://contigo_test:contigo_test@127.0.0.1:5432/contigo_test';
process.env.COOKIE_SECURE ??= 'false';
