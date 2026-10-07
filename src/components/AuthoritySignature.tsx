import React from 'react';

interface AuthoritySignatureProps {
  className?: string;
  color?: string;
  width?: number | string;
  height?: number | string;
}

export const AuthoritySignature: React.FC<AuthoritySignatureProps> = ({
  className = '',
  color = '#181E54',
  width = 150,
  height = 55,
}) => {
  return (
    <svg
      viewBox="0 0 360 150"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      aria-label="Official Authority Signature"
    >
      {/* 1. Left sharp acute flourish stroke (pointed spearhead) */}
      <path
        d="M 134 84 L 34 116 L 108 100"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Cursive name arches and rhythmic loops (Sohag) */}
      <path
        d="M 106 100 C 96 104 94 114 100 120 C 106 126 118 126 124 118 C 128 112 126 102 118 100 C 112 98 106 106 110 118 C 114 106 124 94 132 94 C 140 94 140 118 134 122 C 128 124 126 112 136 102 C 142 96 150 96 154 108 C 156 118 148 122 144 122 C 146 110 154 100 162 100 C 170 100 170 118 164 122 C 168 110 176 100 184 100 C 192 100 192 118 186 122 C 190 110 198 100 206 100 C 214 100 216 116 210 122 C 214 112 222 102 228 102 C 236 102 240 114 234 122"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Horizontal baseline grounding line under the cursive arches */}
      <path
        d="M 104 122 L 244 119"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* 4. Tall sharp ascender flourish (reaching up high like the photo) */}
      <path
        d="M 226 120 L 255 24 C 257 18 260 20 258 28 L 238 112 C 236 118 242 122 248 120 C 253 118 257 112 258 104 L 257 122"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 5. Decisive long strike-through slicing across the signature with end hook */}
      <path
        d="M 104 84 L 340 58 C 343 57.5 346 58 344 61 L 339 64"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
