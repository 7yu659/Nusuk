import React, { useState } from 'react';
import { Flag, CheckCircle } from 'lucide-react';
import { CloseIcon } from './Iconsax';
import { Language, NusukCode } from '../types';
import { translations } from '../lib/i18n';
import { submitReport } from '../lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  codeItem: NusukCode | null;
  onReportSubmitted: (id: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  language,
  codeItem,
  onReportSubmitted,
}) => {
  const t = translations[language];

  const [reason, setReason] = useState<string>('invalid');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !codeItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await submitReport(codeItem.id, reason, details);
    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
      onReportSubmitted(codeItem.id);
      setTimeout(() => {
        handleClose();
      }, 1400);
    }
  };

  const handleClose = () => {
    setReason('invalid');
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  const reasons = [
    { id: 'invalid', label: t.reportReasonInvalid },
    { id: 'duplicate', label: t.reportReasonDuplicate },
    { id: 'spam', label: t.reportReasonSpam },
    { id: 'inappropriate', label: t.reportReasonInappropriate },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white dark:bg-[#0b0c10] border border-zinc-200/80 dark:border-white/[0.08] shadow-xl overflow-hidden z-10 transition-colors">
        <div className="w-8 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-2.5 sm:hidden" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Flag className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.reportTitle}</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.reportSubtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="p-4">
          {submitted ? (
            <div className="py-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-zinc-800 dark:text-zinc-300 max-w-xs mx-auto leading-relaxed">
                {t.reportSuccess}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-[#07080b] border border-zinc-200/80 dark:border-white/[0.08]">
                <span className="text-[9px] text-zinc-400 uppercase block font-semibold tracking-wider">TARGET KEY</span>
                <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-200 tracking-wider">{codeItem.code}</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  {language === 'bn' ? 'রিপোর্টের কারণ নির্বাচন করুন:' : 'Select reason:'}
                </label>
                {reasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                      reason === r.id
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-white/[0.15] text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/70 dark:border-white/[0.05] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="accent-zinc-900 dark:accent-zinc-100"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t.reportNotePlaceholder}
                  rows={2}
                  className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-[#07080b] border border-zinc-200/80 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-medium text-xs border border-zinc-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Flag className="w-3 h-3" />
                  <span>{t.reportSubmitBtn}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
