import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Calendar, Wallet, Trash2, Plane } from 'lucide-react';
import { getTrips, deleteTrip } from '../api';
import { formatCurrency, getGradientClass, formatDate } from '../utils/helpers';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this trip and all its data?')) return;
    try {
      await deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header — generous top padding */}
      <motion.header
        className="px-6 pt-10 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl gradient-emerald flex items-center justify-center">
              <Plane size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SplitSmooth</h1>
              <p className="text-sm text-gray-400 mt-0.5">Split expenses effortlessly</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Trip List — 24px section spacing */}
      <main className="flex-1 px-5 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass p-0 overflow-hidden">
                <div className="h-32 shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 shimmer rounded-lg" />
                  <div className="h-3 w-1/2 shimmer rounded-lg" />
                </div>
              </div>
            ))
          ) : trips.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No trips yet"
              message="Create your first trip and start splitting expenses with friends"
              action={
                <button
                  onClick={() => navigate('/create-trip')}
                  className="btn btn-primary"
                  id="create-first-trip"
                >
                  <Plus size={18} /> Create Trip
                </button>
              }
            />
          ) : (
            <AnimatePresence>
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="glass p-0 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  id={`trip-card-${trip.id}`}
                >
                  {/* Gradient Cover — taller for breathing room */}
                  <div className={`h-32 ${getGradientClass(trip.cover_gradient)} relative`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <h2 className="text-xl font-bold text-white drop-shadow-lg truncate">
                        {trip.name}
                      </h2>
                      {trip.description && (
                        <p className="text-xs text-white/70 truncate mt-1">{trip.description}</p>
                      )}
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, trip.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/30 backdrop-blur flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
                      id={`delete-trip-${trip.id}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Stats — more padding and spacing */}
                  <div className="px-5 py-4 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={15} />
                      <span>{trip.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={15} />
                      <span>{trip.event_count} events</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 ml-auto font-semibold">
                      <Wallet size={15} />
                      <span>{formatCurrency(trip.total_expense)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Floating Create Button — more distance from bottom nav */}
      {!loading && trips.length > 0 && (
        <motion.button
          onClick={() => navigate('/create-trip')}
          className="fixed bottom-28 right-6 w-14 h-14 rounded-2xl btn-primary flex items-center justify-center shadow-2xl z-40"
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          id="fab-create-trip"
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
}
