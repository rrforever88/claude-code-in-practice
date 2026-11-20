import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-symptoms-';
let token: string;
let token2: string;
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function registerUser(email: string) {
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    displayName: 'Symptom Tester',
  });
  return { token: res.body.accessToken, userId: res.body.user.id };
}

beforeAll(async () => {
  const u1 = await registerUser(uniqueEmail());
  const u2 = await registerUser(uniqueEmail());
  token = u1.token;
  token2 = u2.token;
});

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('GET /api/symptoms', () => {
  it('returns system symptoms (userId null)', async () => {
    const res = await request(app)
      .get('/api/symptoms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Seed data has system symptoms with userId null
    const systemSymptoms = res.body.filter((s: { userId: string | null }) => s.userId === null);
    expect(systemSymptoms.length).toBeGreaterThan(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/symptoms');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/symptoms', () => {
  it('creates a custom symptom', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Headache', category: 'Neurological' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Headache');
    expect(res.body.userId).toBeDefined();
  });

  it('returns 400 for missing name', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.details.name).toBeDefined();
  });
});

describe('PATCH /api/symptoms/:id', () => {
  it('updates a custom symptom', async () => {
    const createRes = await request(app)
      .post('/api/symptoms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Old Name', category: 'Test' });

    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/symptoms/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 403 when trying to edit a system symptom', async () => {
    const systemSymptom = await prisma.symptom.findFirst({ where: { userId: null } });

    const res = await request(app)
      .patch(`/api/symptoms/${systemSymptom!.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });

  it('returns 403 when editing another user\'s symptom', async () => {
    const createRes = await request(app)
      .post('/api/symptoms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'User1 Symptom', category: 'Test' });

    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/symptoms/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Stolen' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/symptoms/:id', () => {
  it('deletes a custom symptom', async () => {
    const createRes = await request(app)
      .post('/api/symptoms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete', category: 'Test' });

    const id = createRes.body.id;

    const res = await request(app)
      .delete(`/api/symptoms/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('returns 403 for system symptoms', async () => {
    const systemSymptom = await prisma.symptom.findFirst({ where: { userId: null } });

    const res = await request(app)
      .delete(`/api/symptoms/${systemSymptom!.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/symptom-logs', () => {
  it('creates a symptom log', async () => {
    const symptom = await prisma.symptom.findFirst({ where: { userId: null } });

    const res = await request(app)
      .post('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptomId: symptom!.id, severity: 7 });

    expect(res.status).toBe(201);
    expect(res.body.severity).toBe(7);
  });

  it('returns 400 for severity out of range', async () => {
    const symptom = await prisma.symptom.findFirst({ where: { userId: null } });

    const res = await request(app)
      .post('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptomId: symptom!.id, severity: 11 });

    expect(res.status).toBe(400);
    expect(res.body.details.severity).toBeDefined();
  });

  it('returns 404 for nonexistent symptomId', async () => {
    const res = await request(app)
      .post('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptomId: '00000000-0000-0000-0000-000000000000', severity: 5 });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/symptom-logs', () => {
  it('returns logs for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PATCH /api/symptom-logs/:id', () => {
  it('updates severity and notes', async () => {
    const symptom = await prisma.symptom.findFirst({ where: { userId: null } });
    const createRes = await request(app)
      .post('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptomId: symptom!.id, severity: 3 });

    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/symptom-logs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ severity: 5, notes: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.severity).toBe(5);
  });

  it('returns 403 for another user\'s log', async () => {
    const symptom = await prisma.symptom.findFirst({ where: { userId: null } });
    const createRes = await request(app)
      .post('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptomId: symptom!.id, severity: 3 });

    const res = await request(app)
      .patch(`/api/symptom-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ severity: 1 });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/symptom-logs/:id', () => {
  it('deletes own log', async () => {
    const symptom = await prisma.symptom.findFirst({ where: { userId: null } });
    const createRes = await request(app)
      .post('/api/symptom-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptomId: symptom!.id, severity: 2 });

    const res = await request(app)
      .delete(`/api/symptom-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
