import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { getMembers, createEvent } from '../api';
import PageHeader from '../components/PageHeader';
import MemberBadge from '../components/MemberBadge';

export default function AddEvent() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payers, setPayers] = useState({});
  const [participants, setParticipants] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMembers(tripId).then(m => {
      setMembers(m);
      setParticipants(m.map(x => x.id));
    }).catch(console.error);
  }, [tripId]);

  function togglePayer(memberId) {
    setPayers(prev => {
      const copy = { ...prev };
      if (copy[memberId] !== undefined) { delete copy[memberId]; }
      else { copy[memberId] = ''; }
      return copy;
    });
  }

  function setPayerAmount(memberId, amount) {
    setPayers(prev => ({ ...prev, [memberId]: amount }));
  }

  function toggleParticipant(memberId) {
    setParticipants(prev =>
      prev.includes(memberId) ? prev.filter(x => x !== memberId) : [...prev, memberId]
    );
  }

  function selectAllParticipants() {
    setParticipants(members.map(m => m.id));
  }

  function clearAllParticipants() {
    setParticipants([]);
  }

  const payerIds = Object.keys(payers).map(Number);
  const payerSum = Object.values(payers).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const total = parseFloat(totalAmount) || 0;

  // Auto-fill single payer
  function autoFillSinglePayer() {
    if (payerIds.length === 1 && total > 0) {
      setPayers({ [payerIds[0]]: String(total) });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Event name is required'); return; }
    if (total <= 0) { setError('Amount must be positive'); return; }
    if (payerIds.length === 0) { setError('Select at least one payer'); return; }
    if (participants.length === 0) { setError('Select at least one participant'); return; }

    // Validate payer amounts
    const payerList = payerIds.map(mid => ({ member_id: mid, amount: parseFloat(payers[mid]) || 0 }));
    const pSum = payerList.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(pSum - total) > 0.01) { setError(`Payer amounts (₹${pSum}) must equal total (₹${total})`); return; }

    setSubmitting(true); setError('');
    try {
      await createEvent(tripId, {
        name: name.trim(), description: description.trim(),
        total_amount: total, payers: payerList, participant_ids: participants,
      });
      navigate(`/trips/${tripId}`);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create event'); setSubmitting(false); }
  }

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader title="Add Event" subtitle={`Trip #${tripId}`} backTo={`/trips/${tripId}`} />
      <main className="flex-1 px-5 pb-28">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">

          {/* Event Name */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-400 mb-3 block">Event Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Villa Booking" autoFocus id="event-name" />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-400 mb-3 block">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details" id="event-desc" />
          </div>

          {/* Amount */}
          <div className="mb-8">
            <label className="text-sm font-medium text-gray-400 mb-3 block">Total Amount (₹) *</label>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} onBlur={autoFillSinglePayer} placeholder="0" min="0" step="0.01" className="text-2xl font-bold" id="event-amount" />
          </div>

          {/* Payers */}
          <div className="mb-8">
            <label className="text-sm font-medium text-gray-400 mb-4 block">Who Paid?</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {members.map(m => (
                <button key={m.id} type="button" onClick={() => togglePayer(m.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${payerIds.includes(m.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-dark-700 text-gray-400 border border-white/5'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            {/* Payer amounts */}
            {payerIds.length > 0 && (
              <div className="space-y-3">
                {payerIds.map(mid => {
                  const m = members.find(x => x.id === mid);
                  return (
                    <div key={mid} className="flex items-center gap-4 glass-subtle p-4">
                      <span className="text-sm font-medium text-gray-300 min-w-[64px]">{m?.name}</span>
                      <input type="number" value={payers[mid]} onChange={e => setPayerAmount(mid, e.target.value)}
                        placeholder="Amount" min="0" step="0.01" className="flex-1 text-sm py-2" />
                    </div>
                  );
                })}
                <div className={`text-xs text-right mt-2 ${Math.abs(payerSum - total) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Payer total: ₹{payerSum.toFixed(2)} / ₹{total.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-400">Split Among ({participants.length})</label>
              <div className="flex gap-3">
                <button type="button" onClick={selectAllParticipants} className="text-xs text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10">All</button>
                <button type="button" onClick={clearAllParticipants} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-dark-700">None</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {members.map(m => {
                const active = participants.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggleParticipant(m.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-dark-700 text-gray-500 border border-white/5'}`}
                  >
                    {active && <Check size={14} />}
                    {m.name}
                  </button>
                );
              })}
            </div>
            {participants.length > 0 && total > 0 && (
              <p className="text-xs text-gray-500 mt-3">₹{(total / participants.length).toFixed(2)} per person</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

          <div className="pt-4 pb-8">
            <button type="submit" disabled={submitting} className="btn btn-primary w-full text-base" id="submit-event">
              {submitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
