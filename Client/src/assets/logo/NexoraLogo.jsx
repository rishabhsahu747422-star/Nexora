import React from 'react';
import NexoraSymbol from './NexoraSymbol';

/**
 * NexoraLogo - Full brand unit with symbol and tracked NEXORA wordmark.
 */
export default function NexoraLogo({ 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showTagline = false,
  className = '',
  onClick
}) {
  const sizeMap = {
    sm: { symbol: 24, text: 'text-base', tracking: 'tracking-widest' },
    md: { symbol: 32, text: 'text-xl', tracking: 'tracking-[0.2em]' },
    lg: { symbol: 42, text: 'text-2xl', tracking: 'tracking-[0.25em]' },
    xl: { symbol: 56, text: 'text-4xl', tracking: 'tracking-[0.3em]' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <NexoraSymbol size={current.symbol} animated={size === 'xl'} />
      <div className="flex flex-col">
        <span className={`font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 ${current.text} ${current.tracking} uppercase leading-none`}>
          Nexora
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/80 mt-1 font-semibold">
            Nexus Protocol
          </span>
        )}
      </div>
    </div>
  );
}
