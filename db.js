const { Pool } = require('pg');

// On Render, set DATABASE_URL to the Internal Database URL of your Postgres instance.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = pool;
