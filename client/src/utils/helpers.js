/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Get gradient class by key
 */
export const GRADIENT_MAP = {
  'from-emerald-500 to-cyan-500': 'gradient-emerald',
  'from-violet-500 to-purple-500': 'gradient-violet',
  'from-orange-500 to-pink-500': 'gradient-orange',
  'from-blue-500 to-indigo-500': 'gradient-blue',
  'from-rose-500 to-red-500': 'gradient-rose',
  'from-teal-500 to-emerald-500': 'gradient-teal',
  'from-amber-500 to-orange-500': 'gradient-amber',
  'from-fuchsia-500 to-pink-500': 'gradient-fuchsia',
};

export function getGradientClass(key) {
  return GRADIENT_MAP[key] || 'gradient-emerald';
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate avatar color from name
 */
const AVATAR_COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f97316',
  '#ec4899', '#3b82f6', '#f43f5e', '#14b8a6',
  '#f59e0b', '#6366f1', '#a855f7', '#d946ef',
];

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Format a date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
