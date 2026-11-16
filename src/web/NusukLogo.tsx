import React from 'react';

export function NusukLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nusukMinimalGreen" x1="3" y1="3" x2="45" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16A34A" />
          <stop offset="1" stopColor="#14532D" />
        </linearGradient>
      </defs>
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="11.5"
        fill="url(#nusukMinimalGreen)"
        stroke="#BBF7D0"
        strokeWidth="1.6"
      />
      <path
        d="M15.5 33.5V21.5a8.5 8.5 0 0 1 17 0v12"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="19.25" r="3.25" fill="none" stroke="#DCFCE7" strokeWidth="2.4" />
      <path
        d="M24 22.5V33M24 29.5h3.5"
        fill="none"
        stroke="#DCFCE7"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AutoCodesIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        stroke="#14532D"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2,12 V10 a2,2 0 0 1 2,-2 H16 a2,2 0 0 1 2,2 V12 a2,2 0 0 0 0,4 V18 a2,2 0 0 1 -2,2 H4 a2,2 0 0 1 -2,-2 V16 a2,2 0 0 0 0,-4 Z"
      />
      <path
        stroke="#14532D"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M12,10.5 v1 M12,13.5 v1 M12,16.5 v1"
      />
      <path
        stroke="#16A34A"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M19.5,1.8 L20.4,4.1 L22.7,5 L20.4,5.9 L19.5,8.2 L18.6,5.9 L16.3,5 L18.6,4.1 Z"
      />
    </svg>
  );
}

export function AutoQuizIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        stroke="#14532D"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6,21 V10 a6,6 0 0 1 12,0 V21 M3,21 H21"
      />
      <path
        stroke="#14532D"
        strokeWidth="2"
        strokeLinecap="round"
        d="M15,15 h0.01"
      />
      <path
        stroke="#16A34A"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M21,1.6 L21.8,3.6 L23.8,4.4 L21.8,5.2 L21,7.2 L20.2,5.2 L18.2,4.4 L20.2,3.6 Z"
      />
    </svg>
  );
}
