import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import db from '../db.js';
import fetch from 'node-fetch';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

// POST /api/interviews - submit answer and get AI evaluation
router.post('/', requireAuth, async (req, res) => {
  const { question_id, user_answer, language } = req.body;
  const user_id = req.user.id;

  if (!question_id || !user_answer) {
    return res.status(400).json({ error: 'question_id and user_answer are required' });
  }

  // Fetch question details
  db.get('SELECT * FROM questions WHERE id = ?', [question_id], async (err, question) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Fetch user for context
    db.get('SELECT years_of_experience FROM users WHERE id = ?', [user_id], async (err, user) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      let ai_score = null;
      let ai_feedback = null;

      try {
        const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': AI_SERVICE_SECRET
          },
          body: JSON.stringify({
            question_title: question.title,
            user_answer,
            years_of_experience: user?.years_of_experience || 0,
            difficulty: question.difficulty,
            language: language || 'en'
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          ai_score = aiData.score;
          ai_feedback = aiData.feedback;
        } else {
          console.warn('[Interviews] AI service returned:', aiResponse.status);
        }
      } catch (err) {
        console.warn('[Interviews] AI service unreachable:', err.message);
      }

      db.run(
        'INSERT INTO interviews (user_id, question_id, user_answer, ai_score, ai_feedback) VALUES (?, ?, ?, ?, ?)',
        [user_id, question_id, user_answer, ai_score, ai_feedback],
        function (err) {
          if (err) {
            console.error('[Interviews] Insert error:', err);
            return res.status(500).json({ error: 'Failed to save interview' });
          }

          return res.status(201).json({
            id: this.lastID,
            user_id,
            question_id,
            question_title: question.title,
            user_answer,
            ai_score,
            ai_feedback,
            curator_tip: question.curator_tip
          });
        }
      );
    });
  });
});

// GET /api/interviews/user/:userId - get user's interview history
router.get('/user/:userId', requireAuth, (req, res) => {
  const requestedUserId = parseInt(req.params.userId);

  // Users can only see their own interviews unless admin
  if (req.user.id !== requestedUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    `SELECT i.*, q.title as question_title, q.category, q.difficulty
     FROM interviews i
     JOIN questions q ON i.question_id = q.id
     WHERE i.user_id = ?
     ORDER BY i.created_at DESC`,
    [requestedUserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch interviews' });
      res.json(rows);
    }
  );
});

export default router;
