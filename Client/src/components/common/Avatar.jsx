import React from 'react';

export default function Avatar({
  src,
  alt = 'User Avatar',
  name = '',
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status = null, // 'online' | 'idle' | 'dnd' | 'offline' | null
  className = '',
  ringColor = null,
  onClick,
}) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const statusSizeMap = {
    xs: 'w-2 h-2 bottom-0 right-0 border',
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
    xl: 'w-4 h-4 bottom-1 right-1 border-2',
  };

  const statusColorMap = {
    online: 'bg-emerald-400 ring-emerald-500/40',
    idle: 'bg-amber-400 ring-amber-500/40',
    dnd: 'bg-rose-500 ring-rose-500/40',
    offline: 'bg-slate-500 ring-slate-600/40',
  };

  const initials = (name || alt)
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NX';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-2xl overflow-visible select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } transition-transform ${className}`}
    >
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-2xl overflow-hidden bg-slate-800 border ${
          ringColor ? 'border-2' : 'border-white/10'
        } flex items-center justify-center`}
        style={ringColor ? { borderColor: ringColor } : {}}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className={`w-full h-full font-mono text-cyan-200 font-semibold bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center ${
            src ? 'hidden' : 'flex'
          }`}
        >
          {initials}
        </span>
      </div>

      {/* Online Status Dot */}
      {status && (
        <span
          className={`absolute ${statusSizeMap[size] || statusSizeMap.md} rounded-full border-[#0C0F15] ${
            statusColorMap[status] || statusColorMap.offline
          } ring-1`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
}
