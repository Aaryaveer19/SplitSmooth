const pool = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/trips/:tripId/events — List all events for a trip
 */
async function getEvents(req, res) {
  const { tripId } = req.params;

  const events = await pool.query(
    `SELECT e.*,
       COALESCE(p.payer_count, 0)::int AS payer_count,
       COALESCE(pt.participant_count, 0)::int AS participant_count
     FROM events e
     LEFT JOIN (SELECT event_id, COUNT(*) AS payer_count FROM event_payers GROUP BY event_id) p ON p.event_id = e.id
     LEFT JOIN (SELECT event_id, COUNT(*) AS participant_count FROM event_participants GROUP BY event_id) pt ON pt.event_id = e.id
     WHERE e.trip_id = $1
     ORDER BY e.created_at DESC`,
    [tripId]
  );

  res.json(events.rows);
}

/**
 * GET /api/events/:id — Get event details with payers and participants
 */
async function getEventById(req, res) {
  const { id } = req.params;

  const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  if (eventResult.rows.length === 0) {
    throw createError('Event not found', 404);
  }

  const event = eventResult.rows[0];

  // Get payers with member names
  const payers = await pool.query(
    `SELECT ep.*, m.name AS member_name 
     FROM event_payers ep 
     JOIN members m ON m.id = ep.member_id 
     WHERE ep.event_id = $1`,
    [id]
  );

  // Get participants with member names
  const participants = await pool.query(
    `SELECT ept.*, m.name AS member_name 
     FROM event_participants ept 
     JOIN members m ON m.id = ept.member_id 
     WHERE ept.event_id = $1`,
    [id]
  );

  res.json({
    ...event,
    payers: payers.rows,
    participants: participants.rows,
  });
}

/**
 * POST /api/trips/:tripId/events — Create an event
 * Body: {
 *   name: "Villa Booking",
 *   description: "...",
 *   total_amount: 10000,
 *   payers: [{ member_id: 1, amount: 5000 }, { member_id: 2, amount: 5000 }],
 *   participant_ids: [1, 2, 3, 4, 5]
 * }
 */
async function createEvent(req, res) {
  const { tripId } = req.params;
  const { name, description, total_amount, payers, participant_ids } = req.body;

  // Validation
  if (!name || !name.trim()) throw createError('Event name is required');
  if (!total_amount || total_amount <= 0) throw createError('Total amount must be positive');
  if (!payers || !Array.isArray(payers) || payers.length === 0) {
    throw createError('At least one payer is required');
  }
  if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
    throw createError('At least one participant is required');
  }

  // Validate payer amounts sum to total
  const payerSum = payers.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  if (Math.abs(payerSum - parseFloat(total_amount)) > 0.01) {
    throw createError(
      `Payer amounts (${payerSum}) must equal total amount (${total_amount})`
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create event
    const eventResult = await client.query(
      `INSERT INTO events (trip_id, name, description, total_amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tripId, name.trim(), description || null, total_amount]
    );
    const event = eventResult.rows[0];

    // Add payers
    for (const payer of payers) {
      await client.query(
        'INSERT INTO event_payers (event_id, member_id, amount) VALUES ($1, $2, $3)',
        [event.id, payer.member_id, payer.amount]
      );
    }

    // Add participants
    for (const memberId of participant_ids) {
      await client.query(
        'INSERT INTO event_participants (event_id, member_id) VALUES ($1, $2)',
        [event.id, memberId]
      );
    }

    await client.query('COMMIT');

    // Return full event details
    const fullEvent = await getEventDetails(event.id);
    res.status(201).json(fullEvent);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/events/:id
 */
async function deleteEvent(req, res) {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw createError('Event not found', 404);
  }

  res.json({ message: 'Event deleted' });
}

// Helper: get full event details
async function getEventDetails(eventId) {
  const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventResult.rows[0];

  const payers = await pool.query(
    `SELECT ep.*, m.name AS member_name 
     FROM event_payers ep JOIN members m ON m.id = ep.member_id 
     WHERE ep.event_id = $1`,
    [eventId]
  );

  const participants = await pool.query(
    `SELECT ept.*, m.name AS member_name 
     FROM event_participants ept JOIN members m ON m.id = ept.member_id 
     WHERE ept.event_id = $1`,
    [eventId]
  );

  return { ...event, payers: payers.rows, participants: participants.rows };
}

module.exports = { getEvents, getEventById, createEvent, deleteEvent };
