import React from 'react';

/**
 * NexoraSymbol - The official geometric Nexus Core icon.
 * Features an intertwining dual-hex orbit and central transmission core.
 */
export default function NexoraSymbol({ size = 32, className = '', animated = false }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${animated ? 'animate-pulse-glow' : ''}`}
      >
        <defs>
          <linearGradient id="symGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <filter id="symGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hex Energy Enclosure */}
        <path
          d="M24 6 L40 15 L40 33 L24 42 L8 33 L8 15 Z"
          stroke="url(#symGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Inner Dynamic Data Conduit */}
        <path
          d="M24 13 L34 24 L24 35 L14 24 Z"
          fill="url(#symGrad)"
          fillOpacity="0.85"
        />

        {/* Node Beacons */}
        <circle cx="24" cy="6" r="2.2" fill="#00F0FF" filter="url(#symGlow)" />
        <circle cx="40" cy="15" r="2.2" fill="#6366F1" />
        <circle cx="40" cy="33" r="2.2" fill="#A855F7" />
        <circle cx="24" cy="42" r="2.2" fill="#A855F7" filter="url(#symGlow)" />
        <circle cx="8" cy="33" r="2.2" fill="#6366F1" />
        <circle cx="8" cy="15" r="2.2" fill="#00F0FF" />

        {/* Core Focal Point */}
        <circle cx="24" cy="24" r="3.2" fill="#07080C" stroke="#FFFFFF" strokeWidth="1.8" />
      </svg>
    </div>
  );
}
