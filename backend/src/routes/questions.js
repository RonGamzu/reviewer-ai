import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import db, { parseTechStack } from '../db.js';
import fetch from 'node-fetch';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

function aiHeaders() {
  return { 'Content-Type': 'application/json', 'x-internal-secret': AI_SERVICE_SECRET };
}

// GET /api/questions/random
// Generates a fresh question from Gemini based on the requesting user's profile
router.get('/random', requireAuth, (req, res) => {
  db.get(
    'SELECT years_of_experience, tech_stack FROM users WHERE id = ?',
    [req.user.id],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      const techStack = parseTechStack(user?.tech_stack);
      const yearsOfExperience = user?.years_of_experience || 0;

      // Fallback if the user has no tech stack yet
      const stackForAI = techStack.length > 0
        ? techStack
        : [{ name: 'Software Engineering', level: 'intermediate' }];

      try {
        const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/generate-question`, {
          method: 'POST',
          headers: aiHeaders(),
          body: JSON.stringify({ tech_stack: stackForAI, years_of_experience: yearsOfExperience }),
          signal: AbortSignal.timeout(30000),
        });

        if (!aiResponse.ok) {
          const body = await aiResponse.json().catch(() => ({}));
          return res.status(502).json({ error: body.error || 'AI question generation failed' });
        }

        const question = await aiResponse.json();

        // Persist the generated question so interviews can reference it
        db.run(
          'INSERT INTO questions (title, category, difficulty, curator_tip) VALUES (?, ?, ?, ?)',
          [question.title, question.category, question.difficulty, question.curator_tip || null],
          function (insertErr) {
            if (insertErr) {
              console.error('[Questions] Failed to persist generated question:', insertErr);
              return res.status(500).json({ error: 'Failed to save generated question' });
            }
            return res.json({ id: this.lastID, ...question });
          }
        );
      } catch (err) {
        console.error('[Questions] AI service error:', err.message);
        return res.status(502).json({ error: 'AI service unreachable. Please try again.' });
      }
    }
  );
});

// GET /api/questions - list all stored questions (auth required)
router.get('/', requireAuth, (req, res) => {
  db.all('SELECT * FROM questions ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch questions' });
    res.json(rows);
  });
});

// POST /api/questions - manually create (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { title, category, difficulty, curator_tip } = req.body;
  if (!title || !category || !difficulty) {
    return res.status(400).json({ error: 'title, category, and difficulty are required' });
  }
  db.run(
    'INSERT INTO questions (title, category, difficulty, curator_tip) VALUES (?, ?, ?, ?)',
    [title, category, difficulty, curator_tip || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create question' });
      db.get('SELECT * FROM questions WHERE id = ?', [this.lastID], (err, row) => {
        res.status(201).json(row);
      });
    }
  );
});

// PUT /api/questions/:id (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const { title, category, difficulty, curator_tip } = req.body;
  db.run(
    'UPDATE questions SET title = COALESCE(?, title), category = COALESCE(?, category), difficulty = COALESCE(?, difficulty), curator_tip = COALESCE(?, curator_tip) WHERE id = ?',
    [title || null, category || null, difficulty || null, curator_tip || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update question' });
      if (this.changes === 0) return res.status(404).json({ error: 'Question not found' });
      db.get('SELECT * FROM questions WHERE id = ?', [req.params.id], (err, row) => res.json(row));
    }
  );
});

// DELETE /api/questions/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM questions WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete question' });
    if (this.changes === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  });
});

export default router;
