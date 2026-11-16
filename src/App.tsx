import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Layers, RotateCcw, ShieldCheck } from 'lucide-react';
import { PhoneApp } from './web/PhoneApp';
import { OverlayWidget } from './web/OverlayWidget';
import { QuizBankPanel, getQuizEntries } from './web/QuizBankPanel';
import { fmtNum, t } from './web/i18n';
import type {
  AutomationMode,
  DayStat,
  Lang,
  NoticeItem,
  OverlayState,
  PermissionState,
  ScreenId,
} from './web/types';

const SAMPLE_CODES = [
  'NG-p36wAxup',
  'NG-kL8mN2pQ',
  'NG-r7TvY4cZ',
  'NG-h2JnW9xK',
  'NG-m5QpB3vL',
  'NG-d8FsR6nM',
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 20261116,
    title: 'Version 2.7 released',
    body: 'Improved quiz door detection, updated offline answer seed, and Fynex developer support links.',
    at: Date.now() - 3600_000,
    url: 'https://github.com/7yu659/Nusuk/releases/latest',
    unread: true,
  },
  {
    id: 20261112,
    title: 'Keep Nusuk in English',
    body: 'Switch the official Nusuk app language to English before pressing Start in the floating widget.',
    at: Date.now() - 86_400_000 * 2,
    unread: false,
  },
];

const INITIAL_DAYS: DayStat[] = [
  { date: 'Today', codes: 18, quiz: 24 },
  { date: 'Yesterday', codes: 42, quiz: 56 },
  { date: '2026-11-14', codes: 35, quiz: 48 },
];

const SCREEN_TABS: Array<{ id: ScreenId; labelEn: string; labelBn: string }> = [
  { id: 'home', labelEn: 'Home', labelBn: 'হোম' },
  { id: 'stats', labelEn: 'Stats', labelBn: 'স্ট্যাটস' },
  { id: 'settings', labelEn: 'Settings', labelBn: 'সেটিংস' },
  { id: 'notifications', labelEn: 'Notices', labelBn: 'নোটিশ' },
  { id: 'addKeys', labelEn: 'Add Codes', labelBn: 'কোড অ্যাড' },
  { id: 'developer', labelEn: 'Developer', labelBn: 'ডেভেলপার' },
  { id: 'help', labelEn: 'Help', labelBn: 'হেল্প' },
];

