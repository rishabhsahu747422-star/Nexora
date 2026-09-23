import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'default' | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'unread'
  size = 'sm', // 'xs' | 'sm' | 'md'
  className = '',
  onClick,
}) {
  const variantStyles = {
    default: 'bg-white/5 text-slate-300 border-white/10',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    unread: 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold border-transparent shadow-sm shadow-cyan-500/30',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-md font-mono',
    sm: 'text-xs px-2 py-0.5 rounded-lg font-medium',
    md: 'text-sm px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 border select-none leading-none ${
        sizeStyles[size] || sizeStyles.sm
      } ${variantStyles[variant] || variantStyles.default} ${
        onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''
      } ${className}`}
    >
      {children}
    </span>
  );
}
