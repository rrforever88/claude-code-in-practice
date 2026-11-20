import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-register-';
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with user, accessToken, refreshToken', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: uniqueEmail(),
      password: 'password123',
      displayName: 'Test User',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: expect.any(String),
      displayName: 'Test User',
      timezone: 'UTC',
    });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('access token is a valid JWT containing userId and email', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      displayName: 'Token Test',
    });

    expect(res.status).toBe(201);
    const decoded = jwt.decode(res.body.accessToken) as Record<string, unknown>;
    expect(decoded.userId).toBe(res.body.user.id);
    expect(decoded.email).toBe(email);
  });

  it('returns 409 when email is already registered', async () => {
    const email = uniqueEmail();

    await request(app).post('/api/auth/register').send({
      email,
      password: 'password123',
      displayName: 'First',
    });

    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'password456',
      displayName: 'Second',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  it('returns 400 with field errors for missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      password: 'password123',
      displayName: 'No Email',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details.email).toBeDefined();
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'password123',
      displayName: 'Bad Email',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: uniqueEmail(),
      password: 'short',
      displayName: 'Short Pass',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.password).toBeDefined();
  });

  it('returns 400 when displayName is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: uniqueEmail(),
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.displayName).toBeDefined();
  });
});
