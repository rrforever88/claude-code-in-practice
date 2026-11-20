import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-habits-';
let token: string;
let token2: string;
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function createHabit(tok: string, name = 'Test Habit', trackingType = 'BOOLEAN') {
  return request(app)
    .post('/api/habits')
    .set('Authorization', `Bearer ${tok}`)
    .send({ name, trackingType });
}

beforeAll(async () => {
  for (const email of [uniqueEmail(), uniqueEmail()]) {
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      displayName: 'Habit Tester',
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

describe('GET /api/habits', () => {
  it('returns system habits (userId null)', async () => {
    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const system = res.body.filter((h: { userId: string | null }) => h.userId === null);
    expect(system.length).toBeGreaterThan(0);
  });
});

describe('POST /api/habits', () => {
  it('creates a BOOLEAN habit', async () => {
    const res = await createHabit(token, 'Morning Walk', 'BOOLEAN');
    expect(res.status).toBe(201);
    expect(res.body.trackingType).toBe('BOOLEAN');
  });

  it('creates a NUMERIC habit with unit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Water Intake', trackingType: 'NUMERIC', unit: 'glasses' });
    expect(res.status).toBe(201);
    expect(res.body.unit).toBe('glasses');
  });

  it('returns 400 for invalid trackingType', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', trackingType: 'INVALID' });
    expect(res.status).toBe(400);
    expect(res.body.details.trackingType).toBeDefined();
  });
});

describe('PATCH /api/habits/:id', () => {
  it('updates a custom habit', async () => {
    const createRes = await createHabit(token, 'Old Name');
    const res = await request(app)
      .patch(`/api/habits/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 403 for system habits', async () => {
    const systemHabit = await prisma.habit.findFirst({ where: { userId: null } });
    const res = await request(app)
      .patch(`/api/habits/${systemHabit!.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/habits/:id', () => {
  it('deletes a custom habit', async () => {
    const createRes = await createHabit(token, 'To Delete');
    const res = await request(app)
      .delete(`/api/habits/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 403 for system habits', async () => {
    const systemHabit = await prisma.habit.findFirst({ where: { userId: null } });
    const res = await request(app)
      .delete(`/api/habits/${systemHabit!.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/habit-logs', () => {
  it('creates a BOOLEAN habit log', async () => {
    const habitRes = await createHabit(token, 'Walk', 'BOOLEAN');
    const res = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueBoolean: true });
    expect(res.status).toBe(201);
    expect(res.body.valueBoolean).toBe(true);
  });

  it('creates a NUMERIC habit log', async () => {
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Steps', trackingType: 'NUMERIC' });
    const res = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueNumeric: 8000 });
    expect(res.status).toBe(201);
    expect(res.body.valueNumeric).toBe(8000);
  });

  it('creates a DURATION habit log', async () => {
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sleep', trackingType: 'DURATION' });
    const res = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueDuration: 480 });
    expect(res.status).toBe(201);
    expect(res.body.valueDuration).toBe(480);
  });

  it('returns 400 when wrong value type is provided for BOOLEAN habit', async () => {
    const habitRes = await createHabit(token, 'Walk2', 'BOOLEAN');
    const res = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueNumeric: 5 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent habitId', async () => {
    const res = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: '00000000-0000-0000-0000-000000000000', valueBoolean: true });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/habit-logs', () => {
  it('returns logs for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PATCH /api/habit-logs/:id', () => {
  it('updates a habit log', async () => {
    const habitRes = await createHabit(token, 'PatchWalk', 'BOOLEAN');
    const logRes = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueBoolean: false });

    const res = await request(app)
      .patch(`/api/habit-logs/${logRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ valueBoolean: true, notes: 'Did it!' });
    expect(res.status).toBe(200);
    expect(res.body.valueBoolean).toBe(true);
  });

  it('returns 403 for another user\'s log', async () => {
    const habitRes = await createHabit(token, 'OtherWalk', 'BOOLEAN');
    const logRes = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueBoolean: true });

    const res = await request(app)
      .patch(`/api/habit-logs/${logRes.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ valueBoolean: false });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/habit-logs/:id', () => {
  it('deletes own log', async () => {
    const habitRes = await createHabit(token, 'DeleteWalk', 'BOOLEAN');
    const logRes = await request(app)
      .post('/api/habit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId: habitRes.body.id, valueBoolean: true });

    const res = await request(app)
      .delete(`/api/habit-logs/${logRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
