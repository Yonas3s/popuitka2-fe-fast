import { useId } from 'react';

type BrandIconProps = {
  className?: string;
  title?: string;
};

export const BrandIcon = ({ className, title = 'unit-labs' }: BrandIconProps) => {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title} focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#49e0c9" />
          <stop offset="52%" stopColor="#7ea6ff" />
          <stop offset="100%" stopColor="#ffb36a" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="rgba(9, 16, 30, 0.75)" />
      <path
        d="M18 18v21.5c0 7.46 6.04 13.5 13.5 13.5S45 46.96 45 39.5V18"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44.5" cy="19.5" r="3.5" fill={`url(#${gradientId})`} />
    </svg>
  );
};
