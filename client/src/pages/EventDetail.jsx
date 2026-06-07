import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Receipt, Users, CreditCard, ArrowRight,
  TrendingUp, TrendingDown, Divide,
} from 'lucide-react';
import { getEvent } from '../api';
import { formatCurrency, getAvatarColor, getInitials } from '../utils/helpers';
import PageHeader from '../components/PageHeader';

// Percentage bar
function ShareBar({ label, amount, maxAmount, color, sub }) {
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(label) }}
          >
            {getInitials(label)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{label}</p>
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
          </div>
        </div>
        <p className={`text-sm font-bold ${color}`}>{formatCurrency(amount)}</p>
      </div>
      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden ml-11">
        <motion.div
          className={`h-full rounded-full ${color === 'text-emerald-400' ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-violet-500 to-purple-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { tripId, eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEvent(eventId)
      .then(d => { setEvent(d); setLoading(false); })
      .catch(() => { setError('Failed to load event'); setLoading(false); });
  }, [eventId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Event" backTo={`/trips/${tripId}`} />
      <div className="p-8 text-center text-gray-400">{error || 'Event not found'}</div>
    </div>
  );

  const totalAmount = parseFloat(event.total_amount);
  const participantCount = event.participants?.length || 0;
  const payerCount = event.payers?.length || 0;
  const sharePerPerson = participantCount > 0 ? totalAmount / participantCount : 0;

  // Max values for bars
  const maxPaid = Math.max(...(event.payers || []).map(p => parseFloat(p.amount)), 1);

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader
        title="Event Details"
        subtitle={event.name}
        backTo={`/trips/${tripId}`}
      />

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto">

          {/* ── Hero Card ── */}
          <motion.div
            className="glass p-6 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl gradient-emerald flex items-center justify-center flex-shrink-0">
                <Receipt size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{event.name}</h2>
                {event.description && (
                  <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                )}
              </div>
            </div>

            {/* Total amount — primary metric */}
            <div className="text-center py-5 border-t border-b border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Amount</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(totalAmount)}</p>
            </div>
          </motion.div>

          {/* ── Key Stats ── */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Users, label: 'Participants', value: participantCount },
              { icon: CreditCard, label: 'Payers', value: payerCount },
              { icon: Divide, label: 'Per Person', value: formatCurrency(sharePerPerson) },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="glass p-4 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <s.icon size={16} className="text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Payers Breakdown ── */}
          {event.payers && event.payers.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Who Paid</h3>
              <div className="glass p-5">
                {event.payers.map((payer, i) => (
                  <motion.div
                    key={payer.member_id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <ShareBar
                      label={payer.member_name}
                      amount={parseFloat(payer.amount)}
                      maxAmount={maxPaid}
                      color="text-emerald-400"
                      sub={`${((parseFloat(payer.amount) / totalAmount) * 100).toFixed(0)}% of total`}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Per-Person Share Breakdown ── */}
          {event.participants && event.participants.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Individual Share</h3>
              <div className="glass p-5">
                <p className="text-xs text-gray-500 mb-4">
                  {formatCurrency(totalAmount)} ÷ {participantCount} participants = {formatCurrency(sharePerPerson)} each
                </p>
                {event.participants.map((participant, i) => {
                  const payerRow = event.payers.find(p => p.member_id === participant.member_id);
                  const paid = payerRow ? parseFloat(payerRow.amount) : 0;
                  const net = paid - sharePerPerson;
                  return (
                    <motion.div
                      key={participant.member_id}
                      className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: getAvatarColor(participant.member_name) }}
                      >
                        {getInitials(participant.member_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{participant.member_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Paid {formatCurrency(paid)} · Share {formatCurrency(sharePerPerson)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${net > 0.01 ? 'text-emerald-400' : net < -0.01 ? 'text-red-400' : 'text-gray-400'}`}>
                          {net > 0.01 ? '+' : ''}{formatCurrency(net)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {net > 0.01 ? <TrendingUp size={11} className="text-emerald-500" /> : net < -0.01 ? <TrendingDown size={11} className="text-red-500" /> : null}
                          <p className={`text-[10px] ${net > 0.01 ? 'text-emerald-500' : net < -0.01 ? 'text-red-500' : 'text-gray-500'}`}>
                            {net > 0.01 ? 'receives' : net < -0.01 ? 'owes' : 'even'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Net Contribution ── */}
          <section className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Net Contribution Generated</h3>
            <div className="glass p-5">
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                This event generates the following money flows between members based on the difference between what each person paid and their fair share.
              </p>
              {event.participants && event.participants.length > 0 && event.payers && (
                <div className="space-y-3">
                  {event.participants.map((participant, i) => {
                    const payerRow = event.payers.find(p => p.member_id === participant.member_id);
                    const paid = payerRow ? parseFloat(payerRow.amount) : 0;
                    const net = Math.round((paid - sharePerPerson) * 100) / 100;
                    if (Math.abs(net) < 0.01) return null;
                    return (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ backgroundColor: getAvatarColor(participant.member_name) }}
                          >
                            {getInitials(participant.member_name)}
                          </div>
                          <p className="text-sm text-gray-300">{participant.member_name}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${net > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {net > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {net > 0 ? `+${formatCurrency(net)}` : formatCurrency(net)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ── Settlement Impact ── */}
          <section className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Settlement Impact</h3>
            <div className="glass p-5">
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                The payments generated by this single event, if settled in isolation.
              </p>
              {(() => {
                // Compute per-event mini settlements
                const nets = {};
                (event.participants || []).forEach(p => { nets[p.member_id] = { name: p.member_name, net: -sharePerPerson }; });
                (event.payers || []).forEach(p => {
                  if (nets[p.member_id]) nets[p.member_id].net += parseFloat(p.amount);
                  else nets[p.member_id] = { name: p.member_name, net: parseFloat(p.amount) };
                });

                const creditors = Object.entries(nets).filter(([, v]) => v.net > 0.01).map(([id, v]) => ({ id, name: v.name, amount: v.net })).sort((a, b) => b.amount - a.amount);
                const debtors = Object.entries(nets).filter(([, v]) => v.net < -0.01).map(([id, v]) => ({ id, name: v.name, amount: Math.abs(v.net) })).sort((a, b) => b.amount - a.amount);

                const flows = [];
                const cCopy = creditors.map(c => ({ ...c }));
                const dCopy = debtors.map(d => ({ ...d }));
                let ci = 0, di = 0;
                while (ci < cCopy.length && di < dCopy.length) {
                  const amount = Math.round(Math.min(cCopy[ci].amount, dCopy[di].amount) * 100) / 100;
                  if (amount > 0) flows.push({ from: dCopy[di].name, to: cCopy[ci].name, amount });
                  cCopy[ci].amount -= amount;
                  dCopy[di].amount -= amount;
                  if (cCopy[ci].amount < 0.01) ci++;
                  if (dCopy[di].amount < 0.01) di++;
                }

                if (flows.length === 0) return <p className="text-sm text-gray-500">No settlements needed — everyone paid exactly their share.</p>;

                return (
                  <div className="space-y-3">
                    {flows.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(f.from) }}>
                          {getInitials(f.from)}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-px bg-red-500/30" />
                          <ArrowRight size={13} className="text-gray-400 flex-shrink-0" />
                          <div className="flex-1 h-px bg-emerald-500/30" />
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(f.to) }}>
                          {getInitials(f.to)}
                        </div>
                        <p className="text-sm font-bold text-white min-w-[64px] text-right">{formatCurrency(f.amount)}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
