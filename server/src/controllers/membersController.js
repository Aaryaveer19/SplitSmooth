const pool = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/trips/:tripId/members
 */
async function getMembers(req, res) {
  const { tripId } = req.params;
  const result = await pool.query(
    'SELECT * FROM members WHERE trip_id = $1 ORDER BY name ASC',
    [tripId]
  );
  res.json(result.rows);
}

/**
 * POST /api/trips/:tripId/members — Add one or more members
 * Body: { names: ["Alice", "Bob"] } or { name: "Alice" }
 */
async function addMembers(req, res) {
  const { tripId } = req.params;
  const { name, names } = req.body;

  // Verify trip exists
  const tripCheck = await pool.query('SELECT id FROM trips WHERE id = $1', [tripId]);
  if (tripCheck.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  const memberNames = names || (name ? [name] : []);
  const uniqueNames = [...new Set(memberNames.map((n) => n.trim()).filter(Boolean))];

  if (uniqueNames.length === 0) {
    throw createError('At least one member name is required');
  }

  const added = [];
  for (const memberName of uniqueNames) {
    try {
      const result = await pool.query(
        'INSERT INTO members (trip_id, name) VALUES ($1, $2) RETURNING *',
        [tripId, memberName]
      );
      added.push(result.rows[0]);
    } catch (err) {
      // Skip duplicates (unique constraint)
      if (err.code === '23505') continue;
      throw err;
    }
  }

  res.status(201).json(added);
}

/**
 * DELETE /api/members/:id
 */
async function deleteMember(req, res) {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw createError('Member not found', 404);
  }

  res.json({ message: 'Member removed' });
}

module.exports = { getMembers, addMembers, deleteMember };
