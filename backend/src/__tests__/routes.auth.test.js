import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth.js';
import db from '../db.js';

jest.mock('../db.js', () => ({
  __esModule: true,
  default: { run: jest.fn(), get: jest.fn(), all: jest.fn() },
  parseTechStack: (raw) => { try { return JSON.parse(raw || '[]'); } catch { return []; } },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$mockedhash'),
  compare: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

beforeEach(() => jest.clearAllMocks());

// ── Register ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when username is shorter than 3 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'ab', password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/3-32/);
  });

  test('returns 400 when username exceeds 32 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a'.repeat(33), password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/3-32/);
  });

  test('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/i);
  });

  test('returns 409 when username already exists', async () => {
    db.run.mockImplementation((_sql, _params, cb) => {
      cb({ message: 'UNIQUE constraint failed: users.username' });
    });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'existing', password: 'pass123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('returns 201 with token and user on success', async () => {
    db.run.mockImplementation((_sql, _params, cb) => {
      cb.call({ lastID: 42 }, null);
    });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'pass123', profession: 'Developer' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.id).toBe(42);
    expect(res.body.user.username).toBe('newuser');
  });
});

// ── Login ─────────────────────────────────────────────────────────────��───────

describe('POST /api/auth/login', () => {
  test('returns 400 when both fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'alice' });
    expect(res.status).toBe(400);
  });

  test('returns 401 when user is not found', async () => {
    db.get.mockImplementation((_sql, _params, cb) => cb(null, null));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'pass123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('returns 401 when password is incorrect', async () => {
    const bcrypt = require('bcrypt');
    db.get.mockImplementation((_sql, _params, cb) => cb(null, {
      id: 1, username: 'alice', password_hash: '$2b$12$wrong',
      role: 'user', profession: null, years_of_experience: 0, tech_stack: '[]',
    }));
    bcrypt.compare.mockResolvedValueOnce(false);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('returns 200 with token and user on valid login', async () => {
    const bcrypt = require('bcrypt');
    db.get.mockImplementation((_sql, _params, cb) => cb(null, {
      id: 1, username: 'alice', password_hash: '$2b$12$mockedhash',
      role: 'user', profession: 'Developer', years_of_experience: 3, tech_stack: '[]',
    }));
    bcrypt.compare.mockResolvedValueOnce(true);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe('alice');
  });
});
