import { randomUUID } from 'node:crypto';

import argon2 from 'argon2';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { assertIsolatedTestDatabase, cleanTestUsers } from './test-database.js';

const enabled = process.env.RUN_DB_INTEGRATION_TESTS === 'true';
const testUserIds: string[] = [];

interface NativeAuthResponse {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
}

describe.skipIf(!enabled)('REST API with isolated PostgreSQL', () => {
  beforeAll(() => {
    assertIsolatedTestDatabase();
  });

  it('refuses non-test database URLs and confirms PostgreSQL readiness', async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    try {
      for (const unsafeUrl of [
        'postgresql://user:password@localhost:5432/contigo',
        'postgresql://user:password@example.com:5432/contigo_test',
      ]) {
        process.env.DATABASE_URL = unsafeUrl;
        expect(assertIsolatedTestDatabase).toThrow(
          'Database integration tests require a local PostgreSQL database named contigo_test.',
        );
      }
    } finally {
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    }

    const ready = await request(app).get('/api/ready');
    expect(ready.status).toBe(200);
    expect(ready.body).toEqual({ data: { status: 'ready' } });

    const unauthenticated = await request(app).get('/api/emociones');
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe('UNAUTHENTICATED');
  });

  afterEach(async () => {
    await cleanTestUsers(testUserIds);
    testUserIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers, authenticates, persists data, isolates owners, and revokes sessions', async () => {
    const firstEmail = `integration-${randomUUID()}@example.invalid`;
    const secondEmail = `integration-${randomUUID()}@example.invalid`;
    const password = 'integration-test-password';
    const nativeHeaders = {
      Origin: 'capacitor://localhost',
      'X-Contigo-Client': 'native',
    };

    const firstRegistration = await request(app)
      .post('/api/auth/register')
      .set(nativeHeaders)
      .send({ name: 'Integration A', email: firstEmail, password });
    expect(firstRegistration.status).toBe(201);
    expect(firstRegistration.body.data).not.toHaveProperty('passwordHash');
    const firstRegistered =
      firstRegistration.body.data as NativeAuthResponse;
    testUserIds.push(firstRegistered.user.id);

    const savedUser = await prisma.user.findUniqueOrThrow({
      where: { id: firstRegistered.user.id },
      select: { passwordHash: true },
    });
    expect(savedUser.passwordHash).not.toBe(password);
    expect(await argon2.verify(savedUser.passwordHash, password)).toBe(true);

    const duplicateRegistration = await request(app)
      .post('/api/auth/register')
      .set(nativeHeaders)
      .send({ name: 'Duplicate', email: firstEmail, password });
    expect(duplicateRegistration.status).toBe(409);
    expect(duplicateRegistration.body.error.code).toBe(
      'EMAIL_ALREADY_REGISTERED',
    );

    const secondRegistration = await request(app)
      .post('/api/auth/register')
      .set(nativeHeaders)
      .send({ name: 'Integration B', email: secondEmail, password });
    expect(secondRegistration.status).toBe(201);
    const secondRegistered =
      secondRegistration.body.data as NativeAuthResponse;
    testUserIds.push(secondRegistered.user.id);

    const login = await request(app)
      .post('/api/auth/login')
      .set(nativeHeaders)
      .send({ email: firstEmail, password });
    expect(login.status).toBe(200);
    const loginCredentials = login.body.data as NativeAuthResponse;

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set(nativeHeaders)
      .send({ refreshToken: loginCredentials.refreshToken });
    expect(refresh.status).toBe(200);
    const refreshedCredentials = refresh.body.data as NativeAuthResponse;
    expect(refreshedCredentials.refreshToken).not.toBe(
      loginCredentials.refreshToken,
    );

    const oldAccessRequest = await request(app)
      .get('/api/emociones')
      .set('Authorization', `Bearer ${loginCredentials.accessToken}`);
    expect(oldAccessRequest.status).toBe(401);
    const reusedRefresh = await request(app)
      .post('/api/auth/refresh')
      .set(nativeHeaders)
      .send({ refreshToken: loginCredentials.refreshToken });
    expect(reusedRefresh.status).toBe(401);

    const ownHeaders = {
      Authorization: `Bearer ${refreshedCredentials.accessToken}`,
    };
    const otherHeaders = {
      Authorization: `Bearer ${secondRegistered.accessToken}`,
    };
    const profileUpdate = await request(app)
      .patch('/api/auth/me')
      .set(ownHeaders)
      .send({
        name: 'Integration Actualizado',
        surname: 'Cuenta',
        email: firstEmail,
      });
    expect(profileUpdate.status).toBe(200);
    expect(profileUpdate.body.data).toMatchObject({
      name: 'Integration Actualizado',
      surname: 'Cuenta',
      email: firstEmail,
    });
    const duplicateProfileEmail = await request(app)
      .patch('/api/auth/me')
      .set(ownHeaders)
      .send({
        name: 'Integration Actualizado',
        email: secondEmail,
      });
    expect(duplicateProfileEmail.status).toBe(409);
    expect(duplicateProfileEmail.body.error.code).toBe(
      'EMAIL_ALREADY_REGISTERED',
    );

    const createEmotion = await request(app)
      .post('/api/emociones')
      .set(ownHeaders)
      .send({
        moodId: 'bien',
        emotionIds: ['calma'],
        note: 'Prueba',
        otherEmotion: '',
        userId: secondRegistered.user.id,
      });
    expect(createEmotion.status).toBe(201);
    expect(createEmotion.body.data).toMatchObject({
      moodId: 'bien',
      emotionIds: ['calma'],
      note: 'Prueba',
      otherEmotion: '',
    });
    expect(createEmotion.body.data.dateTimestamp).toEqual(expect.any(Number));
    const recordId: string = createEmotion.body.data.id;
    const persistedRecord = await prisma.emotionalRecord.findUniqueOrThrow({
      where: { id: recordId },
      select: { userId: true },
    });
    expect(persistedRecord.userId).toBe(firstRegistered.user.id);

    const ownHistory = await request(app)
      .get('/api/emociones?page=1&pageSize=10')
      .set(ownHeaders);
    expect(ownHistory.status).toBe(200);
    expect(ownHistory.body.data.pagination.total).toBe(1);
    const otherHistory = await request(app)
      .get('/api/emociones')
      .set(otherHeaders);
    expect(otherHistory.body.data.pagination.total).toBe(0);
    expect(
      (
        await request(app)
          .get(`/api/emociones/${recordId}`)
          .set(otherHeaders)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`/api/emociones/${recordId}`)
          .set(otherHeaders)
          .send({
            moodId: 'mal',
            emotionIds: ['miedo'],
            note: '',
            otherEmotion: '',
          })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete(`/api/emociones/${recordId}`)
          .set(otherHeaders)
      ).status,
    ).toBe(404);
    const invalidEmotion = await request(app)
      .post('/api/emociones')
      .set(ownHeaders)
      .send({ moodId: 'bien', emotionIds: [], note: '', otherEmotion: '' });
    expect(invalidEmotion.status).toBe(400);
    expect(invalidEmotion.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Revisa los datos ingresados.',
    });
    expect(invalidEmotion.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'emotionIds' })]),
    );

    const planSave = await request(app)
      .put('/api/plan-seguridad')
      .set(ownHeaders)
      .send({
        warningSigns: ['Señal de prueba'],
        copingActions: ['Acción de prueba'],
        safePlaces: ['Lugar de prueba'],
      });
    expect(planSave.status).toBe(200);
    expect(planSave.body.data.warningSigns).toEqual(['Señal de prueba']);
    expect(planSave.body.data.updatedAt).toEqual(expect.any(String));
    const ownPlan = await request(app)
      .get('/api/plan-seguridad')
      .set(ownHeaders);
    expect(ownPlan.status).toBe(200);
    expect(ownPlan.body.data).toMatchObject({
      warningSigns: ['Señal de prueba'],
      copingActions: ['Acción de prueba'],
      safePlaces: ['Lugar de prueba'],
    });
    const otherPlan = await request(app)
      .get('/api/plan-seguridad')
      .set(otherHeaders);
    expect(otherPlan.body.data.warningSigns).toEqual([]);

    const contact = await request(app)
      .post('/api/contactos')
      .set(ownHeaders)
      .send({
        name: 'Contacto de prueba',
        phone: '+56912345678',
        relationship: 'Amistad',
        details: null,
      });
    expect(contact.status).toBe(201);
    expect(contact.body.data).toMatchObject({
      name: 'Contacto de prueba',
      phone: '+56912345678',
      relationship: 'Amistad',
      details: null,
    });
    const contactId: string = contact.body.data.id;
    const updatedContact = await request(app)
      .put(`/api/contactos/${contactId}`)
      .set(ownHeaders)
      .send({
        name: 'Contacto actualizado',
        phone: '+56987654321',
        relationship: 'Familia',
        details: 'Llamar en la tarde',
      });
    expect(updatedContact.status).toBe(204);
    const ownContacts = await request(app)
      .get('/api/contactos?page=1&pageSize=10')
      .set(ownHeaders);
    expect(ownContacts.body.data.pagination.total).toBe(1);
    expect(ownContacts.body.data.items[0]).toMatchObject({
      id: contactId,
      name: 'Contacto actualizado',
      phone: '+56987654321',
      relationship: 'Familia',
      details: 'Llamar en la tarde',
    });
    const otherContacts = await request(app)
      .get('/api/contactos')
      .set(otherHeaders);
    expect(otherContacts.body.data.pagination.total).toBe(0);
    expect(
      (
        await request(app)
          .put(`/api/contactos/${contactId}`)
          .set(otherHeaders)
          .send({ name: 'Alterado', phone: '+56900000000' })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete(`/api/contactos/${contactId}`)
          .set(otherHeaders)
      ).status,
    ).toBe(404);

    const ownExport = await request(app)
      .get('/api/privacy/export')
      .set(ownHeaders);
    expect(ownExport.status).toBe(200);
    expect(ownExport.headers['cache-control']).toBe('private, no-store');
    expect(ownExport.body.data.profile.id).toBe(firstRegistered.user.id);
    expect(ownExport.body.data.emotionalRecords).toMatchObject([
      { note: 'Prueba' },
    ]);
    expect(ownExport.body.data.safetyPlan.items).toHaveLength(3);
    expect(ownExport.body.data.trustedContacts).toMatchObject([
      { id: contactId, name: 'Contacto actualizado' },
    ]);
    const exportedJson = JSON.stringify(ownExport.body);
    expect(exportedJson).not.toContain('passwordHash');
    expect(exportedJson).not.toContain('accessTokenHash');
    expect(exportedJson).not.toContain(refreshedCredentials.refreshToken);

    const otherExport = await request(app)
      .get('/api/privacy/export')
      .set(otherHeaders);
    expect(otherExport.status).toBe(200);
    expect(otherExport.body.data.profile.id).toBe(secondRegistered.user.id);
    expect(otherExport.body.data.emotionalRecords).toEqual([]);
    expect(otherExport.body.data.trustedContacts).toEqual([]);

    const unconfirmedDeletion = await request(app)
      .delete('/api/privacy/account')
      .set(otherHeaders)
      .send({ confirmation: 'no' });
    expect(unconfirmedDeletion.status).toBe(400);
    expect(
      await prisma.user.findUnique({ where: { id: secondRegistered.user.id } }),
    ).not.toBeNull();

    const deletedOtherAccount = await request(app)
      .delete('/api/privacy/account')
      .set(otherHeaders)
      .send({ confirmation: 'ELIMINAR MI CUENTA' });
    expect(deletedOtherAccount.status).toBe(204);
    expect(
      await prisma.user.findUnique({ where: { id: secondRegistered.user.id } }),
    ).toBeNull();
    expect(
      (
        await request(app)
          .get('/api/auth/me')
          .set(otherHeaders)
      ).status,
    ).toBe(401);
    expect(
      await prisma.user.findUnique({ where: { id: firstRegistered.user.id } }),
    ).not.toBeNull();

    const deletedContact = await request(app)
      .delete(`/api/contactos/${contactId}`)
      .set(ownHeaders);
    expect(deletedContact.status).toBe(204);
    const contactsAfterDelete = await request(app)
      .get('/api/contactos?page=1&pageSize=10')
      .set(ownHeaders);
    expect(contactsAfterDelete.body.data.pagination.total).toBe(0);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set(ownHeaders);
    expect(logout.status).toBe(204);
    const afterLogout = await request(app)
      .get('/api/emociones')
      .set(ownHeaders);
    expect(afterLogout.status).toBe(401);

    const restoredLogin = await request(app)
      .post('/api/auth/login')
      .set(nativeHeaders)
      .send({ email: firstEmail, password });
    expect(restoredLogin.status).toBe(200);
    const restoredCredentials = restoredLogin.body.data as NativeAuthResponse;
    const restoredHistory = await request(app)
      .get('/api/emociones?page=1&pageSize=10')
      .set('Authorization', `Bearer ${restoredCredentials.accessToken}`);
    expect(restoredHistory.status).toBe(200);
    expect(restoredHistory.body.data.items.map((item: { id: string }) => item.id))
      .toEqual([recordId]);
  });
});
