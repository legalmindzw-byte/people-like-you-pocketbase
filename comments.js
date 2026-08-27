const express = require('express');
const pool = require('./db');
const { requireAuth } = require('./authMiddleware');

const router = express.Router();

// Points needed before a reader shows up in the admin's "eligible for writer" queue.
const WRITER_ELIGIBILITY_THRESHOLD = 50;
const POINTS_PER_COMMENT = 2;

router.get('/story/:storyId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.body, c.created_at, u.name AS commenter_name
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.story_id = $1 ORDER BY c.created_at ASC`,
      [req.params.storyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/story/:storyId', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Comment body is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const comment = await client.query(
      `INSERT INTO comments (story_id, user_id, body, points_awarded)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.storyId, req.user.id, body, POINTS_PER_COMMENT]
    );

    const updatedUser = await client.query(
      `UPDATE users SET points = points + $1,
         eligible_for_writer = (points + $1) >= $2,
         updated_at = now()
       WHERE id = $3
       RETURNING id, points, eligible_for_writer`,
      [POINTS_PER_COMMENT, WRITER_ELIGIBILITY_THRESHOLD, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ comment: comment.rows[0], user_progress: updatedUser.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to post comment' });
  } finally {
    client.release();
  }
});

module.exports = router;
