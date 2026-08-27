const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// See readers who've earned enough points to be considered for writer status
router.get('/eligible-writers', async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, points FROM users
     WHERE role = 'reader' AND eligible_for_writer = true
     ORDER BY points DESC`
  );
  res.json(result.rows);
});

// Promote a reader to writer (admin's manual "we see you're good" step)
router.post('/users/:id/promote-writer', async (req, res) => {
  const result = await pool.query(
    `UPDATE users SET role = 'writer', updated_at = now() WHERE id = $1 RETURNING id, name, email, role`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// Onboard a commentator (reader) directly, e.g. from an in-person or manual signup
router.post('/onboard-commentator', async (req, res) => {
  const { name, email, tempPassword } = req.body;
  if (!name || !email || !tempPassword) {
    return res.status(400).json({ error: 'name, email, and tempPassword are required' });
  }
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'reader')
     RETURNING id, name, email, role`,
    [name, email, passwordHash]
  );
  res.status(201).json(result.rows[0]);
});

// List stories awaiting review before publishing
router.get('/stories/pending', async (req, res) => {
  const result = await pool.query(
    `SELECT s.id, s.title, s.created_at, u.name AS author_name
     FROM stories s JOIN users u ON u.id = s.author_id
     WHERE s.status = 'pending_review' ORDER BY s.created_at ASC`
  );
  res.json(result.rows);
});

// Publish or reject a story
router.post('/stories/:id/review', async (req, res) => {
  const { decision } = req.body; // 'publish' or 'reject'
  if (!['publish', 'reject'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'publish' or 'reject'" });
  }
  const status = decision === 'publish' ? 'published' : 'rejected';
  const result = await pool.query(
    `UPDATE stories SET status = $1, published_at = CASE WHEN $1 = 'published' THEN now() ELSE NULL END
     WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Story not found' });
  res.json(result.rows[0]);
});

// Feature a published story on the blog
router.post('/stories/:id/feature', async (req, res) => {
  const result = await pool.query(
    `UPDATE stories SET featured_on_blog = true WHERE id = $1 AND status = 'published' RETURNING *`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Story not found or not published' });
  res.json(result.rows[0]);
});

// Create a corporate profile (the "person behind the story")
router.post('/profiles', async (req, res) => {
  const { full_name, company, title, photo_url, short_bio } = req.body;
  if (!full_name) return res.status(400).json({ error: 'full_name is required' });
  const result = await pool.query(
    `INSERT INTO profiles (full_name, company, title, photo_url, short_bio)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [full_name, company || null, title || null, photo_url || null, short_bio || null]
  );
  res.status(201).json(result.rows[0]);
});

// Approve a submitted book for Book Space
router.post('/books/:id/approve', async (req, res) => {
  const result = await pool.query(
    `UPDATE books SET approved = true WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
  res.json(result.rows[0]);
});

module.exports = router;
