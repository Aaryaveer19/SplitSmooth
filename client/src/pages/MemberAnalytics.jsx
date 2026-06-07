import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, Minus,
  ArrowRight, Receipt, CreditCard,
  Calendar, DollarSign, BarChart3,
} from 'lucide-react';
import { getMemberAnalytics } from '../api';
import { formatCurrency, getAvatarColor, getInitials } from '../utils/helpers';
import PageHeader from '../components/PageHeader';

// Mini bar chart — pure CSS, no external chart lib
function ExpenseBar({ label, amount, maxAmount, color }) {
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-300 truncate max-w-[55%]">{label}</span>
        <span className="text-sm font-semibold text-white">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Stat chip
function StatCard({ label, value, sub, accent = false, delay = 0 }) {
  return (
    <motion.div
      className="glass p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function MemberAnalytics() {
  const { tripId, memberId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMemberAnalytics(memberId)
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError('Failed to load analytics'); setLoading(false); });
  }, [memberId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Analytics" backTo={`/trips/${tripId}`} />
      <div className="p-8 text-center text-gray-400">{error || 'No data'}</div>
    </div>
  );

  const { member, summary, events_participated, events_paid_for, payment_history, settlement_obligations, settlement_receivables } = data;

  const isCreditor = summary.net_balance > 0.01;
  const isDebtor = summary.net_balance < -0.01;
  const avatarColor = getAvatarColor(member.name);
  const initials = getInitials(member.name);

  // Max amount for expense bar chart
  const maxEventAmount = Math.max(
    ...events_participated.map(e => e.share),
    1
  );

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader
        title="Member Analytics"
        subtitle={member.name}
        backTo={`/trips/${tripId}`}
      />

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto">

          {/* ── Avatar Hero ── */}
          <motion.div
            className="flex flex-col items-center pt-4 pb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-2xl"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <h2 className="text-xl font-bold text-white">{member.name}</h2>
            <div className={`flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-sm font-medium ${
              isCreditor ? 'bg-emerald-500/15 text-emerald-400' :
              isDebtor   ? 'bg-red-500/15 text-red-400' :
                           'bg-gray-500/15 text-gray-400'
            }`}>
              {isCreditor ? <TrendingUp size={14} /> : isDebtor ? <TrendingDown size={14} /> : <Minus size={14} />}
              {isCreditor ? `Gets back ${formatCurrency(summary.net_balance)}` :
               isDebtor   ? `Owes ${formatCurrency(Math.abs(summary.net_balance))}` :
                            'Fully settled'}
            </div>
          </motion.div>

          {/* ── Summary Stats ── */}
          <section className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Paid" value={formatCurrency(summary.total_paid)} sub="across all events" delay={0.05} />
              <StatCard label="Total Share" value={formatCurrency(summary.total_owed)} sub="owed as participant" delay={0.1} />
              <StatCard
                label="Net Balance"
                value={`${isCreditor ? '+' : ''}${formatCurrency(summary.net_balance)}`}
                sub={isCreditor ? 'to receive' : isDebtor ? 'to pay' : 'settled'}
                accent={isCreditor}
                delay={0.15}
              />
              <StatCard
                label="Events"
                value={events_participated.length}
                sub={`${events_paid_for.length} paid for`}
                delay={0.2}
              />
            </div>
          </section>

          {/* ── Settlement Obligations ── */}
          {settlement_obligations.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Needs to Pay</h3>
              <div className="space-y-3">
                {settlement_obligations.map((s, i) => (
                  <motion.div
                    key={i}
                    className="glass p-5 flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(s.from_name) }}>
                      {getInitials(s.from_name)}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 h-px bg-red-500/30" />
                      <ArrowRight size={14} className="text-red-400 flex-shrink-0" />
                      <div className="flex-1 h-px bg-emerald-500/30" />
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: getAvatarColor(s.to_name) }}>
                        {getInitials(s.to_name)}
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">{s.to_name}</span>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[72px]">
                      <p className="text-base font-bold text-red-400">{formatCurrency(s.amount)}</p>
                      <p className="text-[10px] text-gray-500">pay</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Settlement Receivables ── */}
          {settlement_receivables.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Will Receive</h3>
              <div className="space-y-3">
                {settlement_receivables.map((s, i) => (
                  <motion.div
                    key={i}
                    className="glass p-5 flex items-center gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(s.from_name) }}>
                      {getInitials(s.from_name)}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 h-px bg-red-500/30" />
                      <ArrowRight size={14} className="text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 h-px bg-emerald-500/30" />
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: getAvatarColor(s.to_name) }}>
                        {getInitials(s.to_name)}
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">you</span>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[72px]">
                      <p className="text-base font-bold text-emerald-400">{formatCurrency(s.amount)}</p>
                      <p className="text-[10px] text-gray-500">receive</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Expense Breakdown Chart ── */}
          {events_participated.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Expense Breakdown</h3>
              <div className="glass p-5">
                <p className="text-xs text-gray-500 mb-5">Personal share per event</p>
                {events_participated.map((e, i) => (
                  <ExpenseBar
                    key={e.event_id}
                    label={e.event_name}
                    amount={e.share}
                    maxAmount={maxEventAmount}
                    color={i % 2 === 0 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-violet-500 to-purple-400'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Events Participated ── */}
          {events_participated.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Events Participated In</h3>
              <div className="space-y-3">
                {events_participated.map((e, i) => (
                  <motion.div
                    key={e.event_id}
                    className="glass p-5 cursor-pointer active:scale-[0.98] transition-transform"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/trips/${tripId}/events/${e.event_id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl gradient-emerald flex items-center justify-center flex-shrink-0">
                        <Receipt size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[15px] truncate">{e.event_name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{e.participant_count} participants</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-gray-500">Your share</p>
                        <p className="text-base font-bold text-white mt-0.5">{formatCurrency(e.share)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500">You paid</p>
                        <p className={`text-base font-bold mt-0.5 ${e.paid_amount > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {e.paid_amount > 0 ? formatCurrency(e.paid_amount) : '—'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Complete Payment History ── */}
          {payment_history.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment History</h3>
              <div className="space-y-3">
                {payment_history.map((h, i) => (
                  <motion.div
                    key={i}
                    className="glass p-4 flex items-center gap-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${h.type === 'paid' ? 'gradient-emerald' : 'bg-dark-700'}`}>
                      {h.type === 'paid'
                        ? <CreditCard size={16} className="text-white" />
                        : <Calendar size={16} className="text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{h.event_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.type === 'paid' ? 'Paid for group' : 'Participated'}</p>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${h.type === 'paid' ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {h.type === 'paid' ? '+' : '-'}{formatCurrency(h.amount)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
