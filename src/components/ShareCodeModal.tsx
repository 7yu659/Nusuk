import React, { useState } from 'react';
import { X, Gift, Clipboard, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, NusukCode } from '../types';
import { validateNusukCode } from '../lib/validation';
import { submitNewCode } from '../lib/api';

interface ShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccess: (newCode: NusukCode) => void;
}

export const ShareCodeModal: React.FC<ShareCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        let clean = text.trim().toUpperCase();
        // Extract code if user pasted a full URL or text containing NG-
        const match = clean.match(/NG-[A-Z0-9]{6,12}/i);
        if (match) {
          clean = match[0].toUpperCase();
        }
        setCode(clean);
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 1500);
      }
    } catch {
      // If clipboard read permission fails, focus input
      const input = document.getElementById('referral-code-input');
      input?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const valResult = validateNusukCode(code);
    if (!valResult.isValid) {
      setErrorMessage('সঠিক ফরম্যাটে কোড দিন (যেমন: NG-K8M92PQX)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitNewCode(valResult.normalized, 'ব্যবহারকারী', '');
      if (!res.success) {
        if (res.error === 'errorDuplicateCode') {
          setErrorMessage('এই কোডটি ইতোমধ্যে শেয়ার করা হয়েছে।');
        } else {
          setErrorMessage('সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.5 },
          colors: ['#c28424', '#e0b467', '#10b981'],
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        if (res.code) {
          onSuccess(res.code);
        }
        handleClose();
      }, 1200);
    } catch {
      setErrorMessage('সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setErrorMessage(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Modal Container matching screenshot exactly */}
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#1e1c18] border border-slate-200 dark:border-[#38332a] shadow-2xl overflow-hidden z-10 transition-colors p-5 sm:p-6">
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-neutral-600 rounded-full mx-auto -mt-1 mb-3 sm:hidden" />

        {/* Header: রেফারেল কি শেয়ার করুন + ✕ */}
        <div className="flex items-center justify-between gap-3 pb-2">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            রেফারেল কি শেয়ার করুন
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle: কোনো নাম লাগবে না, শুধুমাত্র নুসুক রেফারেল কোডটি দিন। */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#a39c8e] mb-4 font-normal">
          কোনো নাম লাগবে না, শুধুমাত্র নুসুক রেফারেল কোডটি দিন।
        </p>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-neutral-100">
              কোড সফলভাবে শেয়ার হয়েছে!
            </h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-xs mx-auto">
              আপনার কোডটি লাইভ বোর্ডে যুক্ত করা হয়েছে।
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Blue Benefit Box: কোড দিলে আপনার কী লাভ? */}
            <div className="rounded-2xl bg-blue-50/70 dark:bg-[#132238] border border-blue-200/90 dark:border-[#1d3d66] p-3.5 sm:p-4 flex items-start gap-3 shadow-xs">
              {/* Gift Icon Box */}
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-[#1a2f4d] border border-blue-200 dark:border-[#20446e] text-[#0070e0] dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-5 h-5" />
              </div>

              {/* Text Content */}
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-blue-900 dark:text-sky-300 tracking-tight mb-1">
                  কোড দিলে আপনার কী লাভ?
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-normal">
                  আপনার শেয়ার করা কোডটি লাইভ বোর্ডে সবার উপরে যুক্ত হবে। প্রতিদিন হাজারো হাজি ও উমরাহযাত্রী এখান থেকে কোড নিচ্ছেন; তারা আপনার কোড ব্যবহার করলেই আপনি নুসুক অ্যাপে সরাসরি রেফারেল রিওয়ার্ড ও পয়েন্ট পাবেন!
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Input Label Row: নুসুক রেফারেল কি (Nusuk Referral Code) *  and  📋 পেস্ট করুন */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="referral-code-input"
                  className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200"
                >
                  নুসুক রেফারেল কি (Nusuk Referral Code) <span className="text-blue-500">*</span>
                </label>

                {/* Paste Button */}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>{pasteNotice ? 'পেস্ট হয়েছে ✓' : 'পেস্ট করুন'}</span>
                </button>
              </div>

              {/* Inset Code Input Well */}
              <input
                id="referral-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="যেমন: NG-K8M92PQX"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-[#121315] border border-slate-300 dark:border-[#33312c] text-slate-900 dark:text-neutral-100 font-mono text-base sm:text-lg font-bold placeholder-slate-400 dark:placeholder-[#6b6357] focus:outline-none focus:border-blue-500 tracking-wider uppercase transition-colors"
                autoComplete="off"
                required
              />
            </div>

            {/* Footer Row: বাতিল  and  ১-ক্লিকে জমা দিন */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/25"
              >
                {isSubmitting ? 'জমা হচ্ছে...' : '১-ক্লিকে জমা দিন'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
