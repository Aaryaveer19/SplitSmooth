import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { X, Plus, UserPlus, Sparkles } from 'lucide-react';
import { createTrip } from '../api';
import PageHeader from '../components/PageHeader';

const GRADIENTS = [
  { key: 'from-emerald-500 to-cyan-500', cls: 'gradient-emerald', label: 'Emerald' },
  { key: 'from-violet-500 to-purple-500', cls: 'gradient-violet', label: 'Violet' },
  { key: 'from-orange-500 to-pink-500', cls: 'gradient-orange', label: 'Sunset' },
  { key: 'from-blue-500 to-indigo-500', cls: 'gradient-blue', label: 'Ocean' },
  { key: 'from-rose-500 to-red-500', cls: 'gradient-rose', label: 'Rose' },
  { key: 'from-teal-500 to-emerald-500', cls: 'gradient-teal', label: 'Teal' },
  { key: 'from-amber-500 to-orange-500', cls: 'gradient-amber', label: 'Amber' },
  { key: 'from-fuchsia-500 to-pink-500', cls: 'gradient-fuchsia', label: 'Fuchsia' },
];

export default function CreateTrip() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gradient, setGradient] = useState(GRADIENTS[0].key);
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function addMember() {
    const t = memberInput.trim();
    if (!t) return;
    if (members.includes(t)) { setError(`"${t}" already added`); return; }
    setMembers(p => [...p, t]);
    setMemberInput('');
    setError('');
  }

  function handleKey(e) { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Trip name is required'); return; }
    if (members.length < 2) { setError('Add at least 2 members'); return; }
    setSubmitting(true); setError('');
    try {
      const trip = await createTrip({ name: name.trim(), description: description.trim(), start_date: startDate || null, end_date: endDate || null, members });
      navigate(`/trips/${trip.id}`);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create trip'); setSubmitting(false); }
  }

  const sel = GRADIENTS.find(g => g.key === gradient);

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      <PageHeader title="Create Trip" subtitle="Plan a new adventure" backTo="/" />
      <main className="flex-1 px-4 pb-32">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
          <motion.div className={`h-36 rounded-2xl ${sel?.cls || 'gradient-emerald'} flex items-end p-5 relative overflow-hidden`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={gradient}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h2 className="text-xl font-bold text-white">{name || 'Your Trip Name'}</h2>
              <p className="text-sm text-white/60 mt-0.5">{description || 'Where will you go?'}</p>
            </div>
          </motion.div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Cover Color</label>
            <div className="flex gap-2 flex-wrap">
              {GRADIENTS.map(g => (
                <button key={g.key} type="button" onClick={() => setGradient(g.key)} className={`w-10 h-10 rounded-xl ${g.cls} transition-all ${gradient === g.key ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900 scale-110' : 'opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Trip Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pilla Villa Trip" id="trip-name" autoFocus />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Weekend getaway..." rows={2} id="trip-description" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><UserPlus size={14} /> Members ({members.length})</label>
            <div className="flex gap-2">
              <input type="text" value={memberInput} onChange={e => setMemberInput(e.target.value)} onKeyDown={handleKey} placeholder="Enter member name" className="flex-1" id="member-input" />
              <button type="button" onClick={addMember} className="btn btn-secondary px-4"><Plus size={18} /></button>
            </div>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {members.map(m => (
                  <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-700 text-sm text-gray-300 border border-white/5">
                    {m}
                    <button type="button" onClick={() => setMembers(p => p.filter(x => x !== m))} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </main>

      <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
        <div className="max-w-lg mx-auto">
          <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary w-full text-base" id="submit-trip">
            {submitting ? 'Creating...' : <><Sparkles size={18} /> Create Trip</>}
          </button>
        </div>
      </div>
    </div>
  );
}
