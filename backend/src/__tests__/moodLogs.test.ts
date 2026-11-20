import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-mood-';
let token: string;
let token2: string;
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

beforeAll(async () => {
  for (const email of [uniqueEmail(), uniqueEmail()]) {
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      displayName: 'Mood Tester',
    });
    if (!token) token = res.body.accessToken;
    else token2 = res.body.accessToken;
  }
});

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('POST /api/mood-logs', () => {
  it('creates a mood log with required fields', async () => {
    const res = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 4 });

    expect(res.status).toBe(201);
    expect(res.body.moodScore).toBe(4);
    expect(res.body.energyLevel).toBeNull();
  });

  it('creates a mood log with all optional fields', async () => {
    const res = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 3, energyLevel: 2, stressLevel: 5, notes: 'Rough day' });

    expect(res.status).toBe(201);
    expect(res.body.energyLevel).toBe(2);
    expect(res.body.stressLevel).toBe(5);
  });

  it('returns 400 for moodScore out of range', async () => {
    const res = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 6 });

    expect(res.status).toBe(400);
    expect(res.body.details.moodScore).toBeDefined();
  });

  it('returns 400 for missing moodScore', async () => {
    const res = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.details.moodScore).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/mood-logs').send({ moodScore: 3 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/mood-logs', () => {
  it('returns logs for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/mood-logs');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/mood-logs/:id', () => {
  it('updates a mood log', async () => {
    const createRes = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 2 });

    const res = await request(app)
      .patch(`/api/mood-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 5, notes: 'Better now' });

    expect(res.status).toBe(200);
    expect(res.body.moodScore).toBe(5);
  });

  it('returns 403 for another user\'s log', async () => {
    const createRes = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 2 });

    const res = await request(app)
      .patch(`/api/mood-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ moodScore: 1 });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/mood-logs/:id', () => {
  it('deletes own log', async () => {
    const createRes = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 1 });

    const res = await request(app)
      .delete(`/api/mood-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('returns 403 for another user\'s log', async () => {
    const createRes = await request(app)
      .post('/api/mood-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ moodScore: 1 });

    const res = await request(app)
      .delete(`/api/mood-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(403);
  });
});
