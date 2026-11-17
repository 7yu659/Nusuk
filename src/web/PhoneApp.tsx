import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  ExternalLink,
  Globe,
  HelpCircle,
  Mail,
  MessageCircle,
  Plus,
  Settings,
  Share2,
  Users,
} from 'lucide-react';
import { AutoCodesIcon, AutoQuizIcon, NusukLogo } from './NusukLogo';
import { fmtNum, t, toBnDigits } from './i18n';
import type {
  AutomationMode,
  DayStat,
  Lang,
  NoticeItem,
  OverlayState,
  PermissionState,
  ScreenId,
} from './types';

interface PhoneAppProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  screen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  permissions: PermissionState;
  onFixPermission: (key: keyof PermissionState) => void;
  codesToday: number;
  quizToday: number;
  codesTotal: number;
  quizTotal: number;
  dayStats: DayStat[];
  paceNormal: boolean;
  onPaceModeChange: (normal: boolean) => void;
  minSec: number;
  maxSec: number;
  onRangeChange: (min: number, max: number) => void;
  overlay: OverlayState;
  onLaunchMode: (mode: AutomationMode) => void;
  onStopRunning: () => void;
  notices: NoticeItem[];
  onClearNotices: () => void;
  onMarkNoticesRead: () => void;
  onToast: (message: string) => void;
  onKeysSubmitted: (addedCount: number) => void;
}

const VALID_KEY_RE = /(?<![A-Za-z0-9])NG-[A-Za-z0-9]{8}(?![A-Za-z0-9])/gi;
const LOOKS_LIKE_KEY_RE = /^NG-?[A-Za-z0-9-]*$/i;

