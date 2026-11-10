import React, { useState, useEffect, useCallback } from 'react';
import { AppStats, CodeSort, NusukCode } from './types';
import { fetchCodes, fetchStats, recordCopy, fetchAppSettings, FALLBACK_CODES } from './lib/api';
import { normalizeLiveTimestamps } from './lib/liveSync';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { PinnedCard } from './components/PinnedCard';
import { LiveBoard } from './components/LiveBoard';
import { NusukQuizFooter } from './components/NusukQuizFooter';
import { ShareCodeModal } from './components/ShareCodeModal';
import { ShareAppModal } from './components/ShareAppModal';
import { NusukAppGuideModal } from './components/NusukAppGuideModal';
import { InfoModal } from './components/InfoModals';
import { AdminModal } from './components/AdminModal';
import { Toast } from './components/Toast';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nusuk_theme');
    return saved !== 'light';
  });

  // Stats & Codes State (Instant authentic seed cache for 0ms initial load & guaranteed initial 10 codes)
  const [stats, setStats] = useState<AppStats | null>(null);
  const [codes, setCodes] = useState<NusukCode[]>(() => {
    try {
      const saved = localStorage.getItem('nusuk_codes_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
    } catch {}
    return FALLBACK_CODES;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom Admin Controls State
  const [customPinnedCode, setCustomPinnedCode] = useState<string>(() => {
    return localStorage.getItem('nusuk_custom_pinned') || 'NG-ElOBvwzz';
  });
  const [notice, setNotice] = useState<{ enabled: boolean; text: string }>(() => {
    const saved = localStorage.getItem('nusuk_custom_notice');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      enabled: false,
      text: '📢 নতুন উমরাহ চ্যালেঞ্জ রাউন্ড শুরু হয়েছে! প্রতিদিন কুইজে অংশ নিন এবং লাইভ বোর্ডে রেফারেল কোড শেয়ার করে বোনাস কি সংগ্রহ করুন।',
    };
  });

  // Filters & Sort
  const [sort, setSort] = useState<CodeSort>('newest');
  const [hideUsed, setHideUsed] = useState<boolean>(() => {
    return localStorage.getItem('nusuk_hide_used') === 'true';
  });

  // User Copied Codes: ONLY tracks the specific code strings that THIS user clicked
  const [userUsedCodes, setUserUsedCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nusuk_my_copied_codes_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((c) => typeof c === 'string' && c.toUpperCase().startsWith('NG-'))
            .map((c) => c.trim().toUpperCase());
        }
      }
    } catch {}
    return [];
  });

  const markCodeAsUsed = useCallback((codeStr: string) => {
    if (!codeStr || typeof codeStr !== 'string') return;
    const clean = codeStr.trim().toUpperCase();
    if (!clean.startsWith('NG-')) return;
    setUserUsedCodes((prev) => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      try {
        localStorage.setItem('nusuk_my_copied_codes_v3', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareAppModalOpen, setIsShareAppModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isNusukGuideOpen, setIsNusukGuideOpen] = useState(false);
  const [selectedCodeForGuide, setSelectedCodeForGuide] = useState<string | null>(null);
  const [infoModalType, setInfoModalType] = useState<'benefit' | 'notWorking' | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    subMessage?: string;
    type?: 'success' | 'error';
  }>({ visible: false, message: '' });

  // Sync dark class on root
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nusuk_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const triggerToast = (message: string, subMessage?: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, subMessage, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const [statsData, codesData, settingsData] = await Promise.all([
        fetchStats(),
        fetchCodes({
          sort,
        }),
        fetchAppSettings(),
      ]);

      setStats(statsData);
      setCodes(normalizeLiveTimestamps(codesData.codes));

      if (settingsData) {
        if (settingsData.pinnedCode) {
          setCustomPinnedCode(settingsData.pinnedCode);
        }
        if (settingsData.notice) {
          setNotice(settingsData.notice);
        }
        if (settingsData.stats) {
          setStats(settingsData.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setTimeout(() => setIsRefreshing(false), 400);
        triggerToast('বোর্ড আপডেট হয়েছে', 'সর্বশেষ কোড লোড করা হয়েছে');
      }
    }
  }, [sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time zero-read instant synchronization across all users via Server-Sent Events (SSE)
  useEffect(() => {
    let evtSource: EventSource | null = null;

    try {
      evtSource = new EventSource('/api/realtime/stream');

      // 1. Single Code Added (Admin or Public)
      evtSource.addEventListener('code_added', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.code) {
            const newCodeItem: NusukCode = data.code;
            setCodes((prev) => {
              if (prev.some((c) => c.normalizedCode === newCodeItem.normalizedCode || c.id === newCodeItem.id)) {
                return prev;
              }
              const pinned = prev.filter((c) => c.isPinned);
              const unpinned = prev.filter((c) => !c.isPinned);
              return [...pinned, newCodeItem, ...unpinned];
            });
            if (data.stats) {
              setStats((prev) => (prev ? { ...prev, ...data.stats } : data.stats));
            }
          }
        } catch (err) {
          console.warn('Realtime code_added parse error:', err);
        }
      });

      // 2. Batch Codes Added (Admin Multi-line Import)
      evtSource.addEventListener('batch_added', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && Array.isArray(data.codes)) {
            const incoming: NusukCode[] = data.codes;
            setCodes((prev) => {
              const existingSet = new Set(prev.map((c) => c.normalizedCode));
              const fresh = incoming.filter((c) => !existingSet.has(c.normalizedCode));
              if (fresh.length === 0) return prev;
              const pinned = prev.filter((c) => c.isPinned);
              const unpinned = prev.filter((c) => !c.isPinned);
              return [...pinned, ...fresh, ...unpinned];
            });
            if (data.stats) {
              setStats((prev) => (prev ? { ...prev, ...data.stats } : data.stats));
            }
          }
        } catch (err) {
          console.warn('Realtime batch_added parse error:', err);
        }
      });

      // 3. Database Sync / Bulk Status Changes
      evtSource.addEventListener('codes_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && Array.isArray(data.codes)) {
            setCodes(normalizeLiveTimestamps(data.codes));
            if (data.stats) {
              setStats((prev) => (prev ? { ...prev, ...data.stats } : data.stats));
            }
          }
        } catch (err) {
          console.warn('Realtime codes_updated parse error:', err);
        }
      });

      // 4. Admin Actions (Verify, Disable, Pin, Delete, Restore)
      evtSource.addEventListener('code_action', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.id) {
            setCodes((prev) => {
              if (data.action === 'delete' || data.action === 'disable') {
                return prev.filter((c) => c.id !== data.id);
              }
              return prev.map((c) => {
                if (c.id === data.id) {
                  return {
                    ...c,
                    ...(data.code || {}),
                    status: data.action === 'verify' ? 'verified' : data.action === 'restore' ? 'available' : c.status,
                    isPinned: data.action === 'pin' ? !c.isPinned : c.isPinned,
                  };
                }
                return c;
              });
            });
            if (data.stats) {
              setStats((prev) => (prev ? { ...prev, ...data.stats } : data.stats));
            }
          }
        } catch (err) {
          console.warn('Realtime code_action parse error:', err);
        }
      });

      // 5. Real-time Copy Counter
      evtSource.addEventListener('code_copied', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.id) {
            setCodes((prev) =>
              prev.map((c) => (c.id === data.id ? { ...c, copyCount: data.copyCount } : c))
            );
          }
        } catch {}
      });

      // 6. Real-time Database Settings Sync (Pinned Code, Notice Bar, Stats)
      evtSource.addEventListener('settings_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data) {
            if (data.pinnedCode) setCustomPinnedCode(data.pinnedCode);
            if (data.notice) setNotice(data.notice);
          }
        } catch (err) {
          console.warn('Realtime settings_updated parse error:', err);
        }
      });

      evtSource.addEventListener('notice_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data) setNotice(data);
        } catch {}
      });

      evtSource.addEventListener('pinned_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.pinnedCode) setCustomPinnedCode(data.pinnedCode);
        } catch {}
      });

      evtSource.addEventListener('stats_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data) setStats(data);
        } catch {}
      });

      evtSource.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.settings) {
            if (data.settings.pinnedCode) setCustomPinnedCode(data.settings.pinnedCode);
            if (data.settings.notice) setNotice(data.settings.notice);
          }
          if (data?.stats) setStats(data.stats);
        } catch {}
      });

      evtSource.onerror = () => {
        // EventSource will automatically retry connecting
      };
    } catch (err) {
      console.warn('EventSource initialization warning:', err);
    }

    // Minimal background sync fallback (runs every 2 minutes only as an edge reconnect safety net)
    const fallbackTimer = setInterval(() => {
      fetchStats()
        .then((s) => {
          if (s) setStats((prev) => (prev ? { ...prev, ...s } : s));
        })
        .catch(() => {});
    }, 120000);

    return () => {
      clearInterval(fallbackTimer);
      if (evtSource) {
        evtSource.close();
      }
    };
  }, []);

  // Handle Code Copy Action
  const handleCopyCode = async (id: string, codeStr: string) => {
    markCodeAsUsed(codeStr);
    recordCopy(id);
    setCodes((prev) =>
      prev.map((c) => (c.code === codeStr || c.id === id ? { ...c, copyCount: c.copyCount + 1 } : c))
    );
    triggerToast('কোড কপি হয়েছে!', `${codeStr} • Nusuk অ্যাপে পেস্ট করুন`);
  };

  // Open Nusuk app direct link: https://services.nusuk.sa/app?p=27&id=(code)
  const handleOpenNusuk = (codeStr: string) => {
    markCodeAsUsed(codeStr);
    const matched = codes.find((c) => c.code === codeStr);
    if (matched) {
       recordCopy(matched.id);
       setCodes((prev) =>
         prev.map((c) => (c.code === codeStr ? { ...c, copyCount: c.copyCount + 1 } : c))
       );
    }

    try {
      navigator.clipboard.writeText(codeStr);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
    
    setSelectedCodeForGuide(codeStr);

    // Direct navigation to Nusuk App link with referral id parameter
    const nusukUrl = `https://services.nusuk.sa/app?p=27&id=${encodeURIComponent(codeStr)}`;
    const link = document.createElement('a');
    link.href = nusukUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('কোড কপি হয়েছে!', 'নুসুক অ্যাপে সরাসরি নেওয়া হচ্ছে...');
  };

  // Handle new code submitted
  const handleCodeSubmitted = (newCode: NusukCode) => {
    // Set immediate current timestamp
    const freshCode = {
      ...newCode,
      createdAt: new Date().toISOString(),
      status: 'recent' as const,
    };
    setCodes((prev) => {
      const pinned = prev.filter((c) => c.isPinned);
      const unpinned = prev.filter((c) => !c.isPinned && c.code !== freshCode.code);
      return [...pinned, freshCode, ...unpinned];
    });
    setStats((prev) =>
      prev ? { ...prev, totalCodes: prev.totalCodes + 1, todayCodes: prev.todayCodes + 1 } : null
    );
    loadData();
  };

  // Handle App Share (Opens dedicated share dialog with guaranteed clickable URL)
  const handleShareApp = () => {
    setIsShareAppModalOpen(true);
  };

  // Custom Admin Handlers
  const handleUpdatePinnedCode = (newCode: string) => {
    setCustomPinnedCode(newCode);
    localStorage.setItem('nusuk_custom_pinned', newCode);
    triggerToast('পিন্ড কোড আপডেট হয়েছে!', `${newCode} এখন হোম পেজে পিন্ড রয়েছে`);
    loadData(true);
  };

  const handleUpdateStats = (newStats: AppStats) => {
    setStats(newStats);
    localStorage.setItem('nusuk_custom_stats', JSON.stringify(newStats));
    triggerToast('স্ট্যাটস আপডেট হয়েছে!', 'হোম পেজের লাইভ স্ট্যাটস পরিবর্তিত হয়েছে');
  };

  const handleUpdateNotice = (newNotice: { enabled: boolean; text: string }) => {
    setNotice(newNotice);
    localStorage.setItem('nusuk_custom_notice', JSON.stringify(newNotice));
    triggerToast('নোটিশ আপডেট হয়েছে!', newNotice.enabled ? 'নোটিশ বার চালু রয়েছে' : 'নোটিশ বার বন্ধ করা হয়েছে');
  };

  const pinnedCode = codes.find((c) => c.code === customPinnedCode)
    || codes.find((c) => c.code === 'NG-ElOBvwzz')
    || codes.find((c) => c.isPinned)
    || {
        id: 'code-pinned-official',
        code: customPinnedCode || 'NG-ElOBvwzz',
        normalizedCode: (customPinnedCode || 'NG-ElOBvwzz').toUpperCase(),
        nickname: 'অফিসিয়াল পিন্ড',
        status: 'verified' as const,
        copyCount: 248,
        reportCount: 0,
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#121316] text-slate-900 dark:text-neutral-100 pb-10 font-sans selection:bg-blue-500/25 selection:text-blue-900 dark:selection:text-sky-200 transition-colors duration-200">
      {/* 1. Header: নুসুক কি ... + Share + Admin Panel + Sun/Moon + + কোড দিন */}
      <Header
        language="bn"
        onLanguageChange={() => {}}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenShareAppModal={handleShareApp}
      />

      {/* Emergency Notice / Announcement Bar (If enabled by Admin) */}
      {notice.enabled && notice.text && (
        <div className="w-full bg-[#0070e0] text-white py-2 px-3 text-xs font-semibold text-center shadow-xs flex items-center justify-center gap-2">
          <span>{notice.text}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-0 space-y-1">
        {/* 2. Top Stats Pill: ১২৮+ কোড শেয়ার • ১৮ জন সক্রিয় • ১,৮৪০+ ভিজিট  ((•)) */}
        <StatsBar stats={stats} />

        {/* 3. Pinned Code Card: 📌 পিন্ড  NG-ElOBvwzz  [কপি করুন] */}
        <PinnedCard
          codeItem={pinnedCode}
          onCopy={handleCopyCode}
          onOpenNusuk={handleOpenNusuk}
        />

        {/* 4. Live Board: Standalone control card + Strictly 1 line buttons + Standalone Code Cards */}
        <LiveBoard
          codes={codes}
          userUsedCodes={userUsedCodes}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          sort={sort}
          onSortChange={setSort}
          hideUsed={hideUsed}
          onToggleHideUsed={() => {
            setHideUsed((prev) => {
              const next = !prev;
              localStorage.setItem('nusuk_hide_used', String(next));
              return next;
            });
          }}
          onRefresh={() => loadData(true)}
          onCopy={handleCopyCode}
          onOpenNusuk={handleOpenNusuk}
          onOpenNotWorkingModal={() => setInfoModalType('notWorking')}
          onOpenBenefitModal={() => setInfoModalType('benefit')}
        />
      </main>

      {/* 5. Massive Comprehensive Nusuk Quiz & Umrah Challenge Footer (~5 min scroll/read) */}
      <NusukQuizFooter />

      {/* Modals & Dialogs */}
      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        language="bn"
        stats={stats}
        onUpdateStats={handleUpdateStats}
        pinnedCode={pinnedCode}
        onUpdatePinnedCode={handleUpdatePinnedCode}
        onDataModified={() => loadData(true)}
        notice={notice}
        onUpdateNotice={handleUpdateNotice}
      />

      {/* + কোড দিন Modal */}
      <ShareCodeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        language="bn"
        onSuccess={handleCodeSubmitted}
        onToast={triggerToast}
      />

      {/* Share Live Board Modal */}
      <ShareAppModal
        isOpen={isShareAppModalOpen}
        onClose={() => setIsShareAppModalOpen(false)}
        onToast={triggerToast}
      />

      {/* Nusuk Guide Modal */}
      <NusukAppGuideModal
        isOpen={isNusukGuideOpen}
        onClose={() => setIsNusukGuideOpen(false)}
        language="bn"
        selectedCode={selectedCodeForGuide}
      />

      {/* কাজ করছে না? / কী লাভ? Modals */}
      <InfoModal
        isOpen={infoModalType !== null}
        onClose={() => setInfoModalType(null)}
        language="bn"
        type={infoModalType || 'benefit'}
      />

      {/* Toast Feedback */}
      {toast.visible && (
        <Toast
          message={toast.message}
          subMessage={toast.subMessage}
          type={toast.type}
        />
      )}
    </div>
  );
}

