import React, { useState } from 'react';
import { Share2, Shield, Sun, Moon, Plus, Check } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenShareModal: () => void;
  onOpenAdminModal: () => void;
  onOpenShareAppModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isDarkMode,
  onThemeToggle,
  onRefresh,
  isRefreshing,
  onOpenShareModal,
  onOpenAdminModal,
  onOpenShareAppModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-[#131418]/95 border-b border-slate-200/90 dark:border-[#22242b] shadow-2xs transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand Icon + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8.5 h-8.5 rounded-xl bg-blue-600/10 dark:bg-blue-950/60 border border-blue-600/25 dark:border-blue-800/60 flex items-center justify-center shrink-0 text-[#0070e0] dark:text-sky-400 shadow-xs">
            {/* Nusuk / Quran Layered Sheets Icon */}
            <svg
              className="w-4.5 h-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-neutral-100 truncate flex items-center gap-1">
              <span>নুসুক কি ...</span>
            </h1>
          </div>
        </div>

        {/* Right: Actions (Share, Admin Panel, Sun/Moon Theme Toggle, + কোড দিন) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Share App Button */}
          <button
            onClick={onOpenShareAppModal}
            title="শেয়ার করুন"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1c1e24] dark:hover:bg-[#252831] border border-slate-200/90 dark:border-[#2d313d] text-slate-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="শেয়ার করুন"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Admin Panel Button (Replacing Download Icon) */}
          <button
            onClick={onOpenAdminModal}
            title="এডমিন প্যানেল (ম্যানেজমেন্ট ও কাস্টমাইজেশন)"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1c1e24] dark:hover:bg-[#252831] border border-slate-200/90 dark:border-[#2d313d] text-slate-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="এডমিন প্যানেল"
          >
            <Shield className="w-3.5 h-3.5 text-[#0070e0] dark:text-sky-400 stroke-[2.2]" />
          </button>

          {/* Day / Night Theme Toggle */}
          <button
            onClick={onThemeToggle}
            title={isDarkMode ? 'লাইট মোড চালু করুন (Day Mode)' : 'ডার্ক মোড চালু করুন (Night Mode)'}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1c1e24] dark:hover:bg-[#252831] border border-slate-200/90 dark:border-[#2d313d] text-slate-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="থিম পরিবর্তন"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-sky-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Primary CTA: + কোড দিন in Solid Single Blue (এক কালার সম্পূর্ণ নীল) */}
          <button
            onClick={onOpenShareModal}
            className="h-8.5 px-3.5 sm:px-4 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
            <span className="whitespace-nowrap font-bold">কোড দিন</span>
          </button>
        </div>
      </div>
    </header>
  );
};

