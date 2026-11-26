'use client';

import React from 'react';

interface TikkitLogoProps {
  variant?: 'header' | 'badge' | 'icon' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const TikkitLogo: React.FC<TikkitLogoProps> = ({
  variant = 'header',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  // Ticket Sawtooth Path SVG helper
  // A vertical receipt with perforated zigzag bottom
  const TicketIcon = ({ width = 28, height = 32 }: { width?: number; height?: number }) => (
    <div
      className="relative shrink-0 flex items-center justify-center select-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* 3D Black Drop Shadow Offset */}
      <svg
        viewBox="0 0 100 115"
        className="absolute top-1 left-1 w-full h-full text-black fill-current"
      >
        <path d="M 0 0 L 100 0 L 100 100 L 95 108 L 90 100 L 85 108 L 80 100 L 75 108 L 70 100 L 65 108 L 60 100 L 55 108 L 50 100 L 45 108 L 40 100 L 35 108 L 30 100 L 25 108 L 20 100 L 15 108 L 10 100 L 5 108 L 0 100 Z" />
      </svg>

      {/* Main Ticket Surface (Vivid Mustard Yellow with Black Border) */}
      <svg
        viewBox="0 0 100 115"
        className="relative w-full h-full text-[#FFC72C] fill-current"
      >
        <path
          d="M 0 0 L 100 0 L 100 100 L 95 108 L 90 100 L 85 108 L 80 100 L 75 108 L 70 100 L 65 108 L 60 100 L 55 108 L 50 100 L 45 108 L 40 100 L 35 108 L 30 100 L 25 108 L 20 100 L 15 108 L 10 100 L 5 108 L 0 100 Z"
          stroke="#161412"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Perforated dashed cut line */}
        <line
          x1="12"
          y1="82"
          x2="88"
          y2="82"
          stroke="#161412"
          strokeWidth="3.5"
          strokeDasharray="5,4"
        />
        {/* Bold "TK" brand mark inside the ticket */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="#161412"
          fontSize="42"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-1"
        >
          TK
        </text>
      </svg>
    </div>
  );

  // Variant 1: "badge" — Full Hero Ticket (matching second image uploaded)
  if (variant === 'badge') {
    return (
      <div className={`relative inline-block select-none ${className}`}>
        {/* Outer 3D Shadow Container */}
        <div className="relative">
          {/* Black Isometric Extrusion Shadow */}
          <div className="absolute top-2 left-2 w-full h-full bg-[#161412] rounded-sm transform translate-x-1.5 translate-y-1.5" />

          {/* Ticket Body */}
          <div className="relative bg-[#FFC72C] border-3 border-[#161412] p-5 w-72 text-[#161412] font-sans shadow-none">
            {/* Top metadata */}
            <div className="flex items-center justify-between text-[11px] font-mono font-black uppercase tracking-wider mb-2">
              <span>KOT #001</span>
              <span>12:04</span>
            </div>

            {/* Big 3D Chunky "TIK KIT" Headline */}
            <div className="my-3 text-center">
              <h1
                className="text-4xl font-black tracking-tighter leading-none text-white drop-shadow-[2px_2px_0px_#161412] uppercase"
                style={{
                  WebkitTextStroke: '2px #161412',
                  filter: 'drop-shadow(3px 3px 0px #161412)',
                }}
              >
                TIK
                <br />
                KIT
              </h1>
            </div>

            {/* Perforated Dashed Line */}
            <div className="border-t-2 border-dashed border-[#161412] my-3" />

            {/* Bottom Subtitle */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-tight">
              <span>QSR · POS</span>
              <span>AI POWERED</span>
            </div>

            {/* Perforated bottom edge triangles */}
            <div className="absolute -bottom-2.5 left-0 w-full overflow-hidden leading-none flex">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-[#FFC72C]"
                  style={{ filter: 'drop-shadow(0 2px 0 #161412)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant 2: "icon" — App Icon Squircle with TK Ticket inside
  if (variant === 'icon') {
    const sizeMap = {
      sm: 'w-7 h-7 rounded-lg',
      md: 'w-9 h-9 rounded-xl',
      lg: 'w-12 h-12 rounded-2xl',
      xl: 'w-16 h-16 rounded-3xl',
    };

    return (
      <div
        className={`${sizeMap[size]} bg-brand-orange border-2 border-[#161412] shadow-[2px_2px_0px_#161412] flex items-center justify-center p-1 relative select-none shrink-0 ${className}`}
      >
        <TicketIcon width={size === 'sm' ? 16 : size === 'lg' ? 26 : size === 'xl' ? 34 : 20} />
      </div>
    );
  }

  // Variant 3: "mark" — Pure bold wordmark
  if (variant === 'mark') {
    return (
      <div className={`flex items-baseline gap-1 select-none ${className}`}>
        <span className="font-black text-2xl tracking-tighter text-[#161412] lowercase">
          tikkit
        </span>
        <span className="w-2 h-2 rounded-full bg-brand-orange" />
      </div>
    );
  }

  // Variant 4: "header" (Default) — Navbar brand with ticket icon + wordmark + tagline
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* App Icon Squircle with Yellow TK Ticket */}
      <div className="w-8 h-8 rounded-xl bg-brand-orange border-2 border-[#161412] shadow-[2px_2px_0px_#161412] flex items-center justify-center p-0.5 shrink-0 transition-transform hover:scale-105">
        <TicketIcon width={18} height={21} />
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1 leading-none">
          <span className="font-black text-base text-gray-900 tracking-tight lowercase">
            tikkit
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-[#FFC72C] text-[#161412] border border-[#161412]/40 ml-0.5">
            POS
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] font-mono font-bold text-gray-500 tracking-tight leading-none mt-0.5">
            QSR OPS MADE EASY
          </span>
        )}
      </div>
    </div>
  );
};
