const express = require('express');
const pool = require('./db');
const { requireAuth, requireRole } = require('./authMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(`SELECT * FROM stationery_products ORDER BY created_at DESC`);
  res.json(result.rows);
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, description, price_usd, stock_qty, image_url } = req.body;
  if (!name || price_usd == null) return res.status(400).json({ error: 'name and price_usd are required' });
  const result = await pool.query(
    `INSERT INTO stationery_products (name, description, price_usd, stock_qty, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description || null, price_usd, stock_qty || 0, image_url || null]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
