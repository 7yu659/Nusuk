import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  Trash2,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Pin,
  RefreshCw,
  Plus,
  KeyRound,
  BarChart3,
  Megaphone,
  Settings,
  Download,
  Upload,
  Check,
  AlertTriangle,
  ExternalLink,
  Edit2,
  X
} from 'lucide-react';
import { Language, NusukCode, AppStats } from '../types';
import { fetchAdminCodes, performAdminAction, submitAdminCode, submitNewCode, submitBatchCodes, adminLogin, updateAdminPasscode, updateAdminSettings } from '../lib/api';
import { formatTimeAgo } from '../lib/validation';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  stats: AppStats | null;
  onUpdateStats: (newStats: AppStats) => void;
  pinnedCode: NusukCode | null;
  onUpdatePinnedCode: (newCode: string) => void;
  onDataModified: () => void;
  notice: { enabled: boolean; text: string };
  onUpdateNotice: (notice: { enabled: boolean; text: string }) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  language,
  stats,
  onUpdateStats,
  pinnedCode,
  onUpdatePinnedCode,
  onDataModified,
  notice,
  onUpdateNotice,
}) => {
  // Secret Passcode Management
  const [passcode, setPasscode] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return sessionStorage.getItem('nusuk_admin_auth');
  });
  const [loginError, setLoginError] = useState(false);
  const [storedSecret, setStoredSecret] = useState<string>(() => {
    return localStorage.getItem('nusuk_admin_secret') || 'nusuk2026';
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pinned' | 'codes' | 'stats' | 'notice' | 'security'>('pinned');

  // Codes State
  const [adminCodes, setAdminCodes] = useState<NusukCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'reported' | 'disabled' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Code Form
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newNicknameInput, setNewNicknameInput] = useState('');

  // Smart Multi-line AI Batch Importer
  const [bulkInput, setBulkInput] = useState('');
  const [detectedCodes, setDetectedCodes] = useState<string[]>([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Auto-parse lines whenever bulkInput changes
  useEffect(() => {
    if (!bulkInput.trim()) {
      setDetectedCodes([]);
      return;
    }
    // Match line-by-line or anywhere in text with pattern NG-[A-Za-z0-9]{6,14}
    const matches = bulkInput.match(/NG-[A-Za-z0-9]{6,14}/gi) || [];
    // If lines without NG- are present, also parse lines that look like valid codes
    const lines = bulkInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const set = new Set<string>();

    matches.forEach((m) => {
      const parts = m.split('-');
      set.add(`NG-${parts[1]}`);
    });

    lines.forEach((l) => {
      let cleaned = l.trim();
      if (!cleaned.toUpperCase().startsWith('NG-') && !cleaned.toUpperCase().startsWith('NG')) {
        cleaned = 'NG-' + cleaned;
      } else if (cleaned.toUpperCase().startsWith('NG') && !cleaned.startsWith('NG-')) {
        cleaned = 'NG-' + cleaned.slice(2);
      }
      if (/^NG-[A-Za-z0-9]{6,14}$/i.test(cleaned)) {
        set.add(cleaned);
      }
    });

    setDetectedCodes(Array.from(set));
  }, [bulkInput]);

  // Pinned Code Form
  const [pinnedCodeInput, setPinnedCodeInput] = useState('');

  // Stats Form
  const [customTotalCodes, setCustomTotalCodes] = useState(stats?.totalCodes || 128);
  const [customActiveUsers, setCustomActiveUsers] = useState(stats?.activeUsers || 18);
  const [customVisitors, setCustomVisitors] = useState(stats?.uniqueVisitors || 1840);

  // Notice Form
  const [noticeEnabled, setNoticeEnabled] = useState(notice.enabled);
  const [noticeText, setNoticeText] = useState(notice.text);

  // Security Form
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeMessage, setPasscodeMessage] = useState<string | null>(null);

  // Success Feedback Toast
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (pinnedCode) {
      setPinnedCodeInput(pinnedCode.code);
    }
  }, [pinnedCode]);

  useEffect(() => {
    if (stats) {
      setCustomTotalCodes(stats.totalCodes);
      setCustomActiveUsers(stats.activeUsers);
      setCustomVisitors(stats.uniqueVisitors);
    }
  }, [stats]);

  const loadCodes = useCallback(async (token: string) => {
    setIsLoadingCodes(true);
    try {
      const data = await fetchAdminCodes(token);
      setAdminCodes(data);
    } catch {
      // fallback
    } finally {
      setIsLoadingCodes(false);
    }
  }, []);

  useEffect(() => {
    if (authToken && isOpen) {
      loadCodes(authToken);
    }
  }, [authToken, isOpen, loadCodes]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoginError(false);
    setIsLoggingIn(true);
    try {
      const token = await adminLogin(passcode.trim());
      if (token) {
        setAuthToken(token);
        sessionStorage.setItem('nusuk_admin_auth', token);
        setPasscode('');
        showNotification('ডাটাবেজ অথেনটিকেশন সফল! এডমিন প্যানেলে স্বাগতম');
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    sessionStorage.removeItem('nusuk_admin_auth');
  };

  const handleAction = async (id: string, action: string) => {
    if (!authToken) return;
    const ok = await performAdminAction(id, action, authToken);
    if (ok) {
      loadCodes(authToken);
      onDataModified();
      showNotification('অ্যাকশন সফলভাবে কার্যকর হয়েছে!');
    }
  };

  const handleAddNewCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newCodeInput.trim();
    if (!raw) return;

    if (!authToken) {
      alert('সেশন মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে পাসকোড দিয়ে পুনরায় লগইন করুন।');
      return;
    }

    const res = await submitAdminCode(raw, newNicknameInput.trim() || 'অ্যাডমিন যুক্ত', authToken);
    if (res.success) {
      setNewCodeInput('');
      setNewNicknameInput('');
      if (res.code) {
        setAdminCodes((prev) => [res.code!, ...prev.filter((c) => c.id !== res.code!.id)]);
      }
      loadCodes(authToken);
      onDataModified();
      showNotification(res.message || 'নতুন কোড সফলভাবে ডাটাবেজে যুক্ত ও লাইভ বোর্ডে প্রকাশিত হয়েছে!');
    } else {
      alert(res.message || 'কোড যোগ করতে সমস্যা হয়েছে বা কোডটি ইতোমধ্যে বিদ্যমান।');
    }
  };

  const handleBulkSubmit = async () => {
    if (detectedCodes.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const res = await submitBatchCodes(detectedCodes, 'স্মার্ট ব্যাচ ইনপুট', authToken || undefined);
      if (res.success) {
        showNotification(`অভিনন্দন! মোট ${res.count}টি কোড সফলভাবে ডাটাবেজে যুক্ত ও লাইভ বোর্ডে প্রকাশিত হয়েছে!`);
        setBulkInput('');
        setDetectedCodes([]);
        if (authToken) loadCodes(authToken);
        onDataModified();
      } else {
        alert('কোডগুলো যোগ করতে সমস্যা হয়েছে: ' + (res.error || 'অজানা ত্রুটি'));
      }
    } catch {
      alert('সার্ভার যোগাযোগে সমস্যা হয়েছে।');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleSavePinnedCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinnedCodeInput.trim();
    if (!clean) return;
    onUpdatePinnedCode(clean);
    if (authToken) {
      await updateAdminSettings({ pinnedCode: clean }, authToken);
    }
    showNotification(`পিন্ড কোড ${clean} ডাটাবেজে স্থায়ীভাবে সংরক্ষিত ও আপডেট হয়েছে!`);
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    const customStats = {
      totalCodes: Number(customTotalCodes) || stats?.totalCodes || 0,
      activeUsers: Number(customActiveUsers) || stats?.activeUsers || 0,
      uniqueVisitors: Number(customVisitors) || stats?.uniqueVisitors || 0,
    };
    if (stats) {
      const updated: AppStats = {
        ...stats,
        ...customStats,
      };
      onUpdateStats(updated);
    }
    if (authToken) {
      await updateAdminSettings({ customStats }, authToken);
    }
    showNotification('লাইভ স্ট্যাটস ডাটাবেজে স্থায়ীভাবে সংরক্ষিত হয়েছে!');
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const noticeData = { enabled: noticeEnabled, text: noticeText };
    onUpdateNotice(noticeData);
    if (authToken) {
      await updateAdminSettings({ notice: noticeData }, authToken);
    }
    showNotification('নোটিশ বার সেটিংস ডাটাবেজে স্থায়ীভাবে সেভ হয়েছে!');
  };

  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim() || newPasscode.length < 4) {
      setPasscodeMessage('পাসকোড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (!authToken) {
      setPasscodeMessage('সেশনের মেয়াদ শেষ, পুনরায় লগইন করুন।');
      return;
    }

    setIsUpdatingPasscode(true);
    try {
      const res = await updateAdminPasscode(newPasscode.trim(), authToken);
      if (res.success) {
        setStoredSecret(newPasscode.trim());
        localStorage.setItem('nusuk_admin_secret', newPasscode.trim());
        setNewPasscode('');
        setPasscodeMessage('গোপন পাসওয়ার্ড সফলভাবে ডাটাবেজে আপডেট ও সুরক্ষিত হয়েছে!');
        showNotification('ডাটাবেজে এডমিন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setPasscodeMessage(null), 3500);
      } else {
        setPasscodeMessage(res.error || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
      }
    } catch {
      setPasscodeMessage('সার্ভারে যোগাযোগ করা যায়নি।');
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify({
      codes: adminCodes,
      stats,
      pinnedCode: pinnedCode?.code,
      notice: { enabled: noticeEnabled, text: noticeText },
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nusuk-hub-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('ডাটাবেজ ব্যাকআপ ডাউনলোড হয়েছে!');
  };

  const filteredCodes = adminCodes.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = c.code.toLowerCase().includes(q) || (c.nickname && c.nickname.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter === 'reported') return (c.reportCount || 0) > 0 || c.status === 'reported';
    if (statusFilter === 'disabled') return c.status === 'disabled';
    if (statusFilter === 'verified') return c.status === 'verified';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#2b2f3b] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-[#262934] shrink-0 bg-slate-50/60 dark:bg-[#141519]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0070e0]/15 dark:bg-[#0070e0]/25 text-[#0070e0] flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
                অ্যাডমিন কন্ট্রোল সেন্টার
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                সম্পূর্ণ ওয়েবসাইট ম্যানেজমেন্ট ও লাইভ কাস্টমাইজেশন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast inside Modal */}
        {actionSuccess && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center animate-in fade-in shrink-0">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Content */}
        {!authToken ? (
          /* Login Form */
          <div className="p-8 max-w-sm mx-auto text-center my-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#132238] border border-blue-200 dark:border-[#20446e] flex items-center justify-center text-[#0070e0] mx-auto shadow-xs">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-neutral-100 mb-1">
                গোপন পাসওয়ার্ড দিয়ে প্রবেশ করুন
              </h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                এডমিন প্যানেলে প্রবেশের জন্য নির্ধারিত পাসওয়ার্ড প্রয়োজন।
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 pt-2">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="গোপন পাসওয়ার্ড লিখুন..."
                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-300 dark:border-[#2d313d] text-center font-mono text-sm text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-[#0070e0] tracking-wider transition-colors"
                autoFocus
                required
              />

              {loginError && (
                <p className="text-xs text-rose-500 font-medium">ভুল পাসওয়ার্ড, অনুগ্রহ করে পুনরায় চেষ্টা করুন।</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-10 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ডাটাবেজ যাচাই হচ্ছে...</span>
                    </>
                  ) : (
                    <span>ডাটাবেজ যাচাই করে প্রবেশ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Admin Main Screen with 5 Tabs */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs Bar */}
            <div className="flex items-center gap-1.5 px-4 pt-3 border-b border-slate-200 dark:border-[#252834] overflow-x-auto shrink-0 bg-slate-50/40 dark:bg-[#15161c]">
              {[
                { id: 'pinned', label: '📌 পিন্ড কার্ড', icon: <Pin className="w-3.5 h-3.5" /> },
                { id: 'codes', label: '📋 কোড পরিচালনা', icon: <Edit2 className="w-3.5 h-3.5" /> },
                { id: 'stats', label: '📊 লাইভ স্ট্যাটস', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { id: 'notice', label: '📢 নোটিশ বার', icon: <Megaphone className="w-3.5 h-3.5" /> },
                { id: 'security', label: '⚙️ ব্যাকআপ ও পাসওয়ার্ড', icon: <Settings className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer border-t border-x transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-[#1c1e24] text-[#0070e0] dark:text-sky-300 border-slate-200 dark:border-[#2b2f3b] shadow-xs'
                      : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="ml-auto px-2.5 py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold cursor-pointer shrink-0"
              >
                লগআউট
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: PINNED CODE MANAGEMENT */}
              {activeTab === 'pinned' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-blue-900 dark:text-sky-300 flex items-center gap-1.5">
                      <Pin className="w-4 h-4 text-[#0070e0] dark:text-sky-400 rotate-45" />
                      <span>হোম পেজের পিন্ড কার্ড কোড কাস্টমাইজ করুন</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                      এখানে যে কোডটি সেভ করবেন, সেটি হোম পেজের সবার উপরের ভিআইপি পিন্ড কার্ডে স্থায়ীভাবে প্রদর্শিত হবে এবং "কপি করুন" বাটনে ক্লিক করলে এই কোডটিই সরাসরি নুসুক অ্যাপে চলে যাবে।
                    </p>
                  </div>

                  <form onSubmit={handleSavePinnedCode} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#262934] space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                        পিন্ড রেফারেল কোড (Nusuk Referral Code)
                      </label>
                      <input
                        type="text"
                        value={pinnedCodeInput}
                        onChange={(e) => setPinnedCodeInput(e.target.value.toUpperCase())}
                        placeholder="যেমন: NG-ElOBvwzz"
                        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] font-mono text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider focus:outline-none focus:border-[#0070e0]"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="h-10 px-5 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
                      >
                        পিন্ড কোড সেভ করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinnedCodeInput('NG-ElOBvwzz')}
                        className="h-10 px-3.5 rounded-xl bg-slate-200 dark:bg-[#242730] text-slate-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer"
                      >
                        ডিফল্ট (NG-ElOBvwzz)
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: CODES MANAGEMENT */}
              {activeTab === 'codes' && (
                <div className="space-y-4">
                  {/* Smart Multi-Line Batch Code Importer */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#132238] border border-blue-200 dark:border-[#20446e] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">✨</span>
                        <h4 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-sky-200">
                          একাধিক কোড স্মার্ট ব্যাচ ইনপুট (Multi-Line Smart Parser)
                        </h4>
                      </div>
                      {detectedCodes.length > 0 && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-in fade-in">
                          {detectedCodes.length}টি কোড সনাক্ত হয়েছে
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                      এখানে প্রতিটি লাইনে একটি করে কোড পেস্ট করুন (যেমন: <code>NG-ElOBvwzz</code>)। স্মার্ট পার্সার প্রতিটি লাইনের কোড আলাদা করে যাচাই ও নির্ভুলভাবে একসাথে ডাটাবেজে যুক্ত করে দেবে।
                    </p>

                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder={`NG-ElOBvwzz\nNG-K8M92PQX\nNG-DnRp2xqH\nNG-wBaPOWFF...`}
                      rows={4}
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] font-mono text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-[#0070e0]"
                    />

                    {/* Detected Code Chips Preview */}
                    {detectedCodes.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-2 rounded-xl bg-white dark:bg-[#121316] border border-slate-200 dark:border-[#262934]">
                        {detectedCodes.map((code, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#20222a] text-[#0070e0] dark:text-sky-300 border border-slate-200 dark:border-[#333745]"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleBulkSubmit}
                        disabled={detectedCodes.length === 0 || isBulkSubmitting}
                        className={`h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          detectedCodes.length === 0
                            ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-[#242730] text-slate-400'
                            : 'bg-[#0070e0] hover:bg-[#0060c0] text-white shadow-sm shadow-blue-500/20 active:scale-95'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isBulkSubmitting ? 'যোগ হচ্ছে...' : `একসাথে এই ${detectedCodes.length}টি কোড যুক্ত করুন`}</span>
                      </button>

                      {bulkInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setBulkInput('');
                            setDetectedCodes([]);
                          }}
                          className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-[#242730] text-slate-600 dark:text-neutral-400 text-xs font-semibold cursor-pointer"
                        >
                          মুছে ফেলুন
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add Single Code Form */}
                  <form onSubmit={handleAddNewCode} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#262934] flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={newCodeInput}
                      onChange={(e) => setNewCodeInput(e.target.value.trim())}
                      placeholder="একক রেফারেল কোড (যেমন: NG-ElOBvwzz)"
                      className="flex-1 min-w-[180px] h-9 px-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] font-mono text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newNicknameInput}
                      onChange={(e) => setNewNicknameInput(e.target.value)}
                      placeholder="নাম/ডাকনাম (ঐচ্ছিক)"
                      className="w-36 h-9 px-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>যুক্ত করুন</span>
                    </button>
                  </form>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      {(['all', 'verified', 'reported', 'disabled'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                            statusFilter === st
                              ? 'bg-[#0070e0] text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-[#242730] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#363a48]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="কোড খুঁজুন..."
                        className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-[#121316] border border-slate-300 dark:border-[#333745] text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => authToken && loadCodes(authToken)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#242730] border border-slate-200 dark:border-[#363a48] text-slate-600 dark:text-neutral-400 cursor-pointer"
                        title="রিলোড"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCodes ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Codes List */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {filteredCodes.map((codeItem) => (
                      <div
                        key={codeItem.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-colors ${
                          codeItem.status === 'disabled'
                            ? 'bg-rose-500/5 border-rose-500/20 opacity-70'
                            : (codeItem.reportCount || 0) > 0
                            ? 'bg-sky-500/10 border-sky-500/30'
                            : 'bg-slate-50 dark:bg-[#121316] border-slate-200 dark:border-[#262934]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              {codeItem.code}
                            </span>
                            {codeItem.isPinned && (
                              <span className="text-[9px] bg-[#0070e0] text-white px-1.5 py-0.5 rounded-full font-bold">
                                PINNED
                              </span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#242730] text-slate-700 dark:text-neutral-300 uppercase font-semibold">
                              {codeItem.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                            <span>কপি: {codeItem.copyCount}</span>
                            <span>রিপোর্ট: {codeItem.reportCount || 0}</span>
                            <span>{formatTimeAgo(codeItem.createdAt, language)}</span>
                            {codeItem.nickname && <span>বাই: {codeItem.nickname}</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleAction(codeItem.id, 'pin')}
                            title="Toggle Pin"
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                              codeItem.isPinned
                                ? 'bg-[#0070e0] text-white border-blue-600 font-bold'
                                : 'bg-slate-100 dark:bg-[#242730] text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-[#363a48]'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5 rotate-45" />
                          </button>

                          <button
                            onClick={() => handleAction(codeItem.id, 'verify')}
                            title="যাচাই করুন"
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          {codeItem.status === 'disabled' ? (
                            <button
                              onClick={() => handleAction(codeItem.id, 'restore')}
                              title="পুনরুদ্ধার করুন"
                              className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-sky-400 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(codeItem.id, 'disable')}
                              title="হাইড করুন"
                              className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 cursor-pointer"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleAction(codeItem.id, 'delete')}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: STATS MANAGEMENT */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#132238] border border-blue-200 dark:border-[#20446e] space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-blue-900 dark:text-sky-300 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#0070e0]" />
                      <span>লাইভ বোর্ডের স্ট্যাটস কাস্টমাইজেশন</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                      হোম পেজের উপরের ক্যাপসুল বারে প্রদর্শিত সংখ্যাগুলো সরাসরি পরিবর্তন ও আপডেট করুন।
                    </p>
                  </div>

                  <form onSubmit={handleSaveStats} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#262934] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                          মোট কোড শেয়ার সংখ্যা
                        </label>
                        <input
                          type="number"
                          value={customTotalCodes}
                          onChange={(e) => setCustomTotalCodes(Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] font-mono text-sm font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                          সক্রিয় ব্যবহারকারী সংখ্যা
                        </label>
                        <input
                          type="number"
                          value={customActiveUsers}
                          onChange={(e) => setCustomActiveUsers(Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] font-mono text-sm font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                          মোট ভিজিট সংখ্যা
                        </label>
                        <input
                          type="number"
                          value={customVisitors}
                          onChange={(e) => setCustomVisitors(Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] font-mono text-sm font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="h-10 px-5 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
                      >
                        স্ট্যাটস সেভ করুন
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: NOTICE MANAGEMENT */}
              {activeTab === 'notice' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#262934] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-[#0070e0]" />
                        <span>জরুরি ঘোষণা ও নোটিশ বার</span>
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={noticeEnabled}
                          onChange={(e) => setNoticeEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0070e0]"
                        />
                        <span>নোটিশ চালু রাখুন</span>
                      </label>
                    </div>

                    <textarea
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                      rows={3}
                      placeholder="নোটিশের লেখা এখানে লিখুন..."
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0070e0]"
                    />

                    <button
                      onClick={handleSaveNotice}
                      className="h-10 px-5 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
                    >
                      নোটিশ আপডেট করুন
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: SECURITY & BACKUP */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  {/* Change Passcode */}
                  <form onSubmit={handleChangePasscode} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#262934] space-y-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#0070e0]" />
                      <span>গোপন পাসওয়ার্ড পরিবর্তন</span>
                    </h4>

                    <div>
                      <input
                        type="password"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="নতুন গোপন পাসওয়ার্ড লিখুন..."
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-300 dark:border-[#333745] text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    {passcodeMessage && (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{passcodeMessage}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingPasscode}
                      className="h-9 px-4 rounded-xl bg-[#0070e0] hover:bg-[#0060c0] text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isUpdatingPasscode ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>ডাটাবেজে সেভ হচ্ছে...</span>
                        </>
                      ) : (
                        <span>ডাটাবেজে পাসওয়ার্ড সংরক্ষণ করুন</span>
                      )}
                    </button>
                  </form>

                  {/* Backup & Export */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#262934] space-y-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-[#0070e0]" />
                      <span>ডাটাবেজ ব্যাকআপ ও এক্সপোর্ট</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-400">
                      সকল রেফারেল কোড, স্ট্যাটস ও কনফিগারেশন এর ১-ক্লিক ব্যাকআপ ডাউনলোড করুন।
                    </p>
                    <button
                      onClick={handleExportBackup}
                      className="h-9 px-4 rounded-xl bg-slate-200 dark:bg-[#242730] hover:bg-slate-300 dark:hover:bg-[#2d313d] text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ডাটাবেজ JSON ডাউনলোড করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
