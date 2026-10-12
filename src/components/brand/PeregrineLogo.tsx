/**
 * PEREGRINE — Brand Identity Component (Section 14.6)
 * Renders master vector symbol, wordmark, lockups and icon variants.
 */

import React from 'react';

interface PeregrineLogoProps {
  variant?: 'symbol' | 'lockup-horizontal' | 'lockup-stacked' | 'icon';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showDescriptor?: boolean;
}

export const PeregrineLogo: React.FC<PeregrineLogoProps> = ({
  variant = 'lockup-horizontal',
  theme = 'light',
  size = 'md',
  className = '',
  showDescriptor = true
}) => {
  const isDark = theme === 'dark';
  const navyColor = isDark ? '#FFFFFF' : '#123B63';
  const slateColor = '#5B6B80';
  const amberColor = '#F4B942';
  const greenColor = '#56A67A';
  const darkGreen = '#3B885C';

  // Base Symbol dimensions
  const getSymbolSize = () => {
    switch (size) {
      case 'sm': return 28;
      case 'md': return 42;
      case 'lg': return 56;
      case 'xl': return 72;
    }
  };

  const symbolPx = getSymbolSize();

  const renderSymbolSvg = (pixelSize: number) => (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none"
      style={{ overflow: 'visible' }}
    >
      {/* Outer Broken Circular Arc Segments */}
      {/* 1. Top Arc Segment (Slate Blue-Grey) */}
      <path
        d="M 256 86 A 166 166 0 0 1 348 116"
        stroke={slateColor}
        strokeWidth="30"
        strokeLinecap="butt"
      />

      {/* 2. Amber Alert Destination Node at ~2 o'clock */}
      <circle cx="370" cy="150" r="23" fill={amberColor} />

      {/* 3. Right Arc Segment (Industrial Navy) */}
      <path
        d="M 390 180 A 166 166 0 0 1 380 348"
        stroke={navyColor}
        strokeWidth="30"
        strokeLinecap="butt"
      />

      {/* 4. Bottom-Right Segment (Slate Blue-Grey) */}
      <path
        d="M 368 372 A 166 166 0 0 1 258 424"
        stroke={slateColor}
        strokeWidth="30"
        strokeLinecap="butt"
      />

      {/* 5. Bottom-Left Segment (Industrial Navy) */}
      <path
        d="M 238 424 A 166 166 0 0 1 114 330"
        stroke={navyColor}
        strokeWidth="30"
        strokeLinecap="butt"
      />

      {/* 6. Left to Top-Left Segment (Industrial Navy) */}
      <path
        d="M 94 220 A 166 166 0 0 1 240 86"
        stroke={navyColor}
        strokeWidth="30"
        strokeLinecap="butt"
      />

      {/* Inner Concentric Structural Arcs */}
      <path
        d="M 138 194 A 126 126 0 0 1 242 124"
        stroke={slateColor}
        strokeWidth="16"
        strokeLinecap="butt"
      />
      <path
        d="M 270 384 A 126 126 0 0 0 366 294"
        stroke={slateColor}
        strokeWidth="16"
        strokeLinecap="butt"
      />

      {/* Falcon Head & Chest Silhouette */}
      <path
        d="M 120 210 
           C 160 236, 212 250, 276 250 
           C 318 250, 350 262, 355 278 
           C 350 285, 324 282, 290 280 
           C 252 276, 230 310, 212 360 
           C 170 300, 126 250, 120 210 Z"
        fill={navyColor}
      />

      {/* Emerald Green Wing Feathers (Network Resilience Metaphor) */}
      <polygon
        points="92,192 140,226 194,272 176,280 118,232 86,210"
        fill={greenColor}
      />
      <polygon
        points="84,234 134,268 198,324 180,332 122,278 78,250"
        fill={darkGreen}
      />
    </svg>
  );

  if (variant === 'icon' || variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderSymbolSvg(symbolPx)}
      </div>
    );
  }

  if (variant === 'lockup-stacked') {
    return (
      <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
        {renderSymbolSvg(symbolPx * 1.2)}
        <div className="text-center">
          <span
            className="block font-heading font-extrabold uppercase tracking-[0.10em] leading-none"
            style={{
              color: navyColor,
              fontSize: size === 'sm' ? '1.1rem' : size === 'md' ? '1.4rem' : '1.8rem'
            }}
          >
            PEREGRINE
          </span>
          {showDescriptor && (
            <span
              className="block font-mono-numbers text-[0.62rem] font-semibold tracking-[0.22em] uppercase mt-1"
              style={{ color: isDark ? '#DCE5ED' : '#5B6B80' }}
            >
              DISASTER-RESILIENT BROADCAST NETWORK
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal lockup (Default)
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{
        paddingLeft: '4px',
        paddingRight: '4px'
      }}
    >
      {renderSymbolSvg(symbolPx)}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            className="font-heading font-extrabold uppercase tracking-[0.10em] leading-none"
            style={{
              color: navyColor,
              fontSize: size === 'sm' ? '1.15rem' : size === 'md' ? '1.45rem' : size === 'lg' ? '1.9rem' : '2.3rem'
            }}
          >
            PEREGRINE
          </span>
          <span className="hidden sm:inline-block stamp-label stamp-simulation text-[0.6rem] py-0.5 px-1.5 ml-1">
            SIMULATION
          </span>
        </div>
        {showDescriptor && (
          <span
            className="font-mono-numbers text-[0.62rem] font-semibold tracking-[0.20em] uppercase mt-1 leading-tight"
            style={{ color: isDark ? '#DCE5ED' : '#5B6B80' }}
          >
            DISASTER-RESILIENT BROADCAST NETWORK
          </span>
        )}
      </div>
    </div>
  );
};
