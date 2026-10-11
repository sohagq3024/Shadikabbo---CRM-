import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const heightMap: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-8',
  md: 'h-11',
  lg: 'h-16',
  xl: 'h-24',
};

/**
 * Shared official brand mark. The image is served from the public directory so
 * it is available on unauthenticated screens and to the scanner before login.
 */
export const ShadikabboLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText: _showText = true,
}) => (
  <span className={`inline-flex items-center select-none ${className}`}>
    <img
      src="/shadikabbo-logo.png"
      alt="Shadikabbo.com"
      className={`${heightMap[size]} w-auto max-w-full object-contain`}
      draggable={false}
    />
  </span>
);
