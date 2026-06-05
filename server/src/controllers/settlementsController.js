const pool = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/trips/:tripId/settlements
 *
 * Compute optimized settlements using greedy algorithm.
 * Minimizes the number of transactions needed to settle all debts.
 */
async function getSettlements(req, res) {
  const { tripId } = req.params;

  // First, compute net balances (same logic as balancesController)
  const membersResult = await pool.query(
    'SELECT * FROM members WHERE trip_id = $1',
    [tripId]
  );

  const eventsResult = await pool.query(
    'SELECT * FROM events WHERE trip_id = $1',
    [tripId]
  );

  // Build net balance map
  const netBalance = {};
  const memberNames = {};

  for (const member of membersResult.rows) {
    netBalance[member.id] = 0;
    memberNames[member.id] = member.name;
  }

  for (const event of eventsResult.rows) {
    const payersResult = await pool.query(
      'SELECT * FROM event_payers WHERE event_id = $1',
      [event.id]
    );
    const participantsResult = await pool.query(
      'SELECT * FROM event_participants WHERE event_id = $1',
      [event.id]
    );

    const participantCount = participantsResult.rows.length;
    if (participantCount === 0) continue;

    const sharePerPerson = parseFloat(event.total_amount) / participantCount;

    for (const payer of payersResult.rows) {
      if (netBalance[payer.member_id] !== undefined) {
        netBalance[payer.member_id] += parseFloat(payer.amount);
      }
    }

    for (const participant of participantsResult.rows) {
      if (netBalance[participant.member_id] !== undefined) {
        netBalance[participant.member_id] -= sharePerPerson;
      }
    }
  }

  // Separate creditors and debtors
  const creditors = []; // positive balance: owed money
  const debtors = [];   // negative balance: owes money

  for (const [memberId, balance] of Object.entries(netBalance)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ member_id: parseInt(memberId), name: memberNames[memberId], amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ member_id: parseInt(memberId), name: memberNames[memberId], amount: Math.abs(rounded) });
    }
  }

  // Sort by amount descending for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy settlement minimization
  const settlements = [];
  let i = 0; // creditor pointer
  let j = 0; // debtor pointer

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.amount, debtor.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        from_id: debtor.member_id,
        from_name: debtor.name,
        to_id: creditor.member_id,
        to_name: creditor.name,
        amount: roundedAmount,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  res.json({
    settlements,
    total_transactions: settlements.length,
    total_amount: Math.round(settlements.reduce((s, t) => s + t.amount, 0) * 100) / 100,
  });
}

module.exports = { getSettlements };
