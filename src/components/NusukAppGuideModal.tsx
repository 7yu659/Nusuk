import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { CopyIcon, CloseIcon } from './Iconsax';
import { Language } from '../types';
import { translations } from '../lib/i18n';

interface NusukAppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  selectedCode: string | null;
}

export const NusukAppGuideModal: React.FC<NusukAppGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  selectedCode,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (selectedCode) {
      navigator.clipboard.writeText(selectedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    { title: t.step1Title, desc: t.step1Desc },
    { title: t.step2Title, desc: t.step2Desc },
    { title: t.step3Title, desc: t.step3Desc },
    { title: t.step4Title, desc: t.step4Desc },
    { title: t.step5Title, desc: t.step5Desc },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#1e1c18] border border-slate-200 dark:border-[#38332a] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transition-colors p-5 sm:p-6">
        <div className="w-10 h-1 bg-slate-300 dark:bg-neutral-600 rounded-full mx-auto -mt-1 mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#332f26] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#132238] border border-blue-200 dark:border-[#1d3d66] flex items-center justify-center text-[#0070e0] dark:text-sky-400">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100 tracking-tight">{t.appGuideTitle}</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#a39c8e]">{t.appGuideSub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 overflow-y-auto space-y-3">
          {/* Active Copied Code Highlight Box */}
          {selectedCode && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-[#132238] border border-blue-200/80 dark:border-[#1d3d66] flex items-center justify-between gap-2.5">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block tracking-wider">
                  SELECTED REFERRAL KEY
                </span>
                <span className="font-mono text-base sm:text-lg font-bold text-blue-700 dark:text-sky-400 tracking-wider">
                  {selectedCode}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="h-8 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#242730] dark:hover:bg-[#2c303c] border border-slate-200 dark:border-[#363a48] text-[11px] font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon size={12} color="currentColor" />
                )}
                <span>{copied ? t.copiedText : t.copyBtn}</span>
              </button>
            </div>
          )}

          {/* Timeline Steps */}
          <div className="space-y-2">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#141517] border border-slate-200/80 dark:border-[#2d303b]"
              >
                <div className="w-5.5 h-5.5 rounded-full bg-blue-100 dark:bg-[#1a2f4d] text-blue-700 dark:text-sky-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-blue-200 dark:border-[#20446e]">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100">{st.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-relaxed mt-0.5">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Safety Notice */}
          <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-[#132238] border border-sky-200/80 dark:border-[#1d3d66] text-[11px] text-sky-900 dark:text-sky-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t.guideNotice}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#332f26] flex items-center gap-2 shrink-0">
          <a
            href={selectedCode ? `https://services.nusuk.sa/app?p=27&id=${encodeURIComponent(selectedCode)}` : 'https://services.nusuk.sa'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-10 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 text-center shadow-sm shadow-blue-500/20 transition-all active:scale-95"
          >
            <span>{t.openNusukAppBtn}</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.8]" />
          </a>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#242730] dark:hover:bg-[#2c303c] text-slate-700 dark:text-neutral-300 font-medium text-xs border border-slate-200 dark:border-[#363a48] transition-colors cursor-pointer"
          >
            {t.closeModalBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
