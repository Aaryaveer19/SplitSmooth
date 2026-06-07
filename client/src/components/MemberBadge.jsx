import { getInitials, getAvatarColor } from '../utils/helpers';

export default function MemberBadge({ name, size = 'md', selected, onClick, showName = true }) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  const sizes = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 transition-all ${
        onClick ? 'cursor-pointer active:scale-90' : 'cursor-default'
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
        <span className="text-[11px] text-gray-400 max-w-[64px] truncate leading-tight">
          {name}
        </span>
      )}
    </button>
  );
}
