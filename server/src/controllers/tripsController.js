const pool = require('../config/db');
const { createError } = require('../middleware/errorHandler');

// Gradient presets for trip covers
const GRADIENTS = [
  'from-emerald-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-orange-500 to-pink-500',
  'from-blue-500 to-indigo-500',
  'from-rose-500 to-red-500',
  'from-teal-500 to-emerald-500',
  'from-amber-500 to-orange-500',
  'from-fuchsia-500 to-pink-500',
];

/**
 * GET /api/trips — List all trips with member/event counts
 */
async function getTrips(req, res) {
  const result = await pool.query(`
    SELECT 
      t.*,
      COALESCE(m.member_count, 0)::int AS member_count,
      COALESCE(e.event_count, 0)::int AS event_count,
      COALESCE(e.total_expense, 0)::numeric AS total_expense
    FROM trips t
    LEFT JOIN (
      SELECT trip_id, COUNT(*) AS member_count 
      FROM members GROUP BY trip_id
    ) m ON m.trip_id = t.id
    LEFT JOIN (
      SELECT trip_id, COUNT(*) AS event_count, SUM(total_amount) AS total_expense
      FROM events GROUP BY trip_id
    ) e ON e.trip_id = t.id
    ORDER BY t.created_at DESC
  `);
  res.json(result.rows);
}

/**
 * POST /api/trips — Create a trip (optionally with members)
 */
async function createTrip(req, res) {
  const { name, description, start_date, end_date, members } = req.body;

  if (!name || !name.trim()) {
    throw createError('Trip name is required');
  }

  const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripResult = await client.query(
      `INSERT INTO trips (name, description, start_date, end_date, cover_gradient)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), description || null, start_date || null, end_date || null, gradient]
    );
    const trip = tripResult.rows[0];

    // Add members if provided
    let memberRows = [];
    if (members && Array.isArray(members) && members.length > 0) {
      const uniqueNames = [...new Set(members.map((n) => n.trim()).filter(Boolean))];
      for (const memberName of uniqueNames) {
        const mResult = await client.query(
          `INSERT INTO members (trip_id, name) VALUES ($1, $2) RETURNING *`,
          [trip.id, memberName]
        );
        memberRows.push(mResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...trip,
      members: memberRows,
      member_count: memberRows.length,
      event_count: 0,
      total_expense: 0,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * GET /api/trips/:id — Get trip details with stats
 */
async function getTripById(req, res) {
  const { id } = req.params;

  const tripResult = await pool.query(
    `SELECT t.*,
       COALESCE(m.member_count, 0)::int AS member_count,
       COALESCE(e.event_count, 0)::int AS event_count,
       COALESCE(e.total_expense, 0)::numeric AS total_expense
     FROM trips t
     LEFT JOIN (SELECT trip_id, COUNT(*) AS member_count FROM members GROUP BY trip_id) m ON m.trip_id = t.id
     LEFT JOIN (SELECT trip_id, COUNT(*) AS event_count, SUM(total_amount) AS total_expense FROM events GROUP BY trip_id) e ON e.trip_id = t.id
     WHERE t.id = $1`,
    [id]
  );

  if (tripResult.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  res.json(tripResult.rows[0]);
}

/**
 * DELETE /api/trips/:id — Delete a trip and all related data
 */
async function deleteTrip(req, res) {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  res.json({ message: 'Trip deleted successfully' });
}

module.exports = { getTrips, createTrip, getTripById, deleteTrip };
