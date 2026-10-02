import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const ShadikabboLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const heightMap = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
    xl: 'h-24',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        viewBox="0 0 520 180"
        className={`${heightMap[size]} w-auto transition-transform duration-200`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Shadikabbo.com Logo"
      >
        <defs>
          {/* Gradients for Groom in rich navy */}
          <linearGradient id="groomGrad" x1="60" y1="20" x2="140" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2D3A8C" />
            <stop offset="50%" stopColor="#1E266D" />
            <stop offset="100%" stopColor="#141B4E" />
          </linearGradient>

          {/* Gradients for Bride in rich crimson red */}
          <linearGradient id="brideGrad" x1="100" y1="20" x2="170" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF2A42" />
            <stop offset="45%" stopColor="#D81124" />
            <stop offset="100%" stopColor="#A80A1A" />
          </linearGradient>

          <linearGradient id="ribbonGrad" x1="20" y1="90" x2="120" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E61A30" />
            <stop offset="100%" stopColor="#B50E1D" />
          </linearGradient>
        </defs>

        {/* --- COUPLE EMBLEM (Left) --- */}
        <g id="couple-symbol">
          {/* Back Red Swoosh / Ribbon curling from left */}
          <path
            d="M 65 92 C 30 92 10 115 15 132 C 19 146 36 156 55 153 C 78 149 105 130 115 106 C 98 108 78 103 65 92 Z"
            fill="url(#ribbonGrad)"
          />
          <path
            d="M 28 140 C 40 158 72 165 95 156 C 80 152 70 144 64 135 C 50 138 38 139 28 140 Z"
            fill="#B50E1D"
          />

          {/* Groom Head */}
          <circle cx="95" cy="42" r="16" fill="url(#groomGrad)" />

          {/* Groom Body (Navy curved figure) */}
          <path
            d="M 94 65 C 80 82 78 105 84 125 C 90 145 108 162 135 165 C 152 167 158 155 150 140 C 138 116 116 95 110 68 C 105 65 99 64 94 65 Z"
            fill="url(#groomGrad)"
          />

          {/* Bride Veil (Red fluttering behind bride) */}
          <path
            d="M 148 42 C 160 45 174 53 175 66 C 172 68 166 69 160 67 C 165 72 168 79 163 82 C 158 83 152 80 148 76 C 147 62 144 50 148 42 Z"
            fill="#C20E1F"
          />

          {/* Bride Head */}
          <circle cx="140" cy="46" r="13" fill="url(#brideGrad)" />

          {/* Bride Body & Dress (Graceful red curves) */}
          <path
            d="M 136 67 C 128 78 126 90 130 102 C 134 114 145 125 155 136 C 168 149 180 155 190 155 C 165 158 145 148 132 138 C 120 128 118 112 120 95 C 122 84 128 73 136 67 Z"
            fill="url(#brideGrad)"
          />

          {/* Bride Gown Swoop right-to-left */}
          <path
            d="M 152 118 C 168 130 188 138 200 145 C 182 158 152 168 122 165 C 140 152 148 136 152 118 Z"
            fill="#D81124"
          />

          {/* Connection Ribbon looping the couple */}
          <path
            d="M 112 88 C 118 80 132 78 138 86 C 144 94 140 106 128 112 C 118 110 114 98 112 88 Z"
            fill="none"
            stroke="#D81124"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* --- BRAND TYPOGRAPHY (Right) --- */}
        {showText && (
          <g id="brand-typography">
            {/* "SHADI" Wordmark */}
            <g fill="#181E54" transform="translate(220, 40)">
              {/* S */}
              <path d="M 38 4 C 18 4 6 15 6 28 C 6 42 20 48 35 52 C 48 55 52 59 52 65 C 52 73 43 78 28 78 C 14 78 4 72 0 66 L 2 54 C 8 61 17 67 28 67 C 38 67 43 62 43 56 C 43 45 28 41 15 37 C 3 33 0 25 0 17 C 0 6 12 0 35 0 C 47 0 55 4 58 8 L 54 20 C 49 14 42 4 38 4 Z" />
              
              {/* H */}
              <path d="M 72 2 L 82 2 L 82 34 L 112 34 L 112 2 L 122 2 L 122 76 L 112 76 L 112 44 L 82 44 L 82 76 L 72 76 Z" />
              
              {/* A */}
              <path d="M 148 2 L 164 2 L 194 76 L 183 76 L 176 58 L 150 58 L 143 76 L 132 76 Z M 153 50 L 173 50 L 163 24 Z" />
              
              {/* D */}
              <path d="M 205 2 L 228 2 C 248 2 260 14 260 39 C 260 64 248 76 228 76 L 205 76 Z M 215 12 L 215 66 L 226 66 C 241 66 249 57 249 39 C 249 21 241 12 226 12 Z" />
              
              {/* I */}
              <path d="M 272 2 L 282 2 L 282 76 L 272 76 Z" />
            </g>

            {/* "KABBO.COM" Wordmark */}
            <g fill="#D81124" transform="translate(222, 132)">
              <text
                x="0"
                y="26"
                fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif"
                fontWeight="800"
                fontSize="38"
                letterSpacing="4.5px"
              >
                KABBO.COM
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
