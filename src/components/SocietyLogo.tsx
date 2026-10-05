import React from 'react';

interface SocietyLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  variant?: 'full' | 'icon' | 'badge';
}

export function SocietyLogo({
  size = 36,
  className = '',
  showText = false,
  textColor = 'currentColor',
  subtextColor = '#64748b',
  variant = 'full',
}: SocietyLogoProps) {
  const pixelSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;
  const iconSize = pixelSize;

  const logoSvg = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="society-logo-icon-svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="societyShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="45%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="societyHouseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="societySPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* Outer Shield with vibrant teal to emerald gradient */}
      <path
        d="M 50 12 L 81 23 C 85 24.5 87 28 87 32.5 L 87 56 C 87 71 71 85.5 50 91.5 C 29 85.5 13 71 13 56 L 13 32.5 C 13 28 15 24.5 19 23 Z"
        stroke="url(#societyShieldGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* House Roof / Chevron Shape */}
      <path
        d="M 28 47 L 50 30 L 72 47"
        stroke="url(#societyHouseGrad)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Central Cyan Pin / Keyhole Dot & Stem */}
      <circle cx="50" cy="46" r="3.6" fill="#38bdf8" />
      <line
        x1="50"
        y1="49"
        x2="50"
        y2="58"
        stroke="#38bdf8"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Flowing 'S' Security / Smart Ribbon Path */}
      <path
        d="M 39 49 C 35 52 34 57 37 60 C 41 64 57 62 62 68 C 66 73 63 78 57 80 C 49 82 43 78 44 71"
        stroke="url(#societySPathGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (!showText && variant === 'icon') {
    return <span className={`society-logo-wrapper ${className}`}>{logoSvg}</span>;
  }

  if (!showText) {
    return logoSvg;
  }

  return (
    <div className={`society-logo-brand ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {logoSvg}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontWeight: 800, fontSize: pixelSize * 0.52, color: textColor, letterSpacing: '-0.02em' }}>
          SmartNest
        </span>
        <span style={{ fontSize: Math.max(9, pixelSize * 0.28), color: subtextColor, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Smart Community
        </span>
      </div>
    </div>
  );
}

export default SocietyLogo;
