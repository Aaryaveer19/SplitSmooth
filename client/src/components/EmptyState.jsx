import { motion } from 'motion/react';
import { MapPin, Plane, Compass } from 'lucide-react';

export default function EmptyState({ icon: Icon = Compass, title, message, action }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-20 h-20 rounded-2xl bg-dark-700/50 flex items-center justify-center mb-6">
        <Icon size={36} className="text-gray-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-3">{title}</h3>
      <p className="text-sm text-gray-500 max-w-[280px] mb-8 leading-relaxed">{message}</p>
      {action}
    </motion.div>
  );
}
