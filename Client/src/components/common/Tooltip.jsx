import React, { useState } from 'react';

export default function Tooltip({ children, text, position = 'top', className = '' }) {
  const [visible, setVisible] = useState(false);

  if (!text) return children;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute ${positions[position]} z-50 px-2.5 py-1 text-xs font-medium text-slate-100 bg-[#151A23] border border-white/10 rounded-lg shadow-xl shadow-black/80 whitespace-nowrap pointer-events-none animate-fadeIn`}
        >
          {text}
        </div>
      )}
    </div>
  );
}
