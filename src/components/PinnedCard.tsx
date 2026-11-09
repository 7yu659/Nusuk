import React, { useState } from 'react';
import { Pin, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { NusukCode } from '../types';

interface PinnedCardProps {
  codeItem: NusukCode | null;
  onCopy: (id: string, code: string) => void;
  onOpenNusuk?: (code: string) => void;
}

export const PinnedCard: React.FC<PinnedCardProps> = ({
  codeItem,
  onCopy,
  onOpenNusuk,
}) => {
  const [copied, setCopied] = useState(false);

  // Default to NG-ElOBvwzz as explicitly requested by user
  const displayCode = codeItem?.code || 'NG-ElOBvwzz';
  const displayId = codeItem?.id || 'code-pinned-official';

  const handleCopyAndOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. Copy code to clipboard
    try {
      navigator.clipboard.writeText(displayCode);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }

    setCopied(true);
    onCopy(displayId, displayCode);

    // 2. Confetti particle celebration in Blue & Emerald combination
    try {
      confetti({
        particleCount: 22,
        spread: 45,
        origin: { y: 0.25 },
        colors: ['#0070e0', '#38bdf8', '#0ea5e9', '#60a5fa', '#10b981'],
      });
    } catch {
      // ignore
    }

    // 3. Directly open Nusuk app link: https://services.nusuk.sa/app?p=27&id=(code)
    const nusukUrl = `https://services.nusuk.sa/app?p=27&id=${encodeURIComponent(displayCode)}`;
    const link = document.createElement('a');
    link.href = nusukUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onOpenNusuk) {
      onOpenNusuk(displayCode);
    }

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-2">
      <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-3 sm:p-3.5 flex items-center justify-between gap-2.5 shadow-sm shadow-slate-900/5 dark:shadow-black/25 transition-colors">
        {/* Left: Pinned Tag + Code in Blue combination */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Pinned pill tag in Blue styling */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-sky-300 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
            <Pin className="w-3 h-3 text-blue-600 dark:text-sky-400 rotate-45 shrink-0" />
            <span>পিন্ড</span>
          </div>

          {/* Monospace Code: Animated characters in Blue theme */}
          <div className="font-mono text-base sm:text-lg font-bold tracking-wider text-blue-700 dark:text-sky-400 select-all truncate tabular-nums flex items-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={displayCode}
                className="flex items-center"
                initial={{ y: 8, opacity: 0, filter: 'blur(3px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -8, opacity: 0, filter: 'blur(3px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {displayCode.split('').map((char, index) => (
                  <motion.span
                    key={`${displayCode}-${index}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.015,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Only "কপি করুন" Button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={handleCopyAndOpen}
            title="কোড কপি করুন এবং নুসুক অ্যাপে যান"
            className={`h-9 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-[#242730] dark:hover:bg-[#2c303c] text-slate-800 dark:text-neutral-100 border border-slate-200/90 dark:border-[#363a48]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 stroke-[2.2]" />
                <span>কপি করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
