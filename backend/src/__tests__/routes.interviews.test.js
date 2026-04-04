import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import interviewsRouter from '../routes/interviews.js';
import db from '../db.js';
import fetch from 'node-fetch';

jest.mock('../db.js', () => ({
  __esModule: true,
  default: { run: jest.fn(), get: jest.fn(), all: jest.fn() },
  parseTechStack: () => [],
}));

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }));

const SECRET = 'reviewer_ai_fallback_secret';
const userToken = (id = 1) =>
  jwt.sign({ id, username: `user${id}`, role: 'user' }, SECRET);
const adminToken = () =>
  jwt.sign({ id: 99, username: 'admin', role: 'admin' }, SECRET);

const app = express();
app.use(express.json());
app.use('/api/interviews', interviewsRouter);

beforeEach(() => jest.clearAllMocks());

// ── POST /api/interviews ──────────────────────────────────────────────────────

describe('POST /api/interviews', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/interviews').send({});
    expect(res.status).toBe(401);
  });

  test('returns 400 when question_id is missing', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ user_answer: 'My answer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when user_answer is missing', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ question_id: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 404 when question does not exist', async () => {
    db.get
      .mockImplementationOnce((_sql, _params, cb) => cb(null, null)); // question not found
    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ question_id: 999, user_answer: 'My answer' });
    expect(res.status).toBe(404);
  });

  test('saves interview and returns 201 even if AI service is unreachable', async () => {
    // question found
    db.get.mockImplementationOnce((_sql, _params, cb) =>
      cb(null, { id: 1, title: 'Test Q', difficulty: 'Mid', curator_tip: 'tip' })
    );
    // user found
    db.get.mockImplementationOnce((_sql, _params, cb) =>
      cb(null, { years_of_experience: 2 })
    );
    // AI service unreachable
    fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    // DB insert
    db.run.mockImplementationOnce((_sql, _params, cb) => {
      cb.call({ lastID: 10 }, null);
    });

    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ question_id: 1, user_answer: 'My answer' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
    expect(res.body.ai_score).toBeNull(); // graceful degradation
  });
});

// ── GET /api/interviews/user/:userId ─────────────────────────────────────────

describe('GET /api/interviews/user/:userId', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/interviews/user/1');
    expect(res.status).toBe(401);
  });

  test('returns 403 when user requests another user\'s interviews', async () => {
    const res = await request(app)
      .get('/api/interviews/user/2')
      .set('Authorization', `Bearer ${userToken(1)}`);
    expect(res.status).toBe(403);
  });

  test('returns 200 with own interview history', async () => {
    db.all.mockImplementation((_sql, _params, cb) => cb(null, [
      { id: 1, question_title: 'Q1', category: 'JS', difficulty: 'Mid', ai_score: 80 },
    ]));
    const res = await request(app)
      .get('/api/interviews/user/1')
      .set('Authorization', `Bearer ${userToken(1)}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('admin can access any user\'s interviews', async () => {
    db.all.mockImplementation((_sql, _params, cb) => cb(null, []));
    const res = await request(app)
      .get('/api/interviews/user/5')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
  });
});
