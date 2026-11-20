import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-login-';
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function createUser(email: string, password = 'password123') {
  return request(app).post('/api/auth/register').send({
    email,
    password,
    displayName: 'Login Test User',
  });
}

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('POST /api/auth/login', () => {
  it('returns 200 with user, accessToken, refreshToken on valid credentials', async () => {
    const email = uniqueEmail();
    await createUser(email);

    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('access token contains correct userId and email', async () => {
    const email = uniqueEmail();
    const registerRes = await createUser(email);
    const userId = registerRes.body.user.id;

    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'password123',
    });

    const decoded = jwt.decode(res.body.accessToken) as Record<string, unknown>;
    expect(decoded.userId).toBe(userId);
    expect(decoded.email).toBe(email);
  });

  it('returns 401 for wrong password', async () => {
    const email = uniqueEmail();
    await createUser(email);

    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for unregistered email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns a new accessToken given a valid refreshToken', async () => {
    const email = uniqueEmail();
    const loginRes = await createUser(email);
    const refreshToken = loginRes.body.refreshToken;

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    // Decode both to compare payload userId — the tokens must be for the same user
    const decoded = jwt.decode(res.body.accessToken) as Record<string, unknown>;
    expect(decoded.userId).toBe(loginRes.body.user.id);
  });

  it('returns 401 for an invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: 'invalid.token.value',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(400);
    expect(res.body.details.refreshToken).toBeDefined();
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 204', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(204);
  });
});
