import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getBalances } from '../api';
import { formatCurrency, getAvatarColor, getInitials } from '../utils/helpers';
import PageHeader from '../components/PageHeader';

export default function Balances() {
  const { id } = useParams();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBalances(id).then(b => { setBalances(b); setLoading(false); }).catch(err => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const maxAbs = Math.max(...balances.map(b => Math.abs(b.net_balance)), 1);
  const totalPaid = balances.reduce((s, b) => s + b.total_paid, 0);

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader title="Balances" subtitle="Who owes whom" backTo={`/trips/${id}`} />
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Summary */}
          <motion.div className="glass p-4 flex items-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-11 h-11 rounded-xl gradient-emerald flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
            </div>
          </motion.div>

          {/* Balance Cards */}
          {balances.map((b, i) => {
            const isPositive = b.net_balance > 0;
            const isZero = Math.abs(b.net_balance) < 0.01;
            const barWidth = isZero ? 0 : (Math.abs(b.net_balance) / maxAbs) * 100;

            return (
              <motion.div
                key={b.member_id}
                className={`glass p-4 ${isPositive ? 'border-emerald-500/20' : isZero ? '' : 'border-red-500/20'}`}
                initial={{ opacity: 0, x: isPositive ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: getAvatarColor(b.name) }}>
                    {getInitials(b.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{b.name}</h4>
                    <p className="text-xs text-gray-500">Paid {formatCurrency(b.total_paid)} · Owes {formatCurrency(b.total_owed)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : isZero ? 'text-gray-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(b.net_balance)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {isPositive ? <TrendingUp size={12} className="text-emerald-500" /> : !isZero ? <TrendingDown size={12} className="text-red-500" /> : null}
                      <span className={`text-[10px] ${isPositive ? 'text-emerald-500' : isZero ? 'text-gray-500' : 'text-red-500'}`}>
                        {isPositive ? 'gets back' : isZero ? 'settled' : 'owes'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance Bar */}
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isPositive ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: i * 0.06 + 0.3, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
