const express = require('express');
const pool = require('./db');
const { requireAuth } = require('./authMiddleware');

const router = express.Router();

// Create an order for a story, book, or stationery item.
// NOTE: actual Paynow integration (initiate transaction, poll status, handle
// the return_url/result_url webhook) should be wired in here — this stores
// the order and leaves a paynow_reference placeholder for you to fill in.
router.post('/', requireAuth, async (req, res) => {
  const { item_type, item_id, amount_usd } = req.body;
  if (!['story', 'book', 'stationery'].includes(item_type)) {
    return res.status(400).json({ error: 'item_type must be story, book, or stationery' });
  }
  if (!item_id || amount_usd == null) {
    return res.status(400).json({ error: 'item_id and amount_usd are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO orders (user_id, item_type, item_id, amount_usd, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [req.user.id, item_type, item_id, amount_usd]
    );
    // TODO: call Paynow's initiate-transaction API here with result.rows[0].id
    // as the order reference, then update paynow_reference once you get it back.
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

module.exports = router;
