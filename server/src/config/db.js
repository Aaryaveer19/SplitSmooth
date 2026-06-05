const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
    };

const pool = new Pool(poolConfig);

// Log connection status
pool.on('connect', () => {
  console.log('✓ PostgreSQL pool connected');
});

pool.on('error', (err) => {
  console.error('✗ PostgreSQL pool error:', err.message);
});

module.exports = pool;
