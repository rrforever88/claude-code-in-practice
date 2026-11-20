import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma, { pool } from '../lib/prisma';

const TEST_EMAIL_PREFIX = 'vitest-forgot-';
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function createUser(email: string) {
  return request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    displayName: 'Reset Test User',
  });
}

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
  await pool.end();
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 for a registered email', async () => {
    const email = uniqueEmail();
    await createUser(email);

    const res = await request(app).post('/api/auth/forgot-password').send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link');
  });

  it('returns 200 for an unregistered email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });

  it('creates a PasswordResetToken in the database', async () => {
    const email = uniqueEmail();
    const registerRes = await createUser(email);
    const userId = registerRes.body.user.id;

    await request(app).post('/api/auth/forgot-password').send({ email });

    const token = await prisma.passwordResetToken.findFirst({ where: { userId } });
    expect(token).not.toBeNull();
    expect(token!.used).toBe(false);
    expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/auth/reset-password', () => {
  it('resets the password and allows login with new password', async () => {
    const email = uniqueEmail();
    await createUser(email);

    await request(app).post('/api/auth/forgot-password').send({ email });

    const user = await prisma.user.findUnique({ where: { email } });
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: user!.id },
    });

    const res = await request(app).post('/api/auth/reset-password').send({
      token: tokenRecord!.token,
      password: 'newpassword123',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Password reset');

    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password: 'newpassword123',
    });
    expect(loginRes.status).toBe(200);
  });

  it('marks the token as used after reset', async () => {
    const email = uniqueEmail();
    await createUser(email);

    await request(app).post('/api/auth/forgot-password').send({ email });

    const user = await prisma.user.findUnique({ where: { email } });
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: user!.id },
    });

    await request(app).post('/api/auth/reset-password').send({
      token: tokenRecord!.token,
      password: 'newpassword123',
    });

    const updated = await prisma.passwordResetToken.findUnique({
      where: { id: tokenRecord!.id },
    });
    expect(updated!.used).toBe(true);
  });

  it('returns 400 for an already-used token', async () => {
    const email = uniqueEmail();
    await createUser(email);

    await request(app).post('/api/auth/forgot-password').send({ email });

    const user = await prisma.user.findUnique({ where: { email } });
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: user!.id },
    });

    await request(app).post('/api/auth/reset-password').send({
      token: tokenRecord!.token,
      password: 'newpassword123',
    });

    const res = await request(app).post('/api/auth/reset-password').send({
      token: tokenRecord!.token,
      password: 'anotherpassword',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or expired');
  });

  it('returns 400 for a nonexistent token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'doesnotexist',
      password: 'newpassword123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or expired');
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'anytoken',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.password).toBeDefined();
  });
});
