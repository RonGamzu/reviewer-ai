// Endpoint tests run with GEMINI_API_KEY unset (empty string, the default),
// so all routes take the deterministic fallback path — no real Gemini calls.
import request from 'supertest';
import app from '../index.js';

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  test('returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('reviewer-ai-service');
  });

  test('reports gemini_configured as false when key is absent', async () => {
    const res = await request(app).get('/health');
    expect(res.body.gemini_configured).toBe(false);
  });
});

// ── POST /ai/generate-question ────────────────────────────────────────────────

describe('POST /ai/generate-question', () => {
  test('returns 400 when tech_stack is missing', async () => {
    const res = await request(app).post('/ai/generate-question').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tech_stack/i);
  });

  test('returns 400 when tech_stack is an empty array', async () => {
    const res = await request(app)
      .post('/ai/generate-question')
      .send({ tech_stack: [] });
    expect(res.status).toBe(400);
  });

  test('fallback: returns a question object based on first stack entry', async () => {
    const res = await request(app)
      .post('/ai/generate-question')
      .send({ tech_stack: [{ name: 'React', level: 'intermediate' }], years_of_experience: 2 });
    expect(res.status).toBe(200);
    expect(res.body.title).toBeTruthy();
    expect(res.body.category).toBe('React');
    expect(res.body.difficulty).toBeTruthy();
    expect(res.body.curator_tip).toBeTruthy();
  });

  test('fallback: beginner level maps to Junior difficulty', async () => {
    const res = await request(app)
      .post('/ai/generate-question')
      .send({ tech_stack: [{ name: 'Python', level: 'beginner' }], years_of_experience: 0 });
    expect(res.status).toBe(200);
    expect(res.body.difficulty).toBe('Junior');
  });

  test('fallback: advanced level maps to Senior difficulty', async () => {
    const res = await request(app)
      .post('/ai/generate-question')
      .send({ tech_stack: [{ name: 'Go', level: 'advanced' }], years_of_experience: 6 });
    expect(res.status).toBe(200);
    expect(res.body.difficulty).toBe('Senior');
  });
});

// ── POST /ai/evaluate ─────────────────────────────────────────────────────────

describe('POST /ai/evaluate', () => {
  test('returns 400 when question_title is missing', async () => {
    const res = await request(app)
      .post('/ai/evaluate')
      .send({ user_answer: 'My answer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when user_answer is missing', async () => {
    const res = await request(app)
      .post('/ai/evaluate')
      .send({ question_title: 'What is React?' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('fallback: returns score 72 with feedback', async () => {
    const res = await request(app)
      .post('/ai/evaluate')
      .send({ question_title: 'What is React?', user_answer: 'A UI library.' });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(72);
    expect(typeof res.body.feedback).toBe('string');
    expect(res.body.feedback.length).toBeGreaterThan(0);
  });
});

// ── POST /ai/analyze-profile ──────────────────────────────────────────────────

describe('POST /ai/analyze-profile', () => {
  test('returns 400 when interviews is missing', async () => {
    const res = await request(app).post('/ai/analyze-profile').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when interviews is an empty array', async () => {
    const res = await request(app)
      .post('/ai/analyze-profile')
      .send({ interviews: [] });
    expect(res.status).toBe(400);
  });

  test('fallback: returns analysis string with stats', async () => {
    const res = await request(app)
      .post('/ai/analyze-profile')
      .send({
        interviews: [
          { ai_score: 80, category: 'React', created_at: '2026-01-01' },
          { ai_score: 65, category: 'Node.js', created_at: '2026-01-02' },
        ],
        username: 'alice',
        profession: 'Developer',
        years_of_experience: 3,
      });
    expect(res.status).toBe(200);
    expect(typeof res.body.analysis).toBe('string');
    expect(res.body.analysis).toMatch(/2/); // totalInterviews = 2
  });

  test('fallback: analysis mentions average score', async () => {
    const res = await request(app)
      .post('/ai/analyze-profile')
      .send({
        interviews: [{ ai_score: 90, category: 'Python', created_at: '2026-01-01' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.analysis).toMatch(/90/); // avgScore = bestScore = 90
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  test('returns 404 for undefined routes', async () => {
    const res = await request(app).get('/ai/does-not-exist');
    expect(res.status).toBe(404);
  });
});
