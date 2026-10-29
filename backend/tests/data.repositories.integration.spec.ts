import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../src/config/prisma.js';
import { contactRepository } from '../src/repositories/contact.repository.js';
import { emotionRepository } from '../src/repositories/emotion.repository.js';
import { personalDataRepository } from '../src/repositories/personal-data.repository.js';
import { safetyPlanRepository } from '../src/repositories/safety-plan.repository.js';
import { assertIsolatedTestDatabase, cleanTestUsers } from './test-database.js';

const enabled = process.env.RUN_DB_INTEGRATION_TESTS === 'true';
const testUserIds: string[] = [];

describe.skipIf(!enabled)('PostgreSQL repositories (isolated integration database)', () => {
  beforeAll(() => {
    assertIsolatedTestDatabase();
  });

  beforeEach(async () => {
    testUserIds.length = 0;
    for (const suffix of ['a', 'b']) {
      const user = await prisma.user.create({
        data: {
          name: `Test ${suffix}`,
          email: `test-${randomUUID()}@example.invalid`,
          passwordHash: 'test-only-not-a-real-password-hash',
        },
        select: { id: true },
      });
      testUserIds.push(user.id);
    }
  });

  afterEach(async () => {
    await cleanTestUsers(testUserIds);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('scopes emotional history CRUD and pagination to the requesting user', async () => {
    const [ownerId, otherUserId] = testUserIds;
    const first = await emotionRepository.create(ownerId, {
      mood: 'GOOD',
      emotions: ['CALM'],
      note: 'Test-only note',
      otherEmotion: '',
      recordedAt: new Date(),
    });
    await emotionRepository.create(ownerId, {
      mood: 'NEUTRAL',
      emotions: ['HOPE'],
      note: '',
      otherEmotion: '',
      recordedAt: new Date(Date.now() - 1_000),
    });
    const foreign = await emotionRepository.create(otherUserId, {
      mood: 'BAD',
      emotions: ['SADNESS'],
      note: 'Other test account',
      otherEmotion: '',
      recordedAt: new Date(),
    });

    const page = await emotionRepository.list(ownerId, 1, 1);
    expect(page.total).toBe(2);
    expect(page.records).toHaveLength(1);
    const recent = await emotionRepository.list(
      ownerId,
      1,
      10,
      new Date(Date.now() - 500),
    );
    expect(recent.total).toBe(1);
    expect(await emotionRepository.findById(ownerId, foreign.id)).toBeNull();
    expect(
      await emotionRepository.update(ownerId, foreign.id, {
        mood: 'VERY_GOOD',
        emotions: ['HOPE'],
        note: '',
        otherEmotion: '',
      }),
    ).toBeNull();
    expect(await emotionRepository.delete(ownerId, foreign.id)).toBe(false);
    expect(await emotionRepository.delete(ownerId, first.id)).toBe(true);
  });

  it('returns pattern inputs only for the owner and excludes emotional notes', async () => {
    const [ownerId, otherUserId] = testUserIds;
    await emotionRepository.create(ownerId, {
      mood: 'GOOD',
      emotions: ['CALM'],
      note: 'Private note must not be queried for patterns',
      otherEmotion: '',
      recordedAt: new Date(),
    });
    await emotionRepository.create(otherUserId, {
      mood: 'BAD',
      emotions: ['ANXIETY'],
      note: 'Another account private note',
      otherEmotion: '',
      recordedAt: new Date(),
    });

    const inputs = await emotionRepository.listPatternRecords(
      ownerId,
      new Date(Date.now() - 60_000),
    );

    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      mood: 'GOOD',
      emotions: [{ emotion: 'CALM' }],
    });
    expect(inputs[0]).not.toHaveProperty('note');
    expect(inputs[0]).not.toHaveProperty('otherEmotion');
  });

  it('exports only the owner data without authentication secrets', async () => {
    const [ownerId, otherUserId] = testUserIds;
    await emotionRepository.create(ownerId, {
      mood: 'GOOD',
      emotions: ['CALM'],
      note: 'Owner export note',
      otherEmotion: '',
      recordedAt: new Date(),
    });
    await emotionRepository.create(otherUserId, {
      mood: 'BAD',
      emotions: ['ANXIETY'],
      note: 'Foreign export note',
      otherEmotion: '',
      recordedAt: new Date(),
    });
    await safetyPlanRepository.save(ownerId, {
      warningSigns: ['Private warning sign'],
      copingActions: [],
      safePlaces: [],
    });
    await contactRepository.create(ownerId, {
      name: 'Owner contact',
      phone: '+56912345678',
    });

    const exported = await personalDataRepository.exportAccount(ownerId);
    const serialized = JSON.stringify(exported);

    expect(exported?.emotions).toHaveLength(1);
    expect(exported?.emotions[0]?.note).toBe('Owner export note');
    expect(exported?.safetyPlan?.items[0]?.content).toBe('Private warning sign');
    expect(exported?.contacts).toHaveLength(1);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('Foreign export note');
    expect(serialized).not.toContain('refreshTokenHash');
  });

  it('deletes only the owner account and its restricted relations transactionally', async () => {
    const [ownerId, otherUserId] = testUserIds;
    await emotionRepository.create(ownerId, {
      mood: 'BAD',
      emotions: ['ANXIETY'],
      note: 'Delete this owner record',
      otherEmotion: '',
      recordedAt: new Date(),
    });
    await safetyPlanRepository.save(ownerId, {
      warningSigns: ['Delete this plan item'],
      copingActions: [],
      safePlaces: [],
    });
    await contactRepository.create(ownerId, {
      name: 'Delete this contact',
      phone: '+56912345678',
    });
    await prisma.session.create({
      data: {
        userId: ownerId,
        accessTokenHash: 'a'.repeat(64),
        refreshTokenHash: 'b'.repeat(64),
        client: 'NATIVE',
        accessExpiresAt: new Date(Date.now() + 60_000),
        refreshExpiresAt: new Date(Date.now() + 120_000),
      },
    });

    await personalDataRepository.deleteAccount(ownerId);

    expect(await prisma.user.findUnique({ where: { id: ownerId } })).toBeNull();
    expect(await prisma.emotionalRecord.count({ where: { userId: ownerId } })).toBe(0);
    expect(await prisma.safetyPlan.count({ where: { userId: ownerId } })).toBe(0);
    expect(await prisma.trustedContact.count({ where: { userId: ownerId } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: ownerId } })).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: otherUserId } })).not.toBeNull();
  });

  it('rolls back child deletions if the account deletion fails', async () => {
    const [ownerId] = testUserIds;
    await prisma.user.update({
      where: { id: ownerId },
      data: { email: `delete-failure-${randomUUID()}@example.invalid` },
    });
    await emotionRepository.create(ownerId, {
      mood: 'GOOD',
      emotions: ['CALM'],
      note: 'Must remain after rollback',
      otherEmotion: '',
      recordedAt: new Date(),
    });
    await safetyPlanRepository.save(ownerId, {
      warningSigns: ['Must remain after rollback'],
      copingActions: [],
      safePlaces: [],
    });
    await contactRepository.create(ownerId, {
      name: 'Must remain after rollback',
      phone: '+56912345678',
    });
    await prisma.session.create({
      data: {
        userId: ownerId,
        accessTokenHash: 'c'.repeat(64),
        refreshTokenHash: 'd'.repeat(64),
        client: 'NATIVE',
        accessExpiresAt: new Date(Date.now() + 60_000),
        refreshExpiresAt: new Date(Date.now() + 120_000),
      },
    });

    try {
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION test_contigo_account_delete_failure()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF OLD.email LIKE 'delete-failure-%@example.invalid' THEN
            RAISE EXCEPTION 'intentional integration test failure';
          END IF;
          RETURN OLD;
        END;
        $$
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER test_contigo_account_delete_failure
        BEFORE DELETE ON users
        FOR EACH ROW EXECUTE FUNCTION test_contigo_account_delete_failure()
      `);

      await expect(
        personalDataRepository.deleteAccount(ownerId),
      ).rejects.toThrow();

      expect(await prisma.user.findUnique({ where: { id: ownerId } })).not.toBeNull();
      expect(await prisma.emotionalRecord.count({ where: { userId: ownerId } })).toBe(1);
      expect(await prisma.safetyPlan.count({ where: { userId: ownerId } })).toBe(1);
      expect(await prisma.trustedContact.count({ where: { userId: ownerId } })).toBe(1);
      expect(await prisma.session.count({ where: { userId: ownerId } })).toBe(1);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS test_contigo_account_delete_failure ON users',
      );
      await prisma.$executeRawUnsafe(
        'DROP FUNCTION IF EXISTS test_contigo_account_delete_failure()',
      );
    }
  });

  it('scopes trusted-contact list, update, and delete to the requesting user', async () => {
    const [ownerId, otherUserId] = testUserIds;
    const ownContact = await contactRepository.create(ownerId, {
      name: 'Test owner contact',
      phone: '+56912345678',
    });
    const foreignContact = await contactRepository.create(otherUserId, {
      name: 'Test other contact',
      phone: '+56987654321',
    });

    const page = await contactRepository.list(ownerId, 1, 10);
    expect(page.total).toBe(1);
    expect(page.contacts.map((contact) => contact.id)).toEqual([ownContact.id]);
    expect(
      await contactRepository.update(ownerId, foreignContact.id, {
        name: 'Changed',
        phone: '+56900000000',
      }),
    ).toMatchObject({ count: 0 });
    expect(
      await contactRepository.delete(ownerId, foreignContact.id),
    ).toMatchObject({ count: 0 });
    expect(
      await contactRepository.delete(ownerId, ownContact.id),
    ).toMatchObject({ count: 1 });
  });

  it('saves plan sections atomically and preserves the previous plan on failure', async () => {
    const [ownerId, otherUserId] = testUserIds;
    const saved = await safetyPlanRepository.save(ownerId, {
      warningSigns: ['Existing warning sign'],
      copingActions: ['Existing coping action'],
      safePlaces: ['Existing safe place'],
    });
    const otherPlan = await safetyPlanRepository.getOrCreate(otherUserId);

    await expect(
      safetyPlanRepository.save(ownerId, {
        warningSigns: ['x'.repeat(501)],
        copingActions: [],
        safePlaces: [],
      }),
    ).rejects.toThrow();

    const afterFailure = await safetyPlanRepository.getOrCreate(ownerId);
    expect(afterFailure.id).toBe(saved.id);
    expect(
      afterFailure.items
        .filter((item) => item.type === 'WARNING_SIGN')
        .map((item) => item.content),
    ).toEqual(['Existing warning sign']);
    expect(otherPlan.id).not.toBe(saved.id);
  });
});
