import React from 'react';
import { KeyIcon, PlusIcon, InfoCircleIcon, HeartIcon } from './Iconsax';
import { Language } from '../types';
import { translations } from '../lib/i18n';

export type NavTab = 'home' | 'codes' | 'activity' | 'help';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenShareModal: () => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenShareModal,
  language,
}) => {
  const t = translations[language];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md border-t border-zinc-200/70 dark:border-white/[0.06] px-2 py-0.5 transition-colors duration-200">
      <div className="grid grid-cols-5 items-center h-11 max-w-sm mx-auto">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'home'
              ? 'text-zinc-950 dark:text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] mt-0.5">{t.navHome}</span>
        </button>

        {/* Codes */}
        <button
          onClick={() => onTabChange('codes')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'codes'
              ? 'text-zinc-950 dark:text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <KeyIcon size={15} />
          <span className="text-[10px] mt-0.5">{t.navCodes}</span>
        </button>

        {/* Center Share Button - Slim & Clean */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenShareModal}
            className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 text-white dark:text-zinc-950 shadow-xs flex items-center justify-center active:scale-95 transition-transform cursor-pointer -mt-2 border-2 border-white dark:border-[#07090e]"
            aria-label="Share key"
          >
            <PlusIcon size={16} color="currentColor" />
          </button>
        </div>

        {/* Activity */}
        <button
          onClick={() => onTabChange('activity')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'activity'
              ? 'text-zinc-950 dark:text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <HeartIcon size={15} />
          <span className="text-[10px] mt-0.5">{t.navActivity}</span>
        </button>

        {/* Help */}
        <button
          onClick={() => onTabChange('help')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'help'
              ? 'text-zinc-950 dark:text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <InfoCircleIcon size={15} />
          <span className="text-[10px] mt-0.5">{t.navHelp}</span>
        </button>
      </div>
    </nav>
  );
};
