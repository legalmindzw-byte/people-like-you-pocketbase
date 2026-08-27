const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public: approved books only
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT b.id, b.title, b.description, b.cover_url, b.price_usd, u.name AS author_name
     FROM books b JOIN users u ON u.id = b.author_id
     WHERE b.approved = true ORDER BY b.created_at DESC`
  );
  res.json(result.rows);
});

// Any logged-in user can submit a book for approval
router.post('/', requireAuth, async (req, res) => {
  const { title, description, cover_url, file_url, price_usd } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const result = await pool.query(
    `INSERT INTO books (title, author_id, description, cover_url, file_url, price_usd)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, req.user.id, description || null, cover_url || null, file_url || null, price_usd || 0]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
