'use client';

import React from 'react';

interface ZytechLogoProps {
  className?: string;
  glow?: boolean;
}

export const ZytechLogo: React.FC<ZytechLogoProps> = ({ className = 'w-10 h-10', glow = true }) => {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${glow ? 'hover:scale-[1.03] transition-transform duration-300' : ''}`}>
      {/* Glow aura matching the brain-gear neon lights */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 rounded-full blur-xl opacity-35 animate-pulse pointer-events-none" />
      )}
      
      {/* SVG rendering of the custom Brain & Gear Logo */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} relative z-10`}
      >
        <defs>
          {/* Left Brain Gradient: Yellow -> Orange -> Pink */}
          <linearGradient id="brain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" /> {/* Yellow */}
            <stop offset="60%" stopColor="#EC4899" /> {/* Pink */}
            <stop offset="100%" stopColor="#D946EF" /> {/* Fuchsia */}
          </linearGradient>
          
          {/* Right Gear Gradient: Pink -> Violet -> Indigo */}
          <linearGradient id="gear-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" /> {/* Pink */}
            <stop offset="60%" stopColor="#8B5CF6" /> {/* Purple */}
            <stop offset="100%" stopColor="#6366F1" /> {/* Indigo */}
          </linearGradient>

          {/* Central division line gradient */}
          <linearGradient id="div-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Outer Radiating Neural Nodes & Connectors (Matching the glowing background ticks) */}
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-pink-500/40 dark:text-pink-500/30">
          {/* Top connection */}
          <line x1="50" y1="20" x2="50" y2="10" />
          <circle cx="50" cy="8" r="2" fill="currentColor" />
          
          {/* Angle connectors */}
          <line x1="28" y1="35" x2="20" y2="28" />
          <circle cx="18" cy="26" r="1.5" fill="currentColor" />

          <line x1="72" y1="35" x2="80" y2="28" />
          <circle cx="82" cy="26" r="1.5" fill="currentColor" />

          <line x1="20" y1="50" x2="10" y2="50" />
          <circle cx="8" cy="50" r="1.5" fill="currentColor" />

          <line x1="80" y1="50" x2="90" y2="50" />
          <circle cx="92" cy="50" r="1.5" fill="currentColor" />

          <line x1="28" y1="65" x2="20" y2="72" />
          <circle cx="18" cy="74" r="1.5" fill="currentColor" />

          <line x1="72" y1="65" x2="80" y2="72" />
          <circle cx="82" cy="74" r="1.5" fill="currentColor" />
        </g>

        {/* Central Divider line (Brain dividing fissure) */}
        <line x1="50" y1="25" x2="50" y2="75" stroke="url(#div-grad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left Side: Neural Brain Hemisphere */}
        <g fill="none" stroke="url(#brain-grad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer brain lobes outline */}
          <path d="M47 28 C38 28, 32 32, 32 40 C32 43, 34 45, 36 47 C32 50, 31 55, 34 60 C32 63, 33 69, 39 71 C43 72, 47 70, 47 67" />
          {/* Inner cerebral folds (gyri/sulci patterns) */}
          <path d="M47 38 C40 38, 38 42, 42 45" />
          <path d="M47 48 C41 48, 38 52, 43 56" />
          <path d="M47 58 C38 58, 39 64, 45 64" />
        </g>

        {/* Right Side: Mechanical Gear/Cog Hemisphere */}
        <g fill="none" stroke="url(#gear-grad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer semicircular gear outline with cogs */}
          <path d="M53 28 C62 28, 68 33, 68 41 C68 43, 73 45, 71 50 C74 53, 70 60, 68 62 C68 66, 61 71, 53 72" />
          
          {/* Outer teeth/cogs along the right edge */}
          <path d="M60 27 L62 21 M67 33 L73 30 M71 42 L78 42 M70 52 L76 56 M66 62 L71 67 M59 69 L61 75" strokeWidth="5.5" />
          
          {/* Center cog wheel axle hub */}
          <circle cx="58" cy="50" r="8" stroke="url(#gear-grad)" strokeWidth="4" />
          <circle cx="58" cy="50" r="2.5" fill="url(#gear-grad)" />
        </g>
      </svg>
    </div>
  );
};
