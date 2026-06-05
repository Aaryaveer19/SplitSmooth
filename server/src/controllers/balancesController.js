const pool = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/trips/:tripId/balances
 * 
 * Compute net balance for each member across all events in a trip.
 * net = total_paid - total_owed
 * Positive = member should receive money (creditor)
 * Negative = member owes money (debtor)
 */
async function getBalances(req, res) {
  const { tripId } = req.params;

  // Verify trip exists
  const tripCheck = await pool.query('SELECT id FROM trips WHERE id = $1', [tripId]);
  if (tripCheck.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  // Get all members
  const membersResult = await pool.query(
    'SELECT * FROM members WHERE trip_id = $1 ORDER BY name',
    [tripId]
  );

  // Get all events for this trip
  const eventsResult = await pool.query(
    'SELECT * FROM events WHERE trip_id = $1',
    [tripId]
  );

  // Initialize balances
  const balances = {};
  for (const member of membersResult.rows) {
    balances[member.id] = {
      member_id: member.id,
      name: member.name,
      total_paid: 0,
      total_owed: 0,
      net_balance: 0,
    };
  }

  // Process each event
  for (const event of eventsResult.rows) {
    // Get payers for this event
    const payersResult = await pool.query(
      'SELECT * FROM event_payers WHERE event_id = $1',
      [event.id]
    );

    // Get participants for this event
    const participantsResult = await pool.query(
      'SELECT * FROM event_participants WHERE event_id = $1',
      [event.id]
    );

    const participantCount = participantsResult.rows.length;
    if (participantCount === 0) continue;

    const sharePerPerson = parseFloat(event.total_amount) / participantCount;

    // Add what each payer paid
    for (const payer of payersResult.rows) {
      if (balances[payer.member_id]) {
        balances[payer.member_id].total_paid += parseFloat(payer.amount);
      }
    }

    // Add what each participant owes
    for (const participant of participantsResult.rows) {
      if (balances[participant.member_id]) {
        balances[participant.member_id].total_owed += sharePerPerson;
      }
    }
  }

  // Calculate net balances
  const result = Object.values(balances).map((b) => ({
    ...b,
    total_paid: Math.round(b.total_paid * 100) / 100,
    total_owed: Math.round(b.total_owed * 100) / 100,
    net_balance: Math.round((b.total_paid - b.total_owed) * 100) / 100,
  }));

  // Sort by net balance descending (creditors first)
  result.sort((a, b) => b.net_balance - a.net_balance);

  res.json(result);
}

module.exports = { getBalances };