export default function App() {
  const quizBank = useMemo(() => getQuizEntries(), []);

  const [lang, setLang] = useState<Lang>('en');
  const [screen, setScreen] = useState<ScreenId>('home');
  const [permissions, setPermissions] = useState<PermissionState>({
    nusukInstalled: true,
    accessibilityEnabled: true,
    overlayAllowed: true,
  });

  const [codesToday, setCodesToday] = useState(18);
  const [quizToday, setQuizToday] = useState(24);
  const [codesTotal, setCodesTotal] = useState(195);
  const [quizTotal, setQuizTotal] = useState(312);
  const [dayStats, setDayStats] = useState<DayStat[]>(INITIAL_DAYS);

  const [paceNormal, setPaceNormal] = useState(true);
  const [minSec, setMinSec] = useState(2);
  const [maxSec, setMaxSec] = useState(5);

  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [overlay, setOverlay] = useState<OverlayState>({
    visible: true,
    minimized: false,
    mode: 'QUIZ',
    targetCount: 25,
    completedCount: 0,
    correctCount: 0,
    running: false,
    paused: false,
    humanPace: true,
    statusText: 'Ready',
    thinkingProgress: 0,
    activeCode: SAMPLE_CODES[0],
    activeDoor: 1,
    activeQuestion: quizBank[0]?.question ?? 'what is the blessed well located in the sacred mosque',
    activeAnswer: quizBank[0]?.answer ?? 'Zamzam',
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const incrementStat = useCallback((mode: AutomationMode) => {
    if (mode === 'CODES') {
      setCodesToday((n) => n + 1);
      setCodesTotal((n) => n + 1);
      setDayStats((prev) =>
        prev.map((d, idx) => (idx === 0 ? { ...d, codes: d.codes + 1 } : d)),
      );
    } else {
      setQuizToday((n) => n + 1);
      setQuizTotal((n) => n + 1);
      setDayStats((prev) =>
        prev.map((d, idx) => (idx === 0 ? { ...d, quiz: d.quiz + 1 } : d)),
      );
    }
  }, []);

  // Live simulation loop for both Quiz and Codes automation modes
  const stepPhaseRef = useRef(0);
  const thinkElapsedRef = useRef(0);
  const thinkTargetMsRef = useRef(1800);

  useEffect(() => {
    if (!overlay.running || overlay.paused) return;

    const tickMs = 150;
    const timer = window.setInterval(() => {
      setOverlay((prev) => {
        if (!prev.running || prev.paused) return prev;

        if (prev.completedCount >= prev.targetCount) {
          const doneLabel =
            prev.mode === 'QUIZ'
              ? `Done (${prev.completedCount} quizzes, ${prev.correctCount} ✓)`
              : `Done (${prev.completedCount} codes)`;
          return {
            ...prev,
            running: false,
            paused: false,
            thinkingProgress: 0,
            statusText: doneLabel,
          };
        }

        if (prev.mode === 'QUIZ') {
          const phase = stepPhaseRef.current;
          const idx = prev.completedCount % Math.max(1, quizBank.length);
          const entry = quizBank[idx];
          const door = (prev.completedCount % 4) + 1;

          if (phase === 0) {
            stepPhaseRef.current = 1;
            thinkElapsedRef.current = 0;
            const lo = Math.max(600, minSec * 450);
            const hi = Math.max(lo, maxSec * 450);
            thinkTargetMsRef.current = prev.humanPace
              ? Math.round(lo + Math.random() * (hi - lo))
              : 240;
            return {
              ...prev,
              activeDoor: door,
              activeQuestion: entry.question,
              activeAnswer: entry.answer,
              thinkingProgress: 0,
              statusText: `Selecting Door ${door}...`,
            };
          }

          if (phase === 1) {
            thinkElapsedRef.current += tickMs;
            const pct = Math.min(100, Math.round((thinkElapsedRef.current / thinkTargetMsRef.current) * 100));
            if (thinkElapsedRef.current < thinkTargetMsRef.current) {
              return {
                ...prev,
                thinkingProgress: pct,
                statusText: prev.humanPace ? 'Thinking...' : `Selected (saved): ${entry.answer}`,
              };
            }
            stepPhaseRef.current = 2;
            return {
              ...prev,
              thinkingProgress: 100,
              statusText: `Selected (saved): ${entry.answer}`,
            };
          }

          stepPhaseRef.current = 0;
          incrementStat('QUIZ');
          const nextDone = prev.completedCount + 1;
          const nextCorrect = prev.correctCount + 1;
          if (nextDone >= prev.targetCount) {
            return {
              ...prev,
              completedCount: nextDone,
              correctCount: nextCorrect,
              running: false,
              paused: false,
              thinkingProgress: 0,
              statusText: `Done (${nextDone} quizzes, ${nextCorrect} ✓)`,
            };
          }
          return {
            ...prev,
            completedCount: nextDone,
            correctCount: nextCorrect,
            thinkingProgress: 0,
          };
        }

        // CODES mode simulation
        const phase = stepPhaseRef.current;
        const code = SAMPLE_CODES[prev.completedCount % SAMPLE_CODES.length];
        const progress = `${prev.completedCount + 1}/${prev.targetCount}`;

        if (phase === 0) {
          stepPhaseRef.current = 1;
          return {
            ...prev,
            activeCode: code,
            thinkingProgress: 30,
            statusText: `Entering ${code} (${progress})`,
          };
        }

        if (phase === 1) {
          stepPhaseRef.current = 2;
          return {
            ...prev,
            activeCode: code,
            thinkingProgress: 70,
            statusText: `Checking ${code} (${progress})`,
          };
        }

        if (phase === 2) {
          stepPhaseRef.current = 3;
          return {
            ...prev,
            activeCode: code,
            thinkingProgress: 100,
            statusText: `Collecting key (${code})`,
          };
        }

        stepPhaseRef.current = 0;
        incrementStat('CODES');
        const nextDone = prev.completedCount + 1;
        if (nextDone >= prev.targetCount) {
          return {
            ...prev,
            completedCount: nextDone,
            running: false,
            paused: false,
            thinkingProgress: 0,
            statusText: `Done (${nextDone} codes)`,
          };
        }
        return {
          ...prev,
          completedCount: nextDone,
          thinkingProgress: 0,
        };
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [overlay.running, overlay.paused, minSec, maxSec, quizBank, incrementStat]);

  const handleLaunchMode = (mode: AutomationMode) => {
    const allReady =
      permissions.nusukInstalled &&
      permissions.accessibilityEnabled &&
      permissions.overlayAllowed;

    if (!allReady) {
      showToast(
        !permissions.nusukInstalled
          ? t(lang, 'Install the Nusuk app first')
          : !permissions.accessibilityEnabled
            ? t(lang, 'Enable the accessibility service first')
            : t(lang, 'Allow the floating overlay first'),
      );
      return;
    }

    stepPhaseRef.current = 0;
    setOverlay((prev) => ({
      ...prev,
      visible: true,
      minimized: false,
      mode,
      completedCount: 0,
      correctCount: 0,
      running: true,
      paused: false,
      thinkingProgress: 0,
      statusText: mode === 'QUIZ' ? 'Starting Quiz...' : 'Starting Codes...',
    }));
    showToast(
      lang === 'bn'
        ? 'ভাসমান উইজেটে অটোমেশন চালু হয়েছে'
        : 'Automation started in the floating widget',
    );
  };

  const handleStopRunning = () => {
    stepPhaseRef.current = 0;
    setOverlay((prev) => ({
      ...prev,
      running: false,
      paused: false,
      thinkingProgress: 0,
      statusText: 'Stopped by user',
    }));
    showToast(t(lang, 'Stopped'));
  };

  const handleOverlayStartStop = () => {
    if (overlay.running) {
      handleStopRunning();
      return;
    }
    stepPhaseRef.current = 0;
    setOverlay((prev) => ({
      ...prev,
      completedCount: 0,
      correctCount: 0,
      running: true,
      paused: false,
      thinkingProgress: 0,
      statusText: prev.mode === 'QUIZ' ? 'Starting Quiz...' : 'Starting Codes...',
    }));
  };

  const allPermsReady =
    permissions.nusukInstalled &&
    permissions.accessibilityEnabled &&
    permissions.overlayAllowed;

  const toggleSetupSimulation = () => {
    if (allPermsReady) {
      setPermissions({
        nusukInstalled: true,
        accessibilityEnabled: false,
        overlayAllowed: false,
      });
      setScreen('home');
    } else {
      setPermissions({
        nusukInstalled: true,
        accessibilityEnabled: true,
        overlayAllowed: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F6] text-[#18181B] flex flex-col">
      {/* Three-zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#app-preview"
            className="text-[19px] font-semibold tracking-tight text-[#14532D] whitespace-nowrap shrink-0"
          >
            Nusuk Auto
          </a>

          <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-[#52525B]">
            <a
              href="#app-preview"
              className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? 'অ্যাপ প্রিভিউ' : 'App Preview'}
            </a>
            <a
              href="#floating-widget"
              className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? 'ফ্লোটিং উইজেট' : 'Floating Widget'}
            </a>
            <a
              href="#quiz-bank"
              className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? 'কুইজ ব্যাংক' : 'Quiz Bank'}
            </a>
            <a
              href="https://fynex.site"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#15803D] transition-colors whitespace-nowrap shrink-0"
            >
              fynex.site
            </a>
          </nav>

          <div className="shrink-0">
            <a
              href="https://github.com/7yu659/Nusuk/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#14532D] text-white text-[13.5px] font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              <span>{lang === 'bn' ? 'APK ডাউনলোড' : 'Download APK'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Workspace Control Strip */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Screen Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {SCREEN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScreen(tab.id)}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                  screen === tab.id
                    ? 'bg-[#ECFDF5] text-[#15803D] border border-[#BBF7D0]'
                    : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                }`}
              >
                {lang === 'bn' ? tab.labelBn : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Interactive Environment Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={toggleSetupSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] text-[13px] font-medium text-[#3F3F46] whitespace-nowrap shrink-0 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              <span>
                {allPermsReady
                  ? lang === 'bn'
                    ? 'সেটআপ অসম্পূর্ণ টেস্ট'
                    : 'Test Missing Setup'
                  : lang === 'bn'
                    ? 'সব অনুমতি চালু করুন'
                    : 'Grant All Permissions'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setOverlay((prev) => ({
                  ...prev,
                  visible: !prev.visible,
                  minimized: false,
                }))
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] text-[13px] font-medium text-[#3F3F46] whitespace-nowrap shrink-0 transition-colors"
            >
              <Layers className="w-4 h-4 text-[#15803D]" />
              <span>
                {overlay.visible
                  ? lang === 'bn'
                    ? 'উইজেট লুকান'
                    : 'Hide Widget'
                  : lang === 'bn'
                    ? 'উইজেট দেখান'
                    : 'Show Widget'}
              </span>
            </button>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F5] border border-[#E5E7EB] shrink-0">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 min-h-[32px] rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${
                  lang === 'en'
                    ? 'bg-white text-[#18181B] shadow-sm'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-3 py-1 min-h-[32px] rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${
                  lang === 'bn'
                    ? 'bg-white text-[#18181B] shadow-sm'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
          {/* Left Column: Android Phone App Frame */}
          <section id="app-preview" className="flex flex-col items-center">
            <div className="w-full max-w-[392px] rounded-[34px] bg-[#18181B] p-2.5 shadow-xl border border-[#27272A]">
              {/* Phone Speaker / Camera Bezel */}
              <div className="flex items-center justify-between px-5 pt-1 pb-2 text-[11px] font-medium text-[#A1A1AA] tabular-nums">
                <span>09:27</span>
                <div className="w-16 h-3.5 rounded-full bg-[#09090B]" />
                <span>5G · 94%</span>
              </div>

              {/* Screen Viewport */}
              <div className="relative h-[680px] rounded-[24px] overflow-hidden bg-[#F6F7F6]">
                <PhoneApp
                  lang={lang}
                  onLangChange={setLang}
                  screen={screen}
                  onNavigate={setScreen}
                  permissions={permissions}
                  onFixPermission={(key) => {
                    setPermissions((prev) => ({ ...prev, [key]: true }));
                    showToast(
                      lang === 'bn' ? 'অনুমতি চালু করা হয়েছে' : 'Permission enabled',
                    );
                  }}
                  codesToday={codesToday}
                  quizToday={quizToday}
                  codesTotal={codesTotal}
                  quizTotal={quizTotal}
                  dayStats={dayStats}
                  paceNormal={paceNormal}
                  onPaceModeChange={(normal) => {
                    setPaceNormal(normal);
                    setOverlay((prev) => ({ ...prev, humanPace: normal }));
                  }}
                  minSec={minSec}
                  maxSec={maxSec}
                  onRangeChange={(min, max) => {
                    setMinSec(min);
                    setMaxSec(max);
                  }}
                  overlay={overlay}
                  onLaunchMode={handleLaunchMode}
                  onStopRunning={handleStopRunning}
                  notices={notices}
                  onClearNotices={() => setNotices([])}
                  onMarkNoticesRead={() =>
                    setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))
                  }
                  onToast={showToast}
                  onKeysSubmitted={(addedCount) => {
                    setCodesToday((n) => n + addedCount);
                    setCodesTotal((n) => n + addedCount);
                    showToast(
                      lang === 'bn'
                        ? `${fmtNum(lang, addedCount)}টি নতুন কোড যুক্ত হয়েছে`
                        : `${addedCount} new code${addedCount === 1 ? '' : 's'} added`,
                    );
                  }}
                />

                {/* Android Toast */}
                {toast && (
                  <div className="absolute bottom-5 left-4 right-4 z-20 flex justify-center pointer-events-none">
                    <div className="px-4 py-2.5 rounded-xl bg-[#18181B]/95 text-white text-[13px] text-center shadow-lg max-w-full">
                      {toast}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Live Floating Widget Stage + Offline Quiz Bank */}
          <div className="space-y-6 min-w-0">
            {/* Live Automation Stage */}
            <section
              id="floating-widget"
              className="rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-[22px] font-semibold text-[#18181B] tracking-tight">
                    {lang === 'bn'
                      ? 'নুসুক অটো — লাইভ ফ্লোটিং উইজেট ও অটোমেশন সিমুলেটর'
                      : 'Nusuk Auto — Interactive Widget & Automation Preview'}
                  </h1>
                  <p className="mt-1 text-[14px] text-[#71717A] leading-relaxed">
                    {lang === 'bn'
                      ? 'কোড ইনজেকশন এবং দরজা-ভিত্তিক কুইজ অটোমেশন ফ্লো এখানে সরাসরি চালিয়ে পরীক্ষা করুন।'
                      : 'Test the floating overlay controls, human-like quiz pacing, and key code entry workflow live.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stepPhaseRef.current = 0;
                    setOverlay((prev) => ({
                      ...prev,
                      visible: true,
                      minimized: false,
                      running: false,
                      paused: false,
                      completedCount: 0,
                      correctCount: 0,
                      thinkingProgress: 0,
                      statusText: 'Ready',
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[13px] font-medium text-[#3F3F46] whitespace-nowrap self-start sm:self-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
                </button>
              </div>

              {/* Simulated Nusuk Screen + Floating Overlay */}
              <div className="rounded-2xl bg-[#F6F7F6] border border-[#E5E7EB] p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-5 items-center">
                {/* Simulated Nusuk App Canvas */}
                <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-[12px] text-[#71717A]">
                    <span>
                      {overlay.mode === 'QUIZ'
                        ? lang === 'bn'
                          ? `নুসুক কুইজ স্ক্রিন · দরজা ${fmtNum(lang, overlay.activeDoor)}`
                          : `Nusuk Challenge · Door ${overlay.activeDoor}`
                        : lang === 'bn'
                          ? 'নুসুক কী ইনপুট স্ক্রিন'
                          : 'Nusuk “Your keys” Screen'}
                    </span>
                    <span className="tabular-nums font-medium text-[#15803D]">
                      {overlay.running
                        ? overlay.paused
                          ? lang === 'bn'
                            ? 'বিরতি'
                            : 'Paused'
                          : lang === 'bn'
                            ? 'চলছে'
                            : 'Active'
                        : lang === 'bn'
                          ? 'প্রস্তুত'
                          : 'Idle'}
                    </span>
                  </div>

                  {overlay.mode === 'QUIZ' ? (
                    <div className="space-y-2.5">
                      <div className="text-[15px] font-medium text-[#18181B] capitalize leading-snug">
                        {overlay.activeQuestion}?
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          overlay.activeAnswer,
                          'Al-Masjid al-Haram',
                          'Mecca',
                          'Dhul-Hijjah',
                        ]
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .slice(0, 4)
                          .map((option) => {
                            const isCorrect = option === overlay.activeAnswer;
                            return (
                              <div
                                key={option}
                                className={`px-3 py-2.5 rounded-lg border text-[13.5px] transition-colors ${
                                  isCorrect && overlay.running
                                    ? 'bg-[#ECFDF5] border-[#15803D] text-[#14532D] font-medium'
                                    : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#52525B]'
                                }`}
                              >
                                {option}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="text-[14px] text-[#52525B]">
                        {lang === 'bn'
                          ? 'নুসুক কোড ইনপুট ফিল্ড (অটো-টাইপ)'
                          : 'Nusuk Key Code Field (Auto-Typed)'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-11 px-3.5 rounded-lg bg-[#FAFAFA] border border-[#D4D4D8] flex items-center font-mono-code text-[15px] font-medium text-[#18181B]">
                          {overlay.activeCode}
                        </div>
                        <div className="h-11 px-4 rounded-lg bg-[#15803D] text-white text-[13.5px] font-medium flex items-center justify-center">
                          {lang === 'bn' ? 'Check' : 'Check'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Floating Overlay Widget */}
                <div className="flex justify-center">
                  {overlay.visible ? (
                    <OverlayWidget
                      lang={lang}
                      overlay={overlay}
                      onMinimizeToggle={() =>
                        setOverlay((prev) => ({ ...prev, minimized: !prev.minimized }))
                      }
                      onClose={() =>
                        setOverlay((prev) => ({
                          ...prev,
                          visible: false,
                          running: false,
                          paused: false,
                        }))
                      }
                      onModeChange={(mode) => {
                        if (overlay.running) return;
                        setOverlay((prev) => ({
                          ...prev,
                          mode,
                          completedCount: 0,
                          correctCount: 0,
                          statusText: 'Ready',
                        }));
                      }}
                      onCountChange={(targetCount) =>
                        setOverlay((prev) => ({ ...prev, targetCount }))
                      }
                      onPaceToggle={() => {
                        const next = !overlay.humanPace;
                        setPaceNormal(next);
                        setOverlay((prev) => ({ ...prev, humanPace: next }));
                      }}
                      onStartStop={handleOverlayStartStop}
                      onPauseResume={() =>
                        setOverlay((prev) => ({
                          ...prev,
                          paused: !prev.paused,
                          statusText: !prev.paused ? 'Paused' : 'Thinking...',
                        }))
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setOverlay((prev) => ({ ...prev, visible: true, minimized: false }))
                      }
                      className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#0F2E1E] text-[#DCFCE7] text-[14px] font-medium hover:bg-[#14532D] transition-colors"
                    >
                      {lang === 'bn' ? 'ফ্লোটিং উইজেট খুলুন' : 'Open Floating Widget'}
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Summary Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] px-3.5 py-3">
                  <div className="text-[12px] text-[#71717A]">
                    {lang === 'bn' ? 'আজকের কোড' : 'Codes Today'}
                  </div>
                  <div className="mt-0.5 text-[22px] font-semibold text-[#18181B] tabular-nums">
                    {fmtNum(lang, codesToday)}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] px-3.5 py-3">
                  <div className="text-[12px] text-[#71717A]">
                    {lang === 'bn' ? 'আজকের কুইজ' : 'Quizzes Today'}
                  </div>
                  <div className="mt-0.5 text-[22px] font-semibold text-[#18181B] tabular-nums">
                    {fmtNum(lang, quizToday)}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] px-3.5 py-3">
                  <div className="text-[12px] text-[#71717A]">
                    {lang === 'bn' ? 'মোট কোড' : 'All-Time Codes'}
                  </div>
                  <div className="mt-0.5 text-[22px] font-semibold text-[#18181B] tabular-nums">
                    {fmtNum(lang, codesTotal)}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] px-3.5 py-3">
                  <div className="text-[12px] text-[#71717A]">
                    {lang === 'bn' ? 'মোট কুইজ' : 'All-Time Quizzes'}
                  </div>
                  <div className="mt-0.5 text-[22px] font-semibold text-[#18181B] tabular-nums">
                    {fmtNum(lang, quizTotal)}
                  </div>
                </div>
              </div>
            </section>

            {/* Offline Quiz Answer Bank */}
            <section id="quiz-bank">
              <QuizBankPanel lang={lang} />
            </section>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white mt-auto">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-[#71717A]">
          <div>
            Nusuk Auto · {lang === 'bn' ? 'ডেভেলপার: ইব্রাহিম খলিল (Fynex)' : 'Developed by Ebrahim Khalil (Fynex)'}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://fynex.site"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#15803D] transition-colors"
            >
              fynex.site
            </a>
            <a
              href="https://github.com/7yu659/Nusuk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#15803D] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://wa.me/8801305359691"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#15803D] transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
