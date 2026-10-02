import React, { useState, useEffect } from 'react';

interface Slide {
  id: number;
  caption: string;
  theme: {
    bg: string;
    border: string;
    glow: string;
    accent: string;
  };
  svgContent: React.ReactNode;
}

export const LoginSlideCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      caption: "Trusted Matrimonial Matchmaking for Life's Sacred Journey",
      theme: {
        bg: "from-[#141A4C] via-[#1E256D] to-[#2B1B4A]",
        border: "border-indigo-800/40",
        glow: "rgba(216, 17, 36, 0.25)",
        accent: "#D81124",
      },
      svgContent: (
        <svg viewBox="0 0 400 260" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="sl1Glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D81124" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#141A4C" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="260" fill="url(#sl1Glow)" />
          {/* Couple silhouette artistic representation */}
          <g transform="translate(140, 40)">
            {/* Groom head & regal silhouette */}
            <circle cx="45" cy="30" r="18" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M 45 55 C 25 75 20 110 30 140 C 42 165 65 170 85 155 C 65 130 55 95 62 65 Z" fill="#E2E8F0" fillOpacity="0.85" />
            {/* Bride head & dupatta fluttering */}
            <circle cx="95" cy="35" r="15" fill="#FF4757" />
            <path d="M 108 30 C 125 35 140 45 145 65 C 138 68 130 65 125 60 C 132 70 130 80 120 85 C 115 80 110 70 108 55 Z" fill="#D81124" />
            <path d="M 90 56 C 80 75 75 105 90 135 C 105 160 130 165 145 150 C 120 135 110 105 110 70 Z" fill="#FF4757" fillOpacity="0.9" />
            {/* Garland connection */}
            <circle cx="75" cy="95" r="28" stroke="#FBBF24" strokeWidth="3" strokeDasharray="6 4" fill="none" />
          </g>
          {/* Decorative motif stars */}
          <circle cx="50" cy="50" r="2" fill="#FFFFFF" fillOpacity="0.4" />
          <circle cx="340" cy="80" r="2" fill="#FFFFFF" fillOpacity="0.4" />
          <circle cx="70" cy="200" r="2.5" fill="#FBBF24" fillOpacity="0.5" />
          <circle cx="330" cy="190" r="3" fill="#D81124" fillOpacity="0.5" />
        </svg>
      ),
    },
    {
      id: 2,
      caption: "Confidential & Verified Family Profiles Across Bangladesh",
      theme: {
        bg: "from-[#10153B] via-[#161D58] to-[#251028]",
        border: "border-red-900/30",
        glow: "rgba(24, 30, 84, 0.4)",
        accent: "#181E54",
      },
      svgContent: (
        <svg viewBox="0 0 400 260" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="sl2Glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#252E7D" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10153B" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="260" fill="url(#sl2Glow)" />
          {/* Shield of Trust & Rings */}
          <g transform="translate(130, 35)">
            {/* Elegant shield outline */}
            <path
              d="M 70 10 L 130 30 C 130 90 95 135 70 155 C 45 135 10 90 10 30 Z"
              stroke="#D81124"
              strokeWidth="2.5"
              fill="#181E54"
              fillOpacity="0.6"
            />
            {/* Checkmark of verification */}
            <circle cx="70" cy="70" r="32" fill="#141A4C" stroke="#FBBF24" strokeWidth="2" />
            <path
              d="M 56 70 L 66 80 L 86 58"
              stroke="#10B981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Intertwined golden wedding bands */}
            <circle cx="55" cy="120" r="16" stroke="#FBBF24" strokeWidth="3" fill="none" />
            <circle cx="72" cy="120" r="16" stroke="#FBBF24" strokeWidth="3" fill="none" />
          </g>
          <circle cx="80" cy="70" r="3" fill="#D81124" fillOpacity="0.6" />
          <circle cx="320" cy="140" r="2.5" fill="#3B82F6" fillOpacity="0.5" />
        </svg>
      ),
    },
    {
      id: 3,
      caption: "Excellence in CRM Relationship Management & Client Service",
      theme: {
        bg: "from-[#1A102E] via-[#2A163B] to-[#121845]",
        border: "border-slate-800",
        glow: "rgba(216, 17, 36, 0.3)",
        accent: "#D81124",
      },
      svgContent: (
        <svg viewBox="0 0 400 260" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="sl3Glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D81124" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1A102E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="260" fill="url(#sl3Glow)" />
          {/* Matrimonial celebration arch & floral motif */}
          <g transform="translate(100, 30)">
            {/* Arch */}
            <path
              d="M 20 160 L 20 80 C 20 25 180 25 180 80 L 180 160"
              stroke="#D81124"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="4 2"
            />
            {/* Chandelier / Floral centerpiece */}
            <circle cx="100" cy="50" r="14" fill="#FBBF24" fillOpacity="0.8" />
            <path d="M 100 65 L 100 95 M 88 85 L 112 85" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="115" r="24" fill="#181E54" stroke="#FFFFFF" strokeWidth="2" />
            <text x="100" y="121" fill="#FFFFFF" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              SK
            </text>
          </g>
          <circle cx="60" cy="140" r="3" fill="#FBBF24" fillOpacity="0.5" />
          <circle cx="340" cy="70" r="2" fill="#D81124" fillOpacity="0.5" />
        </svg>
      ),
    },
  ];

  // Automatic smooth transition every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* 3-Image switching container */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full bg-gradient-to-br ${slide.theme.bg} flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {slide.svgContent}
            </div>
          );
        })}

        {/* Subtle slide indicators */}
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-[#D81124]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Caption directly underneath the image switching section */}
      <div className="mt-4 px-3 text-center min-h-[48px] flex items-center justify-center">
        <p className="text-sm font-medium text-slate-700 leading-snug transition-all duration-500">
          {slides[currentIndex].caption}
        </p>
      </div>
    </div>
  );
};
