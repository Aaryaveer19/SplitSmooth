import { NavLink, useLocation } from 'react-router-dom';
import { Home, MapPin, Receipt, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function BottomNav({ tripId }) {
  const location = useLocation();
  const isInTrip = tripId || location.pathname.includes('/trips/');

  // Extract tripId from URL if not passed
  const currentTripId = tripId || location.pathname.match(/\/trips\/(\d+)/)?.[1];

  const mainNav = [
    { to: '/', icon: Home, label: 'Home' },
  ];

  const tripNav = currentTripId
    ? [
        { to: `/trips/${currentTripId}`, icon: MapPin, label: 'Trip', end: true },
        { to: `/trips/${currentTripId}/balances`, icon: Receipt, label: 'Balances' },
        { to: `/trips/${currentTripId}/settlements`, icon: ArrowLeftRight, label: 'Settle' },
      ]
    : [];

  const navItems = [...mainNav, ...tripNav];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="glass mx-auto max-w-lg border-t border-white/5" style={{ borderRadius: '1.25rem 1.25rem 0 0' }}>
        <div className="flex items-center justify-around px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-col items-center py-2 px-4 min-w-[64px]"
            >
              {({ isActive }) => (
                <motion.div
                  className="flex flex-col items-center gap-1.5"
                  whileTap={{ scale: 0.9 }}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-gray-500'
                    }`}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-gray-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
