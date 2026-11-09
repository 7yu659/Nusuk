import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { CloseIcon } from './Iconsax';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  type: 'benefit' | 'notWorking';
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  language,
  type,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  const isBenefit = type === 'benefit';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#1e1c18] border border-slate-200 dark:border-[#38332a] shadow-2xl overflow-hidden z-10 transition-colors p-5 sm:p-6">
        <div className="w-10 h-1 bg-slate-300 dark:bg-neutral-600 rounded-full mx-auto -mt-1 mb-3 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#332f26]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isBenefit
                  ? 'bg-emerald-50 dark:bg-[#182b24] border-emerald-200 dark:border-[#245242] text-emerald-700 dark:text-[#34d399]'
                  : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-sky-400'
              }`}
            >
              {isBenefit ? <HelpCircle className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              {isBenefit ? t.benefitTitle : t.notWorkingTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="py-4 space-y-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-neutral-300 leading-relaxed">
          {isBenefit ? (
            <>
              <p className="p-3 rounded-2xl bg-slate-50 dark:bg-[#141517] border border-slate-200/80 dark:border-[#2d303b]">
                {t.benefitP1}
              </p>
              <p className="p-3 rounded-2xl bg-slate-50 dark:bg-[#141517] border border-slate-200/80 dark:border-[#2d303b]">
                {t.benefitP2}
              </p>
              <p className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-[#162720] border border-emerald-200 dark:border-[#235342] text-emerald-900 dark:text-[#34d399] font-medium">
                {t.benefitP3}
              </p>
            </>
          ) : (
            <>
              <p className="p-3 rounded-2xl bg-slate-50 dark:bg-[#141517] border border-slate-200/80 dark:border-[#2d303b]">
                {t.notWorkingP1}
              </p>
              <p className="p-3 rounded-2xl bg-slate-50 dark:bg-[#141517] border border-slate-200/80 dark:border-[#2d303b]">
                {t.notWorkingP2}
              </p>
              <p className="p-3 rounded-2xl bg-slate-50 dark:bg-[#141517] border border-slate-200/80 dark:border-[#2d303b]">
                {t.notWorkingP3}
              </p>
              <p className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-sky-300 font-medium">
                {t.notWorkingP4}
              </p>
            </>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-500/20"
          >
            {t.closeModalBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
