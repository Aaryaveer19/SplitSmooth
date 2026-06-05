import { getInitials, getAvatarColor } from '../utils/helpers';

export default function MemberBadge({ name, size = 'md', selected, onClick, showName = true }) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${selected === false ? 'opacity-40' : ''}`}
    >
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white
          ${selected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-dark-900' : ''}`}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-[11px] text-gray-400 max-w-[56px] truncate">
          {name}
        </span>
      )}
    </button>
  );
}
