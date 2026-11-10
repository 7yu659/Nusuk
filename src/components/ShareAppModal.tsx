import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Globe, MessageCircle } from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (message: string, subMessage?: string) => void;
}

export const PUBLISHED_SITE_URL = 'https://quiz.nusuk.unlimited-key.fynex.site/';
export const FORMATTED_SHARE_TEXT = `নুসুক উমরাহ চ্যালেঞ্জ রেফারেল কোড লাইভ বোর্ড\nhttps://quiz.nusuk.unlimited-key.fynex.site/`;

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose, onToast }) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedUrlOnly, setCopiedUrlOnly] = useState(false);

  if (!isOpen) return null;

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(FORMATTED_SHARE_TEXT);
      setCopiedFull(true);
      onToast('ক্লিকযোগ্য লিঙ্ক কপি হয়েছে!', 'যেকোনো চ্যাট বা সোশ্যাল মিডিয়ায় পেস্ট করুন');
      setTimeout(() => setCopiedFull(false), 2400);
    } catch {
      onToast('কপি করতে সমস্যা হয়েছে', 'ম্যানুয়ালি সিলেক্ট করে কপি করুন');
    }
  };

  const handleCopyUrlOnly = async () => {
    try {
      await navigator.clipboard.writeText(PUBLISHED_SITE_URL);
      setCopiedUrlOnly(true);
      onToast('ডিরেক্ট লিঙ্ক কপি হয়েছে!', PUBLISHED_SITE_URL);
      setTimeout(() => setCopiedUrlOnly(false), 2400);
    } catch {
      onToast('কপি করতে সমস্যা হয়েছে', 'ম্যানুয়ালি সিলেক্ট করে কপি করুন');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'নুসুক উমরাহ চ্যালেঞ্জ রেফারেল কোড লাইভ বোর্ড',
          text: 'নুসুক উমরাহ চ্যালেঞ্জ রেফারেল কোড লাইভ বোর্ড\n',
          url: PUBLISHED_SITE_URL,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyFull();
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.584 1.777.92 2.791.92 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.768-5.769-5.768zm0 10.518c-.896 0-1.637-.249-2.383-.728l-.17-.109-1.77.464.472-1.724-.118-.188c-.524-.834-.801-1.554-.801-2.467 0-2.617 2.13-4.747 4.77-4.747 2.639 0 4.769 2.13 4.769 4.747 0 2.617-2.13 4.747-4.769 4.747z" />
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.984l-1.412 5.161 5.282-1.386c1.455.794 3.097 1.225 4.79 1.225h.004c5.505 0 9.988-4.478 9.989-9.985 0-2.668-1.039-5.176-2.926-7.062-1.886-1.887-4.394-2.925-7.067-2.921z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(FORMATTED_SHARE_TEXT)}`,
    },
    {
      name: 'Facebook',
      color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-sky-400 border-blue-500/30',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PUBLISHED_SITE_URL)}`,
    },
    {
      name: 'Telegram',
      color: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.195 1.006.128.83.942z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(PUBLISHED_SITE_URL)}&text=${encodeURIComponent('নুসুক উমরাহ চ্যালেঞ্জ রেফারেল কোড লাইভ বোর্ড')}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1c23] rounded-3xl border border-slate-200/90 dark:border-[#2b2f3b] shadow-2xl overflow-hidden p-5 z-10 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#252832]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-950/60 border border-blue-600/25 flex items-center justify-center text-[#0070e0] dark:text-sky-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100">
                লাইভ বোর্ড শেয়ার করুন
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                বন্ধুদের সাথে ক্লিকযোগ্য লিঙ্ক শেয়ার করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#252832] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-3.5">
          {/* Guaranteed Clickable Preview Box */}
          <div className="rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200/90 dark:border-[#262934] p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>ক্লিকযোগ্য হাইপারলিঙ্ক ফরম্যাট</span>
              </span>
              <span className="text-[10px] text-slate-400">পাবলিশড ডোমেইন</span>
            </div>

            <div className="font-mono text-xs sm:text-[13px] text-slate-800 dark:text-neutral-200 bg-white dark:bg-[#181a20] p-2.5 rounded-xl border border-slate-200/80 dark:border-[#2b2f3a] select-all leading-relaxed break-all">
              <div className="font-sans font-bold text-slate-900 dark:text-white mb-0.5">
                নুসুক উমরাহ চ্যালেঞ্জ রেফারেল কোড লাইভ বোর্ড
              </div>
              <div className="text-[#0070e0] dark:text-sky-400 underline decoration-blue-500/40">
                {PUBLISHED_SITE_URL}
              </div>
            </div>
          </div>

          {/* Action 1: Primary Copy Formatted Text Button */}
          <button
            onClick={handleCopyFull}
            className="w-full h-11 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#0070e0] hover:bg-[#0060c0] text-white shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
          >
            {copiedFull ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>কপি হয়েছে! পেস্ট করার জন্য প্রস্তুত</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[2.2]" />
                <span>সম্পূর্ণ বিবরণ ও লিঙ্ক কপি করুন</span>
              </>
            )}
          </button>

          {/* Action 2: Secondary Copy URL Only */}
          <button
            onClick={handleCopyUrlOnly}
            className="w-full h-9 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#20222a] dark:hover:bg-[#282a34] border border-slate-200 dark:border-[#2d303b] text-slate-700 dark:text-neutral-300 active:scale-98 transition-all cursor-pointer"
          >
            {copiedUrlOnly ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>শুধুমাত্র ডিরেক্ট লিঙ্ক কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>শুধুমাত্র সরাসরি লিঙ্ক কপি করুন</span>
              </>
            )}
          </button>

          {/* Social Quick Share Grid */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-2">
              সরাসরি সোশ্যাল মিডিয়ায় শেয়ার করুন:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {shareLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`h-9 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${item.color}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Device Share Button (if available) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>মোবাইল শেয়ার মেন্যু ওপেন করুন</span>
            </button>
          )}

          {/* Reassurance Note */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-sky-300 leading-relaxed">
            💡 <strong>ক্লিকযোগ্য লিঙ্ক নিশ্চয়তা:</strong> এটি ফেসবুক, হোয়াটসঅ্যাপ, টেলিগ্রাম বা যেকোনো কমেন্ট বক্সে পেস্ট করলে স্বয়ংক্রিয়ভাবে সরাসরি প্রবেশযোগ্য ব্লু-লিঙ্ক ও সমৃদ্ধ প্রিভিউ কার্ড তৈরি হবে।
          </div>
        </div>
      </div>
    </div>
  );
};
