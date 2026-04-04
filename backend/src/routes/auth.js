import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db, { parseTechStack } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, profession, years_of_experience, tech_stack } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'Username must be 3-32 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    // Normalise to [{name, level}] objects; default level = intermediate
    const normStack = (Array.isArray(tech_stack) ? tech_stack : []).map(item =>
      typeof item === 'string' ? { name: item, level: 'intermediate' } : item
    );
    const techStackStr = JSON.stringify(normStack);

    db.run(
      `INSERT INTO users (username, password_hash, profession, years_of_experience, tech_stack) VALUES (?, ?, ?, ?, ?)`,
      [username.trim(), password_hash, profession || null, years_of_experience || 0, techStackStr],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          console.error('[Auth] Register error:', err);
          return res.status(500).json({ error: 'Registration failed' });
        }

        const userId = this.lastID;
        const token = jwt.sign(
          { id: userId, username: username.trim(), role: 'user' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          token,
          user: { id: userId, username: username.trim(), role: 'user', profession, years_of_experience, tech_stack: normStack }
        });
      }
    );
  } catch (err) {
    console.error('[Auth] Hash error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username.trim()],
    async (err, user) => {
      if (err) {
        console.error('[Auth] Login DB error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            profession: user.profession,
            years_of_experience: user.years_of_experience,
            tech_stack: parseTechStack(user.tech_stack)
          }
        });
      } catch (err) {
        console.error('[Auth] bcrypt error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
});

export default router;
