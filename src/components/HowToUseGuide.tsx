import React, { useState } from 'react';
import { InfoCircleIcon } from './Iconsax';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface HowToUseGuideProps {
  language: Language;
}

export const HowToUseGuide: React.FC<HowToUseGuideProps> = ({ language }) => {
  const t = translations[language];
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    { num: '1', title: t.step1Title, desc: t.step1Desc },
    { num: '2', title: t.step2Title, desc: t.step2Desc },
    { num: '3', title: t.step3Title, desc: t.step3Desc },
    { num: '4', title: t.step4Title, desc: t.step4Desc },
    { num: '5', title: t.step5Title, desc: t.step5Desc },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-5 py-1">
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-white/[0.05] p-3 shadow-2xs transition-colors duration-200">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
              <InfoCircleIcon size={14} color="currentColor" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {t.guideHeader}
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium">
            {isExpanded ? (language === 'bn' ? 'লুকান ▲' : 'Hide ▲') : (language === 'bn' ? 'কীভাবে ব্যবহার করবেন? ▼' : 'How to use? ▼')}
          </span>
        </div>

        {isExpanded && (
          <div className="mt-2.5 space-y-2 pt-2.5 border-t border-zinc-100 dark:border-white/[0.05]">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
              {steps.map((st) => (
                <div key={st.num} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {st.num}
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">{st.title}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5 leading-relaxed">
              * {t.guideNotice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
