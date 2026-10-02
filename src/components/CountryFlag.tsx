import React from 'react';

export interface CountryCodeOption {
  code: string;
  iso: string;
  name: string;
  placeholder: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+880', iso: 'bd', name: 'Bangladesh', placeholder: '017XXXXXXXX' },
  { code: '+91', iso: 'in', name: 'India', placeholder: '98765 43210' },
  { code: '+92', iso: 'pk', name: 'Pakistan', placeholder: '300 1234567' },
  { code: '+966', iso: 'sa', name: 'Saudi Arabia', placeholder: '50 123 4567' },
  { code: '+971', iso: 'ae', name: 'UAE (Dubai)', placeholder: '50 123 4567' },
  { code: '+60', iso: 'my', name: 'Malaysia', placeholder: '12-345 6789' },
  { code: '+974', iso: 'qa', name: 'Qatar', placeholder: '3312 3456' },
  { code: '+965', iso: 'kw', name: 'Kuwait', placeholder: '9123 4567' },
  { code: '+968', iso: 'om', name: 'Oman', placeholder: '9123 4567' },
  { code: '+973', iso: 'bh', name: 'Bahrain', placeholder: '3600 1234' },
  { code: '+44', iso: 'gb', name: 'United Kingdom', placeholder: '7123 456789' },
  { code: '+1', iso: 'us', name: 'United States', placeholder: '(555) 123-4567' },
  { code: '+1', iso: 'ca', name: 'Canada', placeholder: '(555) 123-4567' },
  { code: '+61', iso: 'au', name: 'Australia', placeholder: '412 345 678' },
  { code: '+39', iso: 'it', name: 'Italy', placeholder: '312 345 6789' },
  { code: '+65', iso: 'sg', name: 'Singapore', placeholder: '8123 4567' },
  { code: '+49', iso: 'de', name: 'Germany', placeholder: '151 12345678' },
  { code: '+33', iso: 'fr', name: 'France', placeholder: '6 12 34 56 78' },
  { code: '+81', iso: 'jp', name: 'Japan', placeholder: '90 1234 5678' },
  { code: '+82', iso: 'kr', name: 'South Korea', placeholder: '10 1234 5678' },
  { code: '+90', iso: 'tr', name: 'Turkey', placeholder: '501 234 5678' },
  { code: '+20', iso: 'eg', name: 'Egypt', placeholder: '10 1234 5678' },
  { code: '+27', iso: 'za', name: 'South Africa', placeholder: '71 123 4567' },
];

export function detectCountryIso(phoneNumber?: string): string {
  if (!phoneNumber) return 'bd';
  const clean = phoneNumber.trim();
  if (clean.startsWith('01') || clean.startsWith('880') || clean.startsWith('+880')) return 'bd';
  const matched = COUNTRY_CODES.find((c) => clean.startsWith(c.code));
  return matched ? matched.iso : 'bd';
}

interface CountryFlagProps {
  iso: string;
  name?: string;
  className?: string;
}

/**
 * Authentic visual national flag renderer.
 * Built-in vector flags for instant zero-latency rendering across all devices,
 * with high-definition FlagCDN support for international flags.
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({
  iso,
  name = 'Country Flag',
  className = 'w-6 h-4',
}) => {
  const code = (iso || 'bd').toLowerCase();

  // 1. Bangladesh: Deep green (#006a4e) with red circular sun (#f42a41)
  if (code === 'bd') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-emerald-950/30 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect width="20" height="12" fill="#006a4e" />
          <circle cx="9" cy="6" r="4.2" fill="#f42a41" />
        </svg>
      </span>
    );
  }

  // 2. India: Saffron, White with Ashoka Chakra, Green
  if (code === 'in') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-slate-300 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect width="20" height="4" fill="#FF9933" />
          <rect y="4" width="20" height="4" fill="#FFFFFF" />
          <rect y="8" width="20" height="4" fill="#138808" />
          <circle cx="10" cy="6" r="1.6" fill="#000080" />
        </svg>
      </span>
    );
  }

  // 3. Pakistan: White vertical stripe & Green with Crescent
  if (code === 'pk') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-emerald-900/30 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect width="5" height="12" fill="#FFFFFF" />
          <rect x="5" width="15" height="12" fill="#01411C" />
          <circle cx="13" cy="6" r="3.2" fill="#FFFFFF" />
          <circle cx="14" cy="5.4" r="2.8" fill="#01411C" />
        </svg>
      </span>
    );
  }

  // 4. Saudi Arabia: Green field with white sword
  if (code === 'sa') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-emerald-900/30 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect width="20" height="12" fill="#006C35" />
          <path d="M4 6h12M7 5l-2 1 2 1" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
        </svg>
      </span>
    );
  }

  // 5. UAE: Red vertical bar with Green, White, Black horizontal bands
  if (code === 'ae') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-slate-300 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect x="5" width="15" height="4" fill="#00732F" />
          <rect x="5" y="4" width="15" height="4" fill="#FFFFFF" />
          <rect x="5" y="8" width="15" height="4" fill="#000000" />
          <rect width="5" height="12" fill="#FF0000" />
        </svg>
      </span>
    );
  }

  // 6. United Kingdom: Union Jack
  if (code === 'gb') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-slate-300 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect width="20" height="12" fill="#012169" />
          <path d="M0 0l20 12M20 0L0 12" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M0 0l20 12M20 0L0 12" stroke="#C8102E" strokeWidth="1.2" />
          <path d="M10 0v12M0 6h20" stroke="#FFFFFF" strokeWidth="4" />
          <path d="M10 0v12M0 6h20" stroke="#C8102E" strokeWidth="2.4" />
        </svg>
      </span>
    );
  }

  // 7. United States: Stars and Stripes
  if (code === 'us') {
    return (
      <span
        title={name}
        className={`inline-flex shrink-0 overflow-hidden rounded-xs border border-slate-300 shadow-2xs ${className}`}
      >
        <svg viewBox="0 0 20 12" className="w-full h-full block">
          <rect width="20" height="12" fill="#B22234" />
          <path d="M0 1h20M0 3h20M0 5h20M0 7h20M0 9h20M0 11h20" stroke="#FFFFFF" strokeWidth="1" />
          <rect width="8" height="6" fill="#3C3B6E" />
          <circle cx="2" cy="2" r="0.6" fill="#FFFFFF" />
          <circle cx="4" cy="2" r="0.6" fill="#FFFFFF" />
          <circle cx="6" cy="2" r="0.6" fill="#FFFFFF" />
          <circle cx="3" cy="4" r="0.6" fill="#FFFFFF" />
          <circle cx="5" cy="4" r="0.6" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  // High-definition FlagCDN for all other countries
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={`${name} Flag`}
      loading="lazy"
      className={`inline-flex shrink-0 object-cover rounded-xs border border-slate-300 shadow-2xs ${className}`}
    />
  );
};
