const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: list published stories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.body, s.is_paid, s.price_usd, s.featured_on_blog,
              s.published_at, u.name AS author_name,
              p.full_name AS profile_name, p.company, p.title AS profile_title, p.photo_url
       FROM stories s
       JOIN users u ON u.id = s.author_id
       LEFT JOIN profiles p ON p.id = s.profile_id
       WHERE s.status = 'published'
       ORDER BY s.published_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Public: single story
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name AS author_name, p.full_name AS profile_name, p.company, p.photo_url
       FROM stories s
       JOIN users u ON u.id = s.author_id
       LEFT JOIN profiles p ON p.id = s.profile_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Story not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// Writer/Admin: submit a new story (goes to pending_review unless admin publishes directly)
router.post('/', requireAuth, requireRole('writer', 'admin'), async (req, res) => {
  const { title, body, profile_id, is_paid, price_usd } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
  try {
    const status = req.user.role === 'admin' ? 'published' : 'pending_review';
    const result = await pool.query(
      `INSERT INTO stories (title, body, author_id, profile_id, is_paid, price_usd, status, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 = 'published' THEN now() ELSE NULL END)
       RETURNING *`,
      [title, body, req.user.id, profile_id || null, !!is_paid, price_usd || 0, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

module.exports = router;
