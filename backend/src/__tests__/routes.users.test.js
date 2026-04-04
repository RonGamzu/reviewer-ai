import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import usersRouter from '../routes/users.js';
import db from '../db.js';
import fetch from 'node-fetch';

jest.mock('../db.js', () => ({
  __esModule: true,
  default: { run: jest.fn(), get: jest.fn(), all: jest.fn() },
  parseTechStack: (raw) => { try { return JSON.parse(raw || '[]'); } catch { return []; } },
}));

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }));

const SECRET = 'reviewer_ai_fallback_secret';
const userToken = (id = 1) =>
  jwt.sign({ id, username: `user${id}`, role: 'user' }, SECRET);
const adminToken = () =>
  jwt.sign({ id: 99, username: 'admin', role: 'admin' }, SECRET);

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

beforeEach(() => jest.clearAllMocks());

// ── PUT /api/users/:userId ────────────────────────────────────────────────────

describe('PUT /api/users/:userId', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).put('/api/users/1').send({ profession: 'Dev' });
    expect(res.status).toBe(401);
  });

  test('returns 403 when updating another user\'s profile', async () => {
    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${userToken(1)}`)
      .send({ profession: 'Dev' });
    expect(res.status).toBe(403);
  });

  test('returns 400 when no fields are provided', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${userToken(1)}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no fields/i);
  });

  test('returns 200 with updated profile on success', async () => {
    db.run.mockImplementationOnce((_sql, _params, cb) =>
      cb.call({ changes: 1 }, null)
    );
    db.get.mockImplementationOnce((_sql, _params, cb) =>
      cb(null, { id: 1, username: 'user1', profession: 'Engineer', years_of_experience: 4, tech_stack: '[]', role: 'user' })
    );
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${userToken(1)}`)
      .send({ profession: 'Engineer' });
    expect(res.status).toBe(200);
    expect(res.body.profession).toBe('Engineer');
  });

  test('admin can update any user\'s profile', async () => {
    db.run.mockImplementationOnce((_sql, _params, cb) =>
      cb.call({ changes: 1 }, null)
    );
    db.get.mockImplementationOnce((_sql, _params, cb) =>
      cb(null, { id: 5, username: 'user5', profession: 'QA', years_of_experience: 2, tech_stack: '[]', role: 'user' })
    );
    const res = await request(app)
      .put('/api/users/5')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ profession: 'QA' });
    expect(res.status).toBe(200);
  });
});

// ── GET /api/users/:userId ────────────────────────────────────────────────────

describe('GET /api/users/:userId', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(401);
  });

  test('returns 403 when accessing another user\'s profile', async () => {
    const res = await request(app)
      .get('/api/users/2')
      .set('Authorization', `Bearer ${userToken(1)}`);
    expect(res.status).toBe(403);
  });

  test('returns 200 with profile for own user', async () => {
    db.get.mockImplementationOnce((_sql, _params, cb) =>
      cb(null, { id: 1, username: 'user1', profession: 'Dev', years_of_experience: 2, tech_stack: '[]', role: 'user', created_at: '2026-01-01' })
    );
    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${userToken(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('user1');
  });

  test('returns 404 when user does not exist', async () => {
    db.get.mockImplementationOnce((_sql, _params, cb) => cb(null, null));
    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${userToken(1)}`);
    expect(res.status).toBe(404);
  });
});

// ── POST /api/users/:userId/analyze ──────────────────────────────────────────

describe('POST /api/users/:userId/analyze', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/users/1/analyze').send({ interviews: [] });
    expect(res.status).toBe(401);
  });

  test('returns 400 when interviews array is empty', async () => {
    const res = await request(app)
      .post('/api/users/1/analyze')
      .set('Authorization', `Bearer ${userToken(1)}`)
      .send({ interviews: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when interviews is not an array', async () => {
    const res = await request(app)
      .post('/api/users/1/analyze')
      .set('Authorization', `Bearer ${userToken(1)}`)
      .send({ interviews: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  test('returns 403 when analyzing another user\'s history', async () => {
    const res = await request(app)
      .post('/api/users/2/analyze')
      .set('Authorization', `Bearer ${userToken(1)}`)
      .send({ interviews: [{ ai_score: 80 }] });
    expect(res.status).toBe(403);
  });
});
