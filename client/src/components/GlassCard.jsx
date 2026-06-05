import { motion } from 'motion/react';

export default function GlassCard({ children, className = '', onClick, animate = true, ...props }) {
  const Component = animate ? motion.div : 'div';
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Component
      className={`glass p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
      {...animateProps}
      {...props}
    >
      {children}
    </Component>
  );
}
