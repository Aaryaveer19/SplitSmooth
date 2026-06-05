/**
 * Database initializer — creates the splitsmooth database and runs schema.sql
 * Usage: node db/init.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function init() {
  // 1. Connect to default 'postgres' database to create our app database
  const rootClient = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log('✓ Connected to PostgreSQL');

    // Check if database exists
    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    if (res.rowCount === 0) {
      await rootClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✓ Created database "${process.env.DB_NAME}"`);
    } else {
      console.log(`✓ Database "${process.env.DB_NAME}" already exists`);
    }
  } finally {
    await rootClient.end();
  }

  // 2. Connect to the app database and run schema
  const appClient = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    await appClient.connect();

    // Read and execute schema, but remove the \c command (psql-only)
    let schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    // Remove psql meta-commands
    schema = schema.replace(/\\c\s+\w+;?/g, '');

    await appClient.query(schema);
    console.log('✓ Schema applied successfully');
    console.log('\n🚀 Database ready! Run "npm run dev" to start the server.');
  } finally {
    await appClient.end();
  }
}

init().catch((err) => {
  console.error('✗ Database initialization failed:', err.message);
  process.exit(1);
});
