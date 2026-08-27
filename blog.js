const express = require('express');
const pool = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT s.id, s.title, s.body, s.published_at, u.name AS author_name
     FROM stories s JOIN users u ON u.id = s.author_id
     WHERE s.status = 'published' AND s.featured_on_blog = true
     ORDER BY s.published_at DESC`
  );
  res.json(result.rows);
});

module.exports = router;
