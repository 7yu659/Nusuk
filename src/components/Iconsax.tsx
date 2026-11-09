import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

// Iconsax: Key (Linear / Outline style)
export const KeyIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M10.7 12.3L19.5 3.5" />
    <path d="M16 7l3 3" />
    <path d="M14 9l1.5 1.5" />
    <circle cx="7.5" cy="15.5" r="1.5" fill={color} fillOpacity="0.25" stroke="none" />
  </svg>
);

// Iconsax: Copy (Dual sheet)
export const CopyIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="8" y="8" width="12" height="12" rx="3.5" />
    <path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2" />
  </svg>
);

// Iconsax: Open / Export (Angled external arrow)
export const OpenNusukIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M13 3h8v8" />
    <path d="M21 3l-9.5 9.5" />
    <path d="M19 13.5v5a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 18.5v-10A2.5 2.5 0 0 1 6.5 6H11" />
  </svg>
);

// Iconsax: Refresh (Smooth 360 circle arrow)
export const RefreshIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 12A10 10 0 1 1 18.87 4.93L22 8" />
    <path d="M22 2v6h-6" />
  </svg>
);

// Iconsax: Share (Curved node)
export const ShareIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98" />
    <path d="M15.41 6.51l-6.82 3.98" />
  </svg>
);

// Iconsax: Search (Linear glass)
export const SearchIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="11.5" cy="11.5" r="7.5" />
    <path d="M17 17l4.5 4.5" />
  </svg>
);

// Iconsax: Shield (Security / Admin)
export const ShieldIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 2l8 4.5v6.2c0 5.4-3.4 9.5-8 10.8-4.6-1.3-8-5.4-8-10.8V6.5L12 2z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// Iconsax: Tick Circle (Success / Check)
export const TickCircleIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 5-5" />
  </svg>
);

// Iconsax: Add / Plus
export const PlusIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

// Iconsax: Close
export const CloseIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

// Iconsax: User
export const UserIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
  </svg>
);

// Iconsax: Info Circle
export const InfoCircleIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v.01" />
    <path d="M12 11v5" />
  </svg>
);

// Iconsax: Help / Question
export const HelpCircleIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.8 2.8 0 0 1 5.3 1.2c0 1.9-2.8 2.2-2.8 4.3" />
    <circle cx="12" cy="17.5" r="0.8" fill={color} stroke="none" />
  </svg>
);

// Iconsax: Sparkles / Star
export const SparklesIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3z" />
  </svg>
);

// Iconsax: Sun / Moon
export const SunIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a6 6 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z" />
  </svg>
);

// Iconsax: Arrow Right / Next
export const ArrowRightIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

// Iconsax: Grid View & List View
export const GridViewIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </svg>
);

export const ListViewIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

// Iconsax: Heart / Community Impact
export const HeartIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);
