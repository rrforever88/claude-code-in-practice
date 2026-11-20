import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-stats-';
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function registerUser(email: string) {
  return request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    displayName: 'Stats Test User',
  });
}

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('GET /api/users/stats', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/stats');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', 'Bearer bad.token.here');
    expect(res.status).toBe(401);
  });

  it('returns 200 with the correct shape for a new user with no logs', async () => {
    const email = uniqueEmail();
    const registerRes = await registerUser(email);
    const { accessToken } = registerRes.body;

    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.avgMoodScoreLast30Days).toBeNull();
    expect(Array.isArray(res.body.topSymptoms)).toBe(true);
    expect(res.body.topSymptoms).toHaveLength(0);
    expect(res.body.currentStreak).toBe(0);
    expect(res.body.totalLogsByType).toEqual({
      symptomLogs: 0,
      moodLogs: 0,
      medicationLogs: 0,
      habitLogs: 0,
    });
  });

  describe('with seed data', () => {
    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      const email = uniqueEmail();
      const registerRes = await registerUser(email);
      accessToken = registerRes.body.accessToken;
      userId = registerRes.body.user.id;

      // Find the default Headache symptom (userId = null)
      const headache = await prisma.symptom.findFirst({
        where: { name: 'Headache', userId: null },
      });
      const fatigue = await prisma.symptom.findFirst({
        where: { name: 'Fatigue', userId: null },
      });

      const now = new Date();
      const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

      // 7 consecutive mood logs (today going back 6 days) with scores 3–5
      await prisma.moodLog.createMany({
        data: Array.from({ length: 7 }, (_, i) => ({
          userId,
          moodScore: 3 + (i % 3),
          loggedAt: daysAgo(i),
        })),
      });

      if (headache) {
        // Headache logged 5 times, fatigue 3 times — headache should be top
        await prisma.symptomLog.createMany({
          data: [
            ...Array.from({ length: 5 }, (_, i) => ({
              userId,
              symptomId: headache.id,
              severity: 4,
              loggedAt: daysAgo(i),
            })),
            ...(fatigue
              ? Array.from({ length: 3 }, (_, i) => ({
                  userId,
                  symptomId: fatigue.id,
                  severity: 3,
                  loggedAt: daysAgo(i),
                }))
              : []),
          ],
        });
      }
    });

    it('returns correct average mood score', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      // Scores are 3,4,5,3,4,5,3 — avg = 27/7 ≈ 3.857
      expect(res.body.avgMoodScoreLast30Days).toBeCloseTo(3.857, 1);
    });

    it('returns top symptoms ordered by frequency', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.topSymptoms.length).toBeGreaterThan(0);
      expect(res.body.topSymptoms[0].name).toBe('Headache');
      expect(res.body.topSymptoms[0].count).toBe(5);
    });

    it('returns correct logging streak', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      // 7 consecutive days (today + 6 days back)
      expect(res.body.currentStreak).toBe(7);
    });

    it('returns correct total logs by type', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalLogsByType.moodLogs).toBe(7);
      // 5 headache + 3 fatigue = 8 (if default symptoms exist), or 5 if only headache seeded
      expect(res.body.totalLogsByType.symptomLogs).toBeGreaterThanOrEqual(5);
      expect(res.body.totalLogsByType.medicationLogs).toBe(0);
      expect(res.body.totalLogsByType.habitLogs).toBe(0);
    });

    it('top symptoms include name and symptomId fields', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      for (const symptom of res.body.topSymptoms) {
        expect(symptom).toHaveProperty('symptomId');
        expect(symptom).toHaveProperty('name');
        expect(symptom).toHaveProperty('count');
      }
    });
  });
});
