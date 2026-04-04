import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import db, { parseTechStack } from '../db.js';
import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

const router = Router();

// PUT /api/users/:userId - update profile
router.put('/:userId', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.userId);

  // Users can only update their own profile unless admin
  if (req.user.id !== targetId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { username, profession, years_of_experience, tech_stack } = req.body;
  let techStackStr;
  if (tech_stack !== undefined) {
    // Normalise to [{name, level}] objects; default level = intermediate
    const normStack = (Array.isArray(tech_stack) ? tech_stack : []).map(item =>
      typeof item === 'string' ? { name: item, level: 'intermediate' } : item
    );
    techStackStr = JSON.stringify(normStack);
  }

  // Build dynamic update
  const fields = [];
  const values = [];

  if (username !== undefined) { fields.push('username = ?'); values.push(username.trim()); }
  if (profession !== undefined) { fields.push('profession = ?'); values.push(profession); }
  if (years_of_experience !== undefined) { fields.push('years_of_experience = ?'); values.push(years_of_experience); }
  if (techStackStr !== undefined) { fields.push('tech_stack = ?'); values.push(techStackStr); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(targetId);

  db.run(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username already taken' });
        }
        console.error('[Users] Update error:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      db.get(
        'SELECT id, username, profession, years_of_experience, tech_stack, role FROM users WHERE id = ?',
        [targetId],
        (err, user) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch updated user' });
          user.tech_stack = parseTechStack(user.tech_stack);
          res.json(user);
        }
      );
    }
  );
});

// POST /api/users/:userId/analyze - generate AI analysis of interview history
router.post('/:userId/analyze', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.userId);
  if (req.user.id !== targetId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { interviews } = req.body;
  if (!Array.isArray(interviews) || interviews.length === 0) {
    return res.status(400).json({ error: 'interviews array is required' });
  }

  db.get(
    'SELECT username, profession, years_of_experience FROM users WHERE id = ?',
    [targetId],
    async (err, user) => {
      if (err || !user) return res.status(500).json({ error: 'User not found' });

      try {
        const aiResp = await fetch(`${AI_SERVICE_URL}/ai/analyze-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': AI_SERVICE_SECRET,
          },
          body: JSON.stringify({
            interviews,
            username: user.username,
            profession: user.profession,
            years_of_experience: user.years_of_experience,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!aiResp.ok) {
          const errData = await aiResp.json().catch(() => ({}));
          return res.status(502).json({ error: errData.error || 'AI service error' });
        }

        const data = await aiResp.json();
        return res.json(data);
      } catch (err) {
        console.error('[Users] analyze error:', err.message);
        return res.status(502).json({ error: 'Failed to get AI analysis' });
      }
    }
  );
});

// GET /api/users/:userId - get profile (auth required)
router.get('/:userId', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.userId);

  if (req.user.id !== targetId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    'SELECT id, username, profession, years_of_experience, tech_stack, role, created_at FROM users WHERE id = ?',
    [targetId],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch user' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.tech_stack = JSON.parse(user.tech_stack || '[]');
      res.json(user);
    }
  );
});

export default router;
