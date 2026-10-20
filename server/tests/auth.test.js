import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { config } from '../src/config/env.js';
import { resetDb, prisma } from './helpers/db.js';
import { alice, registeredAgent } from './helpers/auth.js';

// Returns the "token=..." Set-Cookie header, if the response has one.
function tokenCookie(res) {
  return (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('token='));
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  it('creates the user, sets an httpOnly cookie and hides the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, email: '  Alice@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'alice@example.com', name: 'Alice' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(tokenCookie(res)).toMatch(/HttpOnly/);

    const saved = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    expect(saved.passwordHash).not.toBe(alice.password);
    expect(saved.passwordHash).toMatch(/^\$2b\$/);
  });

  it('returns 409 for an email that is already registered', async () => {
    await request(app).post('/api/auth/register').send(alice).expect(201);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, email: 'ALICE@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Email is already registered');
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('email');
    expect(res.body.error.details.fieldErrors).toHaveProperty('password');
    expect(res.body.error.details.fieldErrors).toHaveProperty('name');
    expect(tokenCookie(res)).toBeUndefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => request(app).post('/api/auth/register').send(alice));

  it('logs in with the right password and sets the cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ALICE@example.com', password: alice.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(alice.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(tokenCookie(res)).toMatch(/HttpOnly/);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: alice.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(tokenCookie(wrongPassword)).toBeUndefined();
  });
});

describe('GET /api/auth/me (requireAuth)', () => {
  it('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Not authenticated');
  });

  it('returns the logged-in user', async () => {
    const agent = await registeredAgent();

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: alice.email, name: alice.name });
  });

  it('rejects a token signed with a different secret', async () => {
    const user = await prisma.user.create({
      data: { email: alice.email, name: alice.name, passwordHash: 'x' },
    });
    const forged = jwt.sign({ sub: user.id }, 'not-the-real-secret');

    const res = await request(app).get('/api/auth/me').set('Cookie', `token=${forged}`);

    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const user = await prisma.user.create({
      data: { email: alice.email, name: alice.name, passwordHash: 'x' },
    });
    const tenSecondsAgo = Math.floor(Date.now() / 1000) - 10;
    const expired = jwt.sign({ sub: user.id, exp: tenSecondsAgo }, config.jwtSecret);

    const res = await request(app).get('/api/auth/me').set('Cookie', `token=${expired}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 when the user no longer exists', async () => {
    const agent = await registeredAgent();
    await resetDb();

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie, so /me returns 401 afterwards', async () => {
    const agent = await registeredAgent();

    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(204);
    expect(tokenCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
    await agent.get('/api/auth/me').expect(401);
  });
});
