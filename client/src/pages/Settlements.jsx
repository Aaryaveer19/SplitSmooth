import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, Wallet, ArrowLeftRight } from 'lucide-react';
import { getSettlements } from '../api';
import { formatCurrency, getAvatarColor, getInitials } from '../utils/helpers';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

export default function Settlements() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettlements(id).then(d => { setData(d); setLoading(false); }).catch(err => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const settlements = data?.settlements || [];

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader title="Settlements" subtitle="Optimized transactions" backTo={`/trips/${id}`} />
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Summary Card */}
          <motion.div className="glass p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-violet flex items-center justify-center">
                <ArrowLeftRight size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Transactions Needed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{data?.total_transactions || 0}</span>
                  <span className="text-sm text-gray-500">totaling {formatCurrency(data?.total_amount || 0)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {settlements.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All settled!"
              message="No payments needed. Everyone is squared up."
            />
          ) : (
            settlements.map((s, i) => (
              <motion.div
                key={i}
                className="glass p-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  {/* From */}
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: getAvatarColor(s.from_name) }}>
                      {getInitials(s.from_name)}
                    </div>
                    <span className="text-xs text-gray-400 mt-1 truncate max-w-[60px]">{s.from_name}</span>
                  </div>

                  {/* Arrow & Amount */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-emerald-500/50" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.08 + 0.3, type: 'spring' }}
                      >
                        <ArrowRight size={16} className="text-gray-400" />
                      </motion.div>
                      <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-emerald-500/20" />
                    </div>
                    <motion.p
                      className="text-lg font-bold text-white mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.4 }}
                    >
                      {formatCurrency(s.amount)}
                    </motion.p>
                    <p className="text-[10px] text-gray-500">pays</p>
                  </div>

                  {/* To */}
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: getAvatarColor(s.to_name) }}>
                      {getInitials(s.to_name)}
                    </div>
                    <span className="text-xs text-gray-400 mt-1 truncate max-w-[60px]">{s.to_name}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
