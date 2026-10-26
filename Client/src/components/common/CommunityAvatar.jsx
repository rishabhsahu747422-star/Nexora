import React, { useState, useEffect } from "react";
import { Server } from "lucide-react";

/**
 * Deterministically generates a consistent Nexora cyber palette based on community name
 */
const getCommunityPalette = (name = "") => {
  const palettes = [
    {
      gradient: "from-cyan-950/80 via-[#0C1520] to-[#080B12]",
      text: "text-cyan-300",
      border: "border-cyan-500/30",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    },
    {
      gradient: "from-violet-950/80 via-[#130E20] to-[#080B12]",
      text: "text-violet-300",
      border: "border-violet-500/30",
      glow: "shadow-[0_0_15px_rgba(139,92,246,0.15)]",
    },
    {
      gradient: "from-emerald-950/80 via-[#0B1A16] to-[#080B12]",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    },
    {
      gradient: "from-amber-950/80 via-[#1C140C] to-[#080B12]",
      text: "text-amber-300",
      border: "border-amber-500/30",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    {
      gradient: "from-blue-950/80 via-[#0D1626] to-[#080B12]",
      text: "text-blue-300",
      border: "border-blue-500/30",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    },
  ];

  if (!name) return palettes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

/**
 * Extracts 1-2 clean uppercase initials from a community name
 */
export const getCommunityInitials = (name = "") => {
  if (!name || typeof name !== "string") return "NX";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function CommunityAvatar({
  src,
  name = "Community",
  size = "md", // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = "",
  shape = "rounded-2xl",
  alt,
  onClick,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  // Reset failure state if the image src changes
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const sizeMap = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[11px]",
    md: "w-10 h-10 text-sm font-semibold",
    lg: "w-12 h-12 text-base font-bold",
    xl: "w-16 h-16 text-xl font-extrabold",
    "2xl": "w-20 h-20 text-2xl font-black",
  };

  const palette = getCommunityPalette(name);
  const initials = getCommunityInitials(name);
  const resolvedAlt = alt || `${name} emblem`;

  const hasValidImage = src && typeof src === "string" && src.trim().length > 0 && !imageFailed;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : "img"}
      aria-label={resolvedAlt}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden transition-all ${
        sizeMap[size] || sizeMap.md
      } ${shape} ${onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : ""} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={src.trim()}
          alt={resolvedAlt}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${palette.gradient} border ${palette.border} ${palette.glow} flex flex-col items-center justify-center font-mono tracking-wider ${palette.text}`}
        >
          {initials ? (
            <span>{initials}</span>
          ) : (
            <Server className="w-1/2 h-1/2 opacity-70" />
          )}
        </div>
      )}
    </div>
  );
}