export function PhoneApp({
  lang,
  onLangChange,
  screen,
  onNavigate,
  permissions,
  onFixPermission,
  codesToday,
  quizToday,
  codesTotal,
  quizTotal,
  dayStats,
  paceNormal,
  onPaceModeChange,
  minSec,
  maxSec,
  onRangeChange,
  overlay,
  onLaunchMode,
  onStopRunning,
  notices,
  onClearNotices,
  onMarkNoticesRead,
  onToast,
  onKeysSubmitted,
}: PhoneAppProps) {
  const [keysInput, setKeysInput] = useState('NG-p36wAxup\nNG-9kLm2QrT\nNG-bad');
  const [parseResult, setParseResult] = useState<{
    added: string[];
    duplicate: string[];
    invalid: string[];
  } | null>(null);
  const [knownKeys, setKnownKeys] = useState(() => new Set<string>(['NG-9KLM2QRT']));
  const [avatarFailed, setAvatarFailed] = useState(false);

  const unreadCount = notices.filter((n) => n.unread).length;
  const allPermsReady =
    permissions.nusukInstalled &&
    permissions.accessibilityEnabled &&
    permissions.overlayAllowed;

  const handleOpenNotifications = () => {
    onMarkNoticesRead();
    onNavigate('notifications');
  };

  const handleShareApp = () => {
    const shareUrl = 'https://www.facebook.com/share/1CnXaXQFoL/';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    onToast(
      lang === 'bn'
        ? `অ্যান্ড্রয়েডে সরাসরি APK বা এই লিংক শেয়ার হবে: ${shareUrl}`
        : `Android shares the APK directly, or this link: ${shareUrl}`,
    );
  };

  const handleParseAndAddKeys = () => {
    const normalized = keysInput.replace(/[\u2010-\u2015\u2212]/g, '-');
    const tokens = normalized.split(/[\s,;|]+/);
    const seen = new Set<string>();
    const badSeen = new Set<string>();
    const validKeys: string[] = [];
    const duplicate: string[] = [];
    const invalid: string[] = [];

    for (const rawTok of tokens) {
      const tok = rawTok.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9-]+$/g, '');
      if (!tok) continue;
      const matches = tok.match(VALID_KEY_RE);
      if (matches && matches.length > 0) {
        for (const m of matches) {
          const canonical = 'NG-' + m.slice(3);
          const lower = canonical.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            validKeys.push(canonical);
          } else {
            duplicate.push(canonical);
          }
        }
      } else if (tok.length >= 3 && LOOKS_LIKE_KEY_RE.test(tok) && !badSeen.has(tok)) {
        badSeen.add(tok);
        invalid.push(tok);
      }
    }

    if (validKeys.length === 0 && invalid.length === 0) {
      setParseResult({ added: [], duplicate: [], invalid: [] });
      onToast(t(lang, 'No codes found in the text. A code looks like NG-p36wAxup.'));
      return;
    }

    const added: string[] = [];
    const nextKnown = new Set(knownKeys);
    for (const k of validKeys) {
      if (nextKnown.has(k.toUpperCase())) {
        duplicate.push(k);
      } else {
        nextKnown.add(k.toUpperCase());
        added.push(k);
      }
    }

    setKnownKeys(nextKnown);
    setParseResult({ added, duplicate, invalid });
    if (added.length > 0) {
      onKeysSubmitted(added.length);
      setKeysInput('');
    }
  };

  // Sub-screen Top Bar (activity_screen.xml)
  if (screen !== 'home') {
    const titles: Record<Exclude<ScreenId, 'home'>, string> = {
      stats: 'Statistics',
      settings: 'Settings',
      notifications: 'Notifications',
      addKeys: 'Add your own codes',
      developer: 'About developer',
      help: 'Help & guides',
    };

    return (
      <div className="flex flex-col h-full min-h-[640px] bg-[#F7F7F7] text-[#18181B]">
        <div className="hero-gradient px-3 pt-2.5 pb-3 flex items-center gap-3 text-white shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label={t(lang, 'Back')}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="flex-1 text-[19px] font-medium truncate">
            {t(lang, titles[screen])}
          </h2>
          {screen === 'notifications' && notices.length > 0 && (
            <button
              type="button"
              onClick={onClearNotices}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[14px] text-white whitespace-nowrap transition-colors"
            >
              {t(lang, 'Clear all')}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {screen === 'stats' && (
            <>
              <p className="text-[15px] text-[#71717A]">
                {t(lang, 'This is your own usage on this phone.')}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
                  <div className="text-[32px] font-light leading-none tabular-nums text-[#18181B]">
                    {fmtNum(lang, codesToday)}
                  </div>
                  <div className="mt-1.5 text-[15px] text-[#18181B]">{t(lang, 'Codes today')}</div>
                  <div className="mt-1.5 text-[13px] text-[#71717A] tabular-nums">
                    {t(lang, `Total ${codesTotal}`)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
                  <div className="text-[32px] font-light leading-none tabular-nums text-[#18181B]">
                    {fmtNum(lang, quizToday)}
                  </div>
                  <div className="mt-1.5 text-[15px] text-[#18181B]">{t(lang, 'Quiz today')}</div>
                  <div className="mt-1.5 text-[13px] text-[#71717A] tabular-nums">
                    {t(lang, `Total ${quizTotal}`)}
                  </div>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'By date')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] px-4 py-1.5">
                  <div className="grid grid-cols-[1fr_64px_64px] items-center min-h-[36px] text-[12px] uppercase text-[#71717A]">
                    <span>{t(lang, 'Date')}</span>
                    <span className="text-right">{t(lang, 'Codes')}</span>
                    <span className="text-right">{t(lang, 'Quiz')}</span>
                  </div>
                  {dayStats.map((d) => (
                    <div
                      key={d.date}
                      className="grid grid-cols-[1fr_64px_64px] items-center min-h-[48px] text-[15px] text-[#18181B] border-t border-[#F0F1F0]"
                    >
                      <span>{lang === 'bn' ? toBnDigits(t(lang, d.date)) : t(lang, d.date)}</span>
                      <span className="text-right tabular-nums">{fmtNum(lang, d.codes)}</span>
                      <span className="text-right tabular-nums">{fmtNum(lang, d.quiz)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {screen === 'settings' && (
            <>
              {/* About card */}
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-[52px] h-[52px] rounded-2xl bg-[#F4F4F5] flex items-center justify-center shrink-0">
                    <NusukLogo className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[18px] font-medium text-[#18181B]">Nusuk Auto</div>
                    <div className="text-[14px] text-[#71717A] tabular-nums">
                      {t(lang, 'Version 2.7')}
                    </div>
                  </div>
                </div>
                <p className="text-[15px] text-[#44403C] leading-relaxed">
                  {t(lang, 'Adds Umrah codes and plays the Nusuk quiz for you, so you save time.')}
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[14px] text-[#111111]">
                    {t(lang, 'You have the latest version')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToast(t(lang, 'You have the latest version'))}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Check for updates')}
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'Language')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(lang, 'Choose the language of the app.')}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onLangChange('en')}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] ${
                        lang === 'en'
                          ? 'bg-[#F4F4F5] border-[#111111] border-2'
                          : 'bg-white border-[#E5E7EB]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                          lang === 'en'
                            ? 'bg-[#111111] text-white'
                            : 'border-2 border-[#D4D4D8] text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[16px] font-medium text-[#18181B]">English</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLangChange('bn')}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] ${
                        lang === 'bn'
                          ? 'bg-[#F4F4F5] border-[#111111] border-2'
                          : 'bg-white border-[#E5E7EB]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                          lang === 'bn'
                            ? 'bg-[#111111] text-white'
                            : 'border-2 border-[#D4D4D8] text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[16px] font-medium text-[#18181B]">বাংলা</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quiz pace */}
              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'Quiz pace')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(lang, 'Choose how fast the quiz is played.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => onPaceModeChange(true)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                      paceNormal
                        ? 'bg-[#F4F4F5] border-[#111111] border-2'
                        : 'bg-white border-[#E5E7EB]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                        paceNormal
                          ? 'bg-[#111111] text-white'
                          : 'border-2 border-[#D4D4D8] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <div>
                      <div className="text-[16px] font-medium text-[#18181B]">
                        {t(lang, 'Normal (recommended)')}
                      </div>
                      <div className="mt-1 text-[14px] text-[#71717A] leading-snug">
                        {t(
                          lang,
                          'Thinks for a moment before giving each answer, like a real person. The next door is chosen at once. Safest for your account.',
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPaceModeChange(false)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                      !paceNormal
                        ? 'bg-[#F4F4F5] border-[#111111] border-2'
                        : 'bg-white border-[#E5E7EB]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                        !paceNormal
                          ? 'bg-[#111111] text-white'
                          : 'border-2 border-[#D4D4D8] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <div>
                      <div className="text-[16px] font-medium text-[#18181B]">
                        {t(lang, 'Fast')}
                      </div>
                      <div className="mt-1 text-[14px] text-[#71717A] leading-snug">
                        {t(
                          lang,
                          'No waiting at all. Quicker, but looks like a bot and your account may get limited.',
                        )}
                      </div>
                    </div>
                  </button>

                  {paceNormal && (
                    <div className="pt-2 space-y-2.5 border-t border-[#F0F1F0]">
                      <div className="text-[15px] text-[#44403C]">
                        {t(lang, 'Thinking time before each answer')}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] text-[#18181B]">{t(lang, 'Shortest')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(1, minSec - 1);
                              onRangeChange(next, Math.max(next, maxSec));
                            }}
                            className="w-11 h-9 rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-medium text-lg"
                          >
                            −
                          </button>
                          <span className="w-14 text-center text-[16px] font-medium tabular-nums">
                            {t(lang, `${minSec} s`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(10, minSec + 1);
                              onRangeChange(next, Math.max(next, maxSec));
                            }}
                            className="w-11 h-9 rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-medium text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] text-[#18181B]">{t(lang, 'Longest')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(minSec, maxSec - 1);
                              onRangeChange(Math.min(minSec, next), next);
                            }}
                            className="w-11 h-9 rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-medium text-lg"
                          >
                            −
                          </button>
                          <span className="w-14 text-center text-[16px] font-medium tabular-nums">
                            {t(lang, `${maxSec} s`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(15, maxSec + 1);
                              onRangeChange(minSec, next);
                            }}
                            className="w-11 h-9 rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-medium text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Your codes + Support */}
              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'Your codes')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(
                      lang,
                      'Found some Nusuk codes? Add them to the shared list so everyone can use them.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('addKeys')}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Add your own codes')}
                  </button>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'Share')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(lang, 'Know someone who does Umrah quizzes? Share the app with them.')}
                  </p>
                  <button
                    type="button"
                    onClick={handleShareApp}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Share the app')}
                  </button>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'Support')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(
                      lang,
                      'Something not working? Send a report with your app version, phone model and recent errors.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onToast(
                        lang === 'bn'
                          ? 'ডিবাগ রিপোর্ট প্রস্তুত করা হয়েছে (App v2.7 · Ebrahim Khalil)'
                          : 'Debug report prepared (App v2.7 · Ebrahim Khalil)',
                      )
                    }
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Share debug report')}
                  </button>
                </div>
              </div>
            </>
          )}

          {screen === 'addKeys' && (
            <>
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3.5">
                <p className="text-[15px] text-[#44403C] leading-relaxed">
                  {t(
                    lang,
                    'Paste your codes below, one or many, in any format. Codes look like NG-p36wAxup. We check each one and add the new ones to the shared list.',
                  )}
                </p>
                <textarea
                  rows={5}
                  value={keysInput}
                  onChange={(e) => setKeysInput(e.target.value)}
                  placeholder="NG-xxxxxxxx"
                  className="w-full rounded-xl bg-white border border-[#D4D4D8] p-3 text-[16px] font-mono-code text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#111111]"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setKeysInput('NG-aB3dE9fG, NG-kL8mN2pQ\nNG-9kLm2QrT');
                    }}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Paste')}
                  </button>
                  <button
                    type="button"
                    onClick={handleParseAndAddKeys}
                    className="px-5 py-2 min-h-[40px] rounded-full bg-[#111111] hover:bg-[#27272A] text-white text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Add codes')}
                  </button>
                </div>
              </div>

              {parseResult && (
                <div className="space-y-3">
                  {parseResult.added.length > 0 && (
                    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
                      <div className="text-[16px] font-medium text-[#111111]">
                        {lang === 'bn'
                          ? `✓  ${toBnDigits(parseResult.added.length)}টা নতুন কোড অ্যাড হয়েছে। ধন্যবাদ!`
                          : `✓  ${parseResult.added.length} new code${parseResult.added.length === 1 ? '' : 's'} added. Thank you!`}
                      </div>
                      <pre className="mt-2 text-[14px] font-mono-code text-[#52525B] whitespace-pre-wrap">
                        {parseResult.added.join('\n')}
                      </pre>
                    </div>
                  )}
                  {parseResult.duplicate.length > 0 && (
                    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
                      <div className="text-[16px] font-medium text-[#B45309]">
                        {lang === 'bn'
                          ? `＝  ${toBnDigits(parseResult.duplicate.length)}টা আগে থেকেই লিস্টে আছে`
                          : `＝  ${parseResult.duplicate.length} already in the list`}
                      </div>
                      <pre className="mt-2 text-[14px] font-mono-code text-[#52525B] whitespace-pre-wrap">
                        {parseResult.duplicate.join('\n')}
                      </pre>
                    </div>
                  )}
                  {parseResult.invalid.length > 0 && (
                    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
                      <div className="text-[16px] font-medium text-[#B91C1C]">
                        {lang === 'bn'
                          ? `✗  ${toBnDigits(parseResult.invalid.length)}টা সঠিক কোড নয় (NG- আর ৮টা অক্ষর বা সংখ্যা)`
                          : `✗  ${parseResult.invalid.length} not a valid code (NG- and 8 letters or digits)`}
                      </div>
                      <pre className="mt-2 text-[14px] font-mono-code text-[#52525B] whitespace-pre-wrap">
                        {parseResult.invalid.join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {screen === 'notifications' && (
            <>
              {notices.length === 0 ? (
                <div className="flex flex-col items-center text-center px-6 pt-14">
                  <div className="w-[76px] h-[76px] rounded-full bg-[#F4F4F5] flex items-center justify-center">
                    <Bell className="w-8 h-8 text-[#111111]" />
                  </div>
                  <div className="mt-4 text-[18px] font-medium text-[#18181B]">
                    {t(lang, 'No notifications yet')}
                  </div>
                  <p className="mt-1.5 text-[15px] text-[#71717A]">
                    {t(lang, 'News and updates we send from the server will be saved here.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notices.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 flex items-start gap-3 ${
                        item.unread
                          ? 'bg-[#F4F4F5] border-[#D4D4D8]'
                          : 'bg-white border-[#E5E7EB]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-[#111111]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-medium text-[#18181B]">{item.title}</div>
                        <p className="mt-1 text-[14px] text-[#44403C] leading-snug">{item.body}</p>
                        <div className="mt-2 text-[12px] text-[#71717A]">
                          {lang === 'bn' ? 'সাম্প্রতিক' : 'Recent'}
                          {item.url ? ` · ${t(lang, 'Tap to open')}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {screen === 'developer' && (
            <>
              {/* Corporate Brand & Founder Header */}
              <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="hero-gradient pt-4 pb-12 px-4 flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-[#E4E4E7] text-[11px] font-medium tracking-[0.08em] uppercase">
                    {t(lang, 'FYNEX · SOFTWARE & AUTOMATION')}
                  </span>
                </div>
                <div className="px-5 pb-5 flex flex-col items-center text-center">
                  <div className="-mt-12 w-24 h-24 rounded-full bg-white p-1 border-2 border-[#D4D4D8] shadow-sm overflow-hidden">
                    {!avatarFailed ? (
                      <img
                        src="/assets/dev_avatar.jpg"
                        alt="Ebrahim Khalil"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#F4F4F5] text-[#111111] font-semibold text-xl flex items-center justify-center">
                        EK
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-[21px] font-medium text-[#18181B]">
                    {t(lang, 'Ebrahim Khalil')}
                  </div>
                  <div className="mt-0.5 text-[14px] font-medium text-[#111111]">
                    {t(lang, 'Founder & Lead Developer · Fynex')}
                  </div>

                  {/* Quick Contact Pills */}
                  <div className="mt-4 w-full grid grid-cols-3 gap-2">
                    <a
                      href="https://wa.me/8801305359691"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] rounded-full bg-[#111111] hover:bg-[#27272A] text-white text-[13px] font-medium flex items-center justify-center transition-colors"
                    >
                      {t(lang, 'WhatsApp')}
                    </a>
                    <a
                      href="https://www.facebook.com/share/1CnXaXQFoL/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[13px] font-medium flex items-center justify-center transition-colors"
                    >
                      {t(lang, 'Facebook')}
                    </a>
                    <a
                      href="https://fynex.site"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] rounded-full bg-[#F4F4F5] border border-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] text-[13px] font-medium flex items-center justify-center transition-colors"
                    >
                      {t(lang, 'Website')}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'Connect')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] divide-y divide-[#F0F1F0]">
                  <a
                    href="https://wa.me/8801305359691"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAFA] transition-colors rounded-t-2xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#111111]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-medium text-[#18181B]">
                        {t(lang, 'WhatsApp')}
                      </div>
                      <div className="text-[13.5px] text-[#71717A] truncate">01305359691</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
                  </a>
                  <a
                    href="https://www.facebook.com/share/1CnXaXQFoL/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
                      <ExternalLink className="w-5 h-5 text-[#111111]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-medium text-[#18181B]">
                        {t(lang, 'Facebook profile')}
                      </div>
                      <div className="text-[13.5px] text-[#71717A] truncate">
                        facebook.com/share/1CnXaXQFoL
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
                  </a>
                  <a
                    href="https://fynex.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-[#111111]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-medium text-[#18181B]">
                        {t(lang, 'Official website')}
                      </div>
                      <div className="text-[13.5px] text-[#71717A] truncate">fynex.site</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
                  </a>
                  <a
                    href="mailto:skyebrahimkhalil@gmail.com"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAFA] transition-colors rounded-b-2xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#111111]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-medium text-[#18181B]">
                        {t(lang, 'Email')}
                      </div>
                      <div className="text-[13.5px] text-[#71717A] truncate">
                        skyebrahimkhalil@gmail.com
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
                  </a>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#71717A]">
                  {t(lang, 'About the app')}
                </div>
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-2 text-[14.5px] text-[#44403C] leading-relaxed">
                  <div className="text-[16px] font-medium text-[#18181B]">
                    {t(lang, 'Built by Fynex')}
                  </div>
                  <p>
                    {t(
                      lang,
                      'Nusuk Auto is developed and maintained by Ebrahim Khalil at Fynex (fynex.site) to help Umrah pilgrims automate Nusuk codes and challenges safely.',
                    )}
                  </p>
                  <p className="text-[#71717A]">
                    {t(
                      lang,
                      'Nusuk Auto is an unofficial helper made for Nusuk users. It is not connected to the Nusuk app or the Ministry of Hajj and Umrah.',
                    )}
                  </p>
                  <div className="pt-1 text-[14px] font-medium text-[#111111] tabular-nums">
                    {t(lang, 'Version 2.7')}
                  </div>
                </div>
              </div>
            </>
          )}

          {screen === 'help' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-2">
                <div className="text-[16px] font-medium text-[#18181B]">
                  {lang === 'bn'
                    ? '১. অ্যাক্সেসিবিলিটি সার্ভিস অন করা না গেলে?'
                    : '1. Can’t turn on Accessibility service?'}
                </div>
                <p className="text-[14px] text-[#44403C] leading-relaxed whitespace-pre-line">
                  {lang === 'bn'
                    ? 'Nusuk Auto-র সুইচ ধূসর হয়ে থাকলে বা "Restricted setting" দেখালে:\n\n১. "Open App info"-তে ট্যাপ করো\n২. ওপরে ডানে ৩ ডটে ট্যাপ করো\n৩. "Allow restricted settings"-এ ট্যাপ করো\n৪. ফিরে এসে অ্যাক্সেসিবিলিটিতে Nusuk Auto অন করো'
                    : 'If the Nusuk Auto switch is greyed out or shows "Restricted setting":\n\n1. Open App info\n2. Tap the 3 dots (top right)\n3. Tap "Allow restricted settings"\n4. Come back and turn on Nusuk Auto in Accessibility'}
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-2">
                <div className="text-[16px] font-medium text-[#18181B]">
                  {lang === 'bn'
                    ? '২. নুসুক অ্যাপ ইংরেজিতে রাখা জরুরি'
                    : '2. Keep Nusuk app in English'}
                </div>
                <p className="text-[14px] text-[#44403C] leading-relaxed">
                  {lang === 'bn'
                    ? 'নুসুক আরবিতে থাকলে অটোমেশন প্রশ্ন ও বাটন পড়তে পারবে না। নুসুকের ভাষা ইংরেজি করে তারপর Start চাপো।'
                    : 'If Nusuk is in Arabic, switch Nusuk to English before pressing Start in the floating widget.'}
                </p>
              </div>
              <a
                href="https://fynex.site"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-[#111111] hover:bg-[#27272A] text-white text-[15px] font-medium transition-colors"
              >
                <span>{lang === 'bn' ? 'অফিসিয়াল ওয়েবসাইট দেখো (fynex.site)' : 'Open fynex.site'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Home Screen (activity_main.xml — minimal black layout)
  return (
    <div className="flex flex-col h-full min-h-[640px] bg-[#F7F7F7] text-[#18181B]">
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Compact Black Hero Header */}
        <div className="hero-gradient rounded-b-[22px] px-4 pt-3 pb-4 text-white shrink-0">
          <div className="flex items-center">
            <NusukLogo className="w-8 h-8 shrink-0" />
            <span className="ml-2.5 text-[18px] font-medium tracking-tight truncate">
              Nusuk Auto
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleOpenNotifications}
              aria-label={t(lang, 'Notifications')}
              className="relative w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] border border-[#111111] text-[10px] font-semibold text-white flex items-center justify-center tabular-nums">
                  {fmtNum(lang, unreadCount)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              aria-label={t(lang, 'Settings')}
              className="ml-1.5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Strip */}
          <button
            type="button"
            onClick={() => onNavigate('stats')}
            aria-label={t(lang, 'Open statistics')}
            className="mt-3 w-full flex items-center text-left py-1 rounded-xl hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <div className="flex-1 pl-0.5">
              <div className="text-[30px] font-light leading-tight tabular-nums text-white">
                {fmtNum(lang, codesToday)}
              </div>
              <div className="text-[14px] text-[#E4E4E7]/80">{t(lang, 'Codes today')}</div>
            </div>
            <div className="w-px h-10 bg-white/20 mx-3 shrink-0" />
            <div className="flex-1 pl-1">
              <div className="text-[30px] font-light leading-tight tabular-nums text-white">
                {fmtNum(lang, quizToday)}
              </div>
              <div className="text-[14px] text-[#E4E4E7]/80">{t(lang, 'Quiz today')}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 shrink-0 mr-1" />
          </button>
        </div>

        {/* Main Content Stack */}
        <div className="px-4 pt-4 pb-4 space-y-3.5 flex-1">
          {/* Running Banner */}
          {overlay.running && (
            <div className="rounded-2xl bg-[#F4F4F5] border border-[#D4D4D8] p-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#18181B] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-medium text-[#111111] truncate">
                  {t(lang, overlay.mode === 'QUIZ' ? 'Playing quiz' : 'Adding codes')}
                </div>
                <div className="text-[14px] text-[#71717A] truncate">
                  {t(lang, 'Running in the background')}
                </div>
              </div>
              <button
                type="button"
                onClick={onStopRunning}
                className="px-4 py-2 min-h-[38px] rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
              >
                {t(lang, 'Stop')}
              </button>
            </div>
          )}

          {/* Setup Required Banner */}
          {!allPermsReady && (
            <div className="rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#92400E]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-[17px] font-medium">{t(lang, 'Setup required')}</span>
              </div>
              <p className="text-[15px] text-[#71717A]">
                {t(lang, 'Finish setup to work inside Nusuk.')}
              </p>

              {!permissions.nusukInstalled && (
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                  <span className="flex-1 text-[16px] text-[#18181B]">
                    {t(lang, 'Nusuk app not installed')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFixPermission('nusukInstalled')}
                    className="px-4 py-1.5 min-h-[36px] rounded-full bg-[#111111] hover:bg-[#27272A] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Install')}
                  </button>
                </div>
              )}

              {!permissions.accessibilityEnabled && (
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                  <span className="flex-1 text-[16px] text-[#18181B]">
                    {t(lang, 'Accessibility service')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFixPermission('accessibilityEnabled')}
                    className="px-4 py-1.5 min-h-[36px] rounded-full bg-[#111111] hover:bg-[#27272A] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Enable')}
                  </button>
                </div>
              )}

              {!permissions.overlayAllowed && (
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                  <span className="flex-1 text-[16px] text-[#18181B]">
                    {t(lang, 'Floating overlay')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFixPermission('overlayAllowed')}
                    className="px-4 py-1.5 min-h-[36px] rounded-full bg-[#111111] hover:bg-[#27272A] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Allow')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auto Add Codes CTA Card */}
          <button
            type="button"
            onClick={() => onLaunchMode('CODES')}
            className="w-full rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#111111]/40 px-4 py-5 flex items-center gap-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#111111]"
          >
            <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
              <AutoCodesIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[19px] font-medium text-[#18181B] leading-tight">
                {t(lang, 'Auto Add Codes')}
              </div>
              <div className="mt-1 text-[15px] text-[#71717A] truncate">
                {t(lang, 'Enters Umrah codes for you')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Auto Play Quiz CTA Card */}
          <button
            type="button"
            onClick={() => onLaunchMode('QUIZ')}
            className="w-full rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#111111]/40 px-4 py-5 flex items-center gap-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#111111]"
          >
            <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0">
              <AutoQuizIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[19px] font-medium text-[#18181B] leading-tight">
                {t(lang, 'Auto Play Quiz')}
              </div>
              <div className="mt-1 text-[15px] text-[#71717A] truncate">
                {t(lang, 'Answers the Nusuk quiz for you')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Minimal Action Menu Card */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] py-1 divide-y divide-[#F0F1F0]">
            <button
              type="button"
              onClick={() => onNavigate('addKeys')}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAFA] transition-colors rounded-t-2xl"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-[#18181B]" />
              </div>
              <span className="flex-1 text-[16px] text-[#18181B]">
                {t(lang, 'Add your own codes')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-[#18181B]" />
              </div>
              <span className="flex-1 text-[16px] text-[#18181B]">{t(lang, 'Settings')}</span>
              <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-[#111111]" />
              </div>
              <span className="flex-1 text-[16px] text-[#18181B]">
                {t(lang, 'Help & guides')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            </button>

            <a
              href="https://www.facebook.com/share/1CnXaXQFoL/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#111111]" />
              </div>
              <span className="flex-1 text-[16px] text-[#18181B]">
                {t(lang, 'Follow on Facebook')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            </a>

            <button
              type="button"
              onClick={handleShareApp}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAFA] transition-colors rounded-b-2xl"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-[#18181B]" />
              </div>
              <span className="flex-1 text-[16px] text-[#18181B]">
                {t(lang, 'Share the app')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            </button>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-4 py-3 flex items-center justify-center gap-2 text-[14px]">
          <button
            type="button"
            onClick={() => onNavigate('developer')}
            className="min-h-[44px] px-2.5 text-[#71717A] hover:text-[#18181B] transition-colors"
          >
            {t(lang, 'Ebrahim Khalil')}
          </button>
          <span className="text-[#D4D4D8]" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={() => onToast(t(lang, 'You have the latest version'))}
            className="min-h-[44px] px-2.5 text-[#A1A1AA] hover:text-[#71717A] tabular-nums transition-colors"
          >
            {t(lang, 'Version 2.7')}
          </button>
        </div>
      </div>
    </div>
  );
}
