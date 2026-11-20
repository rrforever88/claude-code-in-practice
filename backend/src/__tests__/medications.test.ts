import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-meds-';
let token: string;
let token2: string;
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function createMedication(tok: string, name = 'Test Med') {
  return request(app)
    .post('/api/medications')
    .set('Authorization', `Bearer ${tok}`)
    .send({ name, dosage: '10mg', frequency: 'daily' });
}

beforeAll(async () => {
  for (const email of [uniqueEmail(), uniqueEmail()]) {
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      displayName: 'Med Tester',
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

describe('POST /api/medications', () => {
  it('creates a medication', async () => {
    const res = await createMedication(token);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Med');
    expect(res.body.dosage).toBe('10mg');
  });

  it('returns 400 for missing name', async () => {
    const res = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.details.name).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/medications').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/medications', () => {
  it('returns only the authenticated user\'s medications', async () => {
    const res = await request(app)
      .get('/api/medications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PATCH /api/medications/:id', () => {
  it('updates a medication', async () => {
    const createRes = await createMedication(token, 'Old Name');
    const res = await request(app)
      .patch(`/api/medications/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.isActive).toBe(false);
  });

  it('returns 403 for another user\'s medication', async () => {
    const createRes = await createMedication(token);
    const res = await request(app)
      .patch(`/api/medications/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Stolen' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/medications/:id', () => {
  it('deletes own medication', async () => {
    const createRes = await createMedication(token, 'To Delete');
    const res = await request(app)
      .delete(`/api/medications/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 403 for another user\'s medication', async () => {
    const createRes = await createMedication(token);
    const res = await request(app)
      .delete(`/api/medications/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/medication-logs', () => {
  it('creates a medication log', async () => {
    const medRes = await createMedication(token);
    const res = await request(app)
      .post('/api/medication-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicationId: medRes.body.id, taken: true });
    expect(res.status).toBe(201);
    expect(res.body.taken).toBe(true);
  });

  it('returns 400 for missing taken field', async () => {
    const medRes = await createMedication(token);
    const res = await request(app)
      .post('/api/medication-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicationId: medRes.body.id });
    expect(res.status).toBe(400);
    expect(res.body.details.taken).toBeDefined();
  });

  it('returns 403 when logging another user\'s medication', async () => {
    const medRes = await createMedication(token);
    const res = await request(app)
      .post('/api/medication-logs')
      .set('Authorization', `Bearer ${token2}`)
      .send({ medicationId: medRes.body.id, taken: true });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/medication-logs', () => {
  it('returns logs for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/medication-logs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PATCH /api/medication-logs/:id', () => {
  it('updates a log', async () => {
    const medRes = await createMedication(token);
    const logRes = await request(app)
      .post('/api/medication-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicationId: medRes.body.id, taken: false });

    const res = await request(app)
      .patch(`/api/medication-logs/${logRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ taken: true, notes: 'Taken late' });
    expect(res.status).toBe(200);
    expect(res.body.taken).toBe(true);
  });
});

describe('DELETE /api/medication-logs/:id', () => {
  it('deletes own log', async () => {
    const medRes = await createMedication(token);
    const logRes = await request(app)
      .post('/api/medication-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicationId: medRes.body.id, taken: true });

    const res = await request(app)
      .delete(`/api/medication-logs/${logRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
