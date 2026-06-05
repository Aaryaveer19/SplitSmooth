import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Users, Calendar, Wallet, Trash2, Receipt, ArrowLeftRight, UserPlus, X } from 'lucide-react';
import { getTrip, getMembers, getEvents, deleteEvent, addMembers } from '../api';
import { formatCurrency, getGradientClass } from '../utils/helpers';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import MemberBadge from '../components/MemberBadge';
import EmptyState from '../components/EmptyState';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState('');

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    try {
      const [t, m, e] = await Promise.all([getTrip(id), getMembers(id), getEvents(id)]);
      setTrip(t); setMembers(m); setEvents(e);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAddMember() {
    if (!newMember.trim()) return;
    try {
      await addMembers(id, [newMember.trim()]);
      setNewMember(''); setShowAddMember(false); loadAll();
    } catch (err) { console.error(err); }
  }

  async function handleDeleteEvent(eventId) {
    if (!confirm('Delete this event?')) return;
    try { await deleteEvent(eventId); loadAll(); } catch (err) { console.error(err); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!trip) return <div className="p-6 text-center text-gray-400">Trip not found</div>;

  const totalExpense = events.reduce((s, e) => s + parseFloat(e.total_amount), 0);

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader title={trip.name} subtitle={trip.description} backTo="/" />

      <main className="flex-1 px-4 pb-32">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Hero Card */}
          <motion.div
            className={`rounded-2xl ${getGradientClass(trip.cover_gradient)} p-5 relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-3">{trip.name}</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: 'Members', val: members.length },
                  { icon: Calendar, label: 'Events', val: events.length },
                  { icon: Wallet, label: 'Total', val: formatCurrency(totalExpense) },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                    <s.icon size={18} className="text-white/70 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{s.val}</p>
                    <p className="text-[10px] text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate(`/trips/${id}/balances`)} className="btn btn-secondary w-full" id="view-balances">
              <Receipt size={16} /> Balances
            </button>
            <button onClick={() => navigate(`/trips/${id}/settlements`)} className="btn btn-secondary w-full" id="view-settlements">
              <ArrowLeftRight size={16} /> Settle Up
            </button>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Members</h3>
              <button onClick={() => setShowAddMember(!showAddMember)} className="btn-ghost rounded-lg p-1.5">
                <UserPlus size={16} className="text-emerald-400" />
              </button>
            </div>
            {showAddMember && (
              <motion.div className="flex gap-2 mb-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input type="text" value={newMember} onChange={e => setNewMember(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMember()} placeholder="New member name" className="flex-1 text-sm" />
                <button onClick={handleAddMember} className="btn btn-primary px-3 py-2"><Plus size={16} /></button>
              </motion.div>
            )}
            <div className="flex flex-wrap gap-3">
              {members.map(m => <MemberBadge key={m.id} name={m.name} size="md" />)}
            </div>
          </div>

          {/* Events Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Events</h3>
            {events.length === 0 ? (
              <EmptyState icon={Calendar} title="No events yet" message="Add your first expense event" />
            ) : (
              <div className="space-y-3">
                {events.map((evt, i) => (
                  <motion.div key={evt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard className="flex items-center gap-3" animate={false}>
                      <div className="w-11 h-11 rounded-xl gradient-emerald flex items-center justify-center flex-shrink-0">
                        <Receipt size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{evt.name}</h4>
                        <p className="text-xs text-gray-500">{evt.payer_count} payer(s) · {evt.participant_count} participant(s)</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-emerald-400">{formatCurrency(evt.total_amount)}</p>
                      </div>
                      <button onClick={() => handleDeleteEvent(evt.id)} className="btn-ghost p-1.5 rounded-lg flex-shrink-0">
                        <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
                      </button>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Add Event */}
      <motion.button onClick={() => navigate(`/trips/${id}/add-event`)} className="fixed bottom-24 right-5 btn btn-primary rounded-2xl px-5 py-3.5 shadow-2xl z-40" whileTap={{ scale: 0.9 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} id="add-event-fab">
        <Plus size={18} /> Add Event
      </motion.button>
    </div>
  );
}
