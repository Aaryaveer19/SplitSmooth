const pool = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/members/:id/analytics
 *
 * Returns a complete financial breakdown for a single member within their trip.
 */
async function getMemberAnalytics(req, res) {
  const { id } = req.params;

  // Get member info
  const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
  if (memberResult.rows.length === 0) throw createError('Member not found', 404);
  const member = memberResult.rows[0];
  const { trip_id } = member;

  // Get all events for this trip
  const eventsResult = await pool.query(
    'SELECT * FROM events WHERE trip_id = $1 ORDER BY created_at DESC',
    [trip_id]
  );

  // Get all members for this trip (for settlement context)
  const allMembersResult = await pool.query(
    'SELECT * FROM members WHERE trip_id = $1',
    [trip_id]
  );
  const memberNames = {};
  for (const m of allMembersResult.rows) memberNames[m.id] = m.name;

  // Accumulators
  let totalPaid = 0;
  let totalOwed = 0;
  const eventsParticipated = [];
  const eventsPaidFor = [];
  const paymentHistory = [];

  for (const event of eventsResult.rows) {
    const payersResult = await pool.query(
      'SELECT ep.*, m.name AS member_name FROM event_payers ep JOIN members m ON m.id = ep.member_id WHERE ep.event_id = $1',
      [event.id]
    );
    const participantsResult = await pool.query(
      'SELECT ept.*, m.name AS member_name FROM event_participants ept JOIN members m ON m.id = ept.member_id WHERE ept.event_id = $1',
      [event.id]
    );

    const participantCount = participantsResult.rows.length;
    const sharePerPerson = participantCount > 0 ? parseFloat(event.total_amount) / participantCount : 0;

    const isMemberParticipant = participantsResult.rows.some(p => p.member_id === parseInt(id));
    const memberPayerRow = payersResult.rows.find(p => p.member_id === parseInt(id));

    if (isMemberParticipant) {
      totalOwed += sharePerPerson;
      eventsParticipated.push({
        event_id: event.id,
        event_name: event.name,
        total_amount: parseFloat(event.total_amount),
        participant_count: participantCount,
        share: Math.round(sharePerPerson * 100) / 100,
        paid_amount: memberPayerRow ? parseFloat(memberPayerRow.amount) : 0,
        payers: payersResult.rows.map(p => ({ name: p.member_name, amount: parseFloat(p.amount) })),
      });
    }

    if (memberPayerRow) {
      const amountPaid = parseFloat(memberPayerRow.amount);
      totalPaid += amountPaid;
      eventsPaidFor.push({
        event_id: event.id,
        event_name: event.name,
        total_amount: parseFloat(event.total_amount),
        paid_amount: amountPaid,
        participant_count: participantCount,
      });
      paymentHistory.push({
        event_id: event.id,
        event_name: event.name,
        type: 'paid',
        amount: amountPaid,
        date: event.created_at,
      });
    }

    if (isMemberParticipant && !memberPayerRow) {
      paymentHistory.push({
        event_id: event.id,
        event_name: event.name,
        type: 'owed',
        amount: Math.round(sharePerPerson * 100) / 100,
        date: event.created_at,
      });
    }
  }

  // Round totals
  totalPaid = Math.round(totalPaid * 100) / 100;
  totalOwed = Math.round(totalOwed * 100) / 100;
  const netBalance = Math.round((totalPaid - totalOwed) * 100) / 100;

  // Compute all members' net balances (for settlements)
  const netBalances = {};
  for (const m of allMembersResult.rows) netBalances[m.id] = 0;

  for (const event of eventsResult.rows) {
    const payers = await pool.query('SELECT * FROM event_payers WHERE event_id = $1', [event.id]);
    const parts = await pool.query('SELECT * FROM event_participants WHERE event_id = $1', [event.id]);
    const cnt = parts.rows.length;
    if (cnt === 0) continue;
    const share = parseFloat(event.total_amount) / cnt;
    for (const p of payers.rows) if (netBalances[p.member_id] !== undefined) netBalances[p.member_id] += parseFloat(p.amount);
    for (const p of parts.rows) if (netBalances[p.member_id] !== undefined) netBalances[p.member_id] -= share;
  }

  // Greedy settlement to find this member's obligations/receivables
  const creditors = [];
  const debtors = [];
  for (const [mid, bal] of Object.entries(netBalances)) {
    const r = Math.round(bal * 100) / 100;
    if (r > 0.01) creditors.push({ member_id: parseInt(mid), name: memberNames[mid], amount: r });
    else if (r < -0.01) debtors.push({ member_id: parseInt(mid), name: memberNames[mid], amount: Math.abs(r) });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const allSettlements = [];
  let ci = 0, di = 0;
  const cCopy = creditors.map(c => ({ ...c }));
  const dCopy = debtors.map(d => ({ ...d }));
  while (ci < cCopy.length && di < dCopy.length) {
    const creditor = cCopy[ci];
    const debtor = dCopy[di];
    const amount = Math.round(Math.min(creditor.amount, debtor.amount) * 100) / 100;
    if (amount > 0) {
      allSettlements.push({ from_id: debtor.member_id, from_name: debtor.name, to_id: creditor.member_id, to_name: creditor.name, amount });
    }
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  const memberId = parseInt(id);
  const settlementObligations = allSettlements.filter(s => s.from_id === memberId);
  const settlementReceivables = allSettlements.filter(s => s.to_id === memberId);

  res.json({
    member: { id: member.id, name: member.name, trip_id: member.trip_id },
    summary: { total_paid: totalPaid, total_owed: totalOwed, net_balance: netBalance },
    events_participated: eventsParticipated,
    events_paid_for: eventsPaidFor,
    payment_history: paymentHistory,
    settlement_obligations: settlementObligations,
    settlement_receivables: settlementReceivables,
  });
}

module.exports = { getMemberAnalytics };
