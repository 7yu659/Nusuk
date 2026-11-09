import React from 'react';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface HadithBannerProps {
  language: Language;
}

export const HadithBanner: React.FC<HadithBannerProps> = ({ language }) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 pt-2 pb-0.5">
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-white/[0.04] py-1.5 px-3 sm:px-4 text-center transition-colors duration-200">
        <p className="text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
          <span className="font-medium text-emerald-700 dark:text-emerald-400 mr-1.5">
            {language === 'bn' ? 'রাসূলুল্লাহ (সা.) বলেছেন:' : 'The Prophet (pbuh) said:'}
          </span>
          <span>{t.hadithQuote}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1.5">({t.hadithSource})</span>
        </p>
      </div>
    </div>
  );
};
