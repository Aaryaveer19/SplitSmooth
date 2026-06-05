import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function PageHeader({ title, subtitle, backTo, rightAction }) {
  const navigate = useNavigate();

  return (
    <motion.header
      className="sticky top-0 z-40 px-4 pt-3 pb-3"
      style={{ background: 'linear-gradient(to bottom, rgba(10,15,26,0.95) 60%, transparent)' }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="btn-ghost rounded-xl flex-shrink-0"
              id="back-button"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </motion.header>
  );
}
