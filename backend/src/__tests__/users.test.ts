import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-users-';
let accessToken: string;
let userId: string;
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

beforeAll(async () => {
  const email = uniqueEmail();
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    displayName: 'Users Test',
  });
  accessToken = res.body.accessToken;
  userId = res.body.user.id;
});

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('GET /api/users/me', () => {
  it('returns the authenticated user', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid.token');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/users/me', () => {
  it('updates displayName', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Updated Name');
  });

  it('updates timezone with a valid IANA timezone', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ timezone: 'America/New_York' });

    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('America/New_York');
  });

  it('returns 400 for an invalid timezone', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ timezone: 'Not/ATimezone' });

    expect(res.status).toBe(400);
    expect(res.body.details.timezone).toBeDefined();
  });

  it('returns 400 when no fields are provided', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).patch('/api/users/me').send({ displayName: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/users/me', () => {
  it('deletes the account and returns 204', async () => {
    const email = uniqueEmail();
    const registerRes = await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      displayName: 'To Delete',
    });
    const token = registerRes.body.accessToken;

    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeNull();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(res.status).toBe(401);
  });
});
