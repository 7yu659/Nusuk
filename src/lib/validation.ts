import { Language } from '../types';

export function normalizeNusukCode(rawInput: string): string {
  if (!rawInput) return '';
  let cleaned = rawInput.trim();
  // If user entered without NG-, prefix it
  if (!cleaned.toUpperCase().startsWith('NG-') && !cleaned.toUpperCase().startsWith('NG')) {
    cleaned = 'NG-' + cleaned;
  } else if (cleaned.toUpperCase().startsWith('NG') && !cleaned.startsWith('NG-') && !cleaned.startsWith('ng-')) {
    cleaned = 'NG-' + cleaned.slice(2);
  }
  
  // Normalize prefix to uppercase NG-
  const parts = cleaned.split('-');
  if (parts.length >= 2) {
    return `NG-${parts.slice(1).join('-').trim()}`;
  }
  return cleaned;
}

export function validateNusukCode(rawInput: string): { isValid: boolean; normalized: string; errorKey?: string } {
  const normalized = normalizeNusukCode(rawInput);
  
  // Nusuk Referral codes typically have NG- prefix followed by 6 to 14 alphanumeric characters
  const regex = /^NG-[A-Za-z0-9]{6,14}$/;
  
  if (!regex.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorKey: 'errorInvalidFormat',
    };
  }
  
  return {
    isValid: true,
    normalized,
  };
}

// Convert numbers to Bengali digits if lang is 'bn'
export function formatNumber(num: number | string, lang: Language): string {
  const numStr = num.toString();
  if (lang !== 'bn') return numStr;
  
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return numStr.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

// Format relative elapsed time in Bengali or English (live second-by-second)
export function formatTimeAgo(isoString: string, lang: Language): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.max(1, Math.floor((now.getTime() - date.getTime()) / 1000));
  
  if (diffInSeconds < 60) {
    const secStr = formatNumber(diffInSeconds, lang);
    return lang === 'bn' ? `${secStr} সেকেন্ড আগে` : `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const minStr = formatNumber(diffInMinutes, lang);
    return lang === 'bn' ? `${minStr} মিনিট আগে` : `${diffInMinutes} min ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const hrStr = formatNumber(diffInHours, lang);
    return lang === 'bn' ? `${hrStr} ঘন্টা আগে` : `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  const dayStr = formatNumber(diffInDays, lang);
  return lang === 'bn' ? `${dayStr} দিন আগে` : `${diffInDays}d ago`;
}
