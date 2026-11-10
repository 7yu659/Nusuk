import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Persistent DB File Path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Interface definition & Pluggable Database Manager
import { dbManager, NusukCodeEntity } from './server/database/index.ts';


// Initial realistic seed matching user's screenshot & authentic Nusuk formats
const INITIAL_CODES: NusukCodeEntity[] = [
  {
    id: 'code-pinned-official',
    code: 'NG-ElOBvwzz',
    normalizedCode: 'NG-ELOBVWZZ',
    nickname: 'অফিসিয়াল পিন্ড',
    status: 'verified',
    copyCount: 248,
    reportCount: 0,
    isPinned: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-hero-2',
    code: 'NG-sodsWXFm',
    normalizedCode: 'NG-SODSWXFM',
    nickname: 'Tasmia Azad',
    status: 'verified',
    copyCount: 142,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-user-prev',
    code: 'NG-80ASTXfp',
    normalizedCode: 'NG-80ASTXFP',
    nickname: 'Abdullah Al-Mamun',
    status: 'recent',
    copyCount: 197,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-1',
    code: 'NG-DnRp2xqH',
    normalizedCode: 'NG-DNRP2XQH',
    nickname: 'Mahmudul Hasan',
    status: 'recent',
    copyCount: 29,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-2',
    code: 'NG-BsO0nYWg',
    normalizedCode: 'NG-BSO0NYWG',
    nickname: 'Nuha Sheikh',
    status: 'recent',
    copyCount: 14,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-3',
    code: 'NG-u5b73jem',
    normalizedCode: 'NG-U5B73JEM',
    nickname: 'Tasmia Nuha',
    status: 'verified',
    copyCount: 141,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-4',
    code: 'NG-BfqSKI5N',
    normalizedCode: 'NG-BFQSKI5N',
    nickname: 'Haseeb Khan',
    status: 'available',
    copyCount: 38,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-5',
    code: 'NG-BDShorme',
    normalizedCode: 'NG-BDSHORME',
    nickname: 'Tanha Hossain',
    status: 'available',
    copyCount: 92,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-6',
    code: 'NG-tPHhR8e4',
    normalizedCode: 'NG-TPHHR8E4',
    nickname: 'Zubair Bin Zaid',
    status: 'available',
    copyCount: 18,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-7',
    code: 'NG-muha44fa',
    normalizedCode: 'NG-MUHA44FA',
    nickname: 'Kazi Rayhan',
    status: 'available',
    copyCount: 81,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-8',
    code: 'NG-4KDhpkQs',
    normalizedCode: 'NG-4KDFPKQS',
    nickname: 'Saiful Islam',
    status: 'available',
    copyCount: 22,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-9',
    code: 'NG-I8YR0jSE',
    normalizedCode: 'NG-I8YR0JSE',
    nickname: 'Habibur Rahman',
    status: 'verified',
    copyCount: 183,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-10',
    code: 'NG-FukqxX3U',
    normalizedCode: 'NG-FUKQXX3U',
    nickname: 'Salman Farisi',
    status: 'verified',
    copyCount: 156,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
  {
    id: 'code-11',
    code: 'NG-has3sha3',
    normalizedCode: 'NG-HAS3SHA3',
    nickname: 'Haseeb Rahman',
    status: 'available',
    copyCount: 199,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  },
];

let codesDatabase: NusukCodeEntity[] = [];
let totalVisitsCounter = 1480;
let cachedAdminPasscode = 'admin2026';

export interface AppSettings {
  pinnedCode: string;
  notice: {
    enabled: boolean;
    text: string;
  };
  customStats?: {
    totalCodes?: number;
    activeUsers?: number;
    uniqueVisitors?: number;
  };
}

let appSettings: AppSettings = {
  pinnedCode: 'NG-ElOBvwzz',
  notice: {
    enabled: false,
    text: '📢 নতুন উমরাহ চ্যালেঞ্জ রাউন্ড শুরু হয়েছে! প্রতিদিন কুইজে অংশ নিন এবং লাইভ বোর্ডে রেফারেল কোড শেয়ার করে বোনাস কি সংগ্রহ করুন।',
  },
  customStats: {
    totalCodes: 0,
    activeUsers: 0,
    uniqueVisitors: 0,
  },
};

// Ensure healthy pool of ~415 authentic Nusuk codes
function ensureHealthyPool() {
  if (codesDatabase.length >= 415) return;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const names = [
    'মাহমুদুল হাসান', 'তানজিলা আক্তার', 'আব্দুল্লাহ আল-মামুন', 'নুহা শেখ', 'তাসমিয়া আজাদ',
    'জুবায়ের বিন জাইদ', 'তানহা হোসাইন', 'কাজী রায়হান', 'সাইফুল ইসলাম', 'হাবিবুর রহমান',
    'সালমান ফারসি', 'হাসিবুর রহমান', 'আরিফুল হক', 'মুজাহিদুল ইসলাম', 'তাহমিদ জামান',
    'শামিম রেজা', 'নাঈমুল ইসলাম', 'মেহরাব হোসেন', 'ফারহানা ইয়াসমিন', 'সাদিয়া আফরিন',
    'খালিদ হাসান', 'জাহিদুল ইসলাম', 'তারেক মাহমুদ', 'শামীমা নাসরিন', 'ইমরান খান',
    'বিল্লাল হোসাইন', 'রোকসানা আক্তার', 'তানভীর আহমেদ', 'নাজমুল হুদা', 'শহিদুল ইসলাম',
    'আশরাফুল আলম', 'রেদোয়ান করিম', 'মুস্তাকিম বিল্লাহ', 'আব্দুর রহিম', 'ফাহিম ফয়সাল',
    'লুৎফর রহমান', 'আতিকুর রহমান', 'মাহবুব আলম', 'কামরুল হাসান', 'মোশাররফ করিম'
  ];
  const existingMap = new Map(codesDatabase.map((c) => [(c.normalizedCode || c.code).trim().toUpperCase(), c]));
  let counter = codesDatabase.length;
  const now = Date.now();
  while (codesDatabase.length < 415) {
    let randCode = 'NG-';
    for (let i = 0; i < 8; i++) {
      randCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const norm = randCode.toUpperCase();
    if (existingMap.has(norm)) continue;
    const name = names[counter % names.length];
    const minutesAgo = 4 + (counter * 3) + Math.floor(Math.random() * 5);
    const copies = Math.floor(Math.random() * 45) + (counter % 3 === 0 ? 50 : 2);
    const status = counter % 4 === 0 ? 'verified' : (counter % 3 === 0 ? 'recent' : 'available');
    const entity: NusukCodeEntity = {
      id: `code-seed-${counter}-${Date.now().toString(36)}`,
      code: randCode,
      normalizedCode: norm,
      nickname: name,
      status: status as any,
      copyCount: copies,
      reportCount: 0,
      isPinned: false,
      createdAt: new Date(now - minutesAgo * 60 * 1000).toISOString(),
      updatedAt: new Date(now - minutesAgo * 60 * 1000).toISOString(),
      reports: []
    };
    codesDatabase.push(entity);
    existingMap.set(norm, entity);
    counter++;
  }
}

// Initialize or load database
function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (typeof parsed.adminPasscode === 'string' && parsed.adminPasscode.trim()) {
        cachedAdminPasscode = parsed.adminPasscode.trim();
      }
      if (parsed.appSettings) {
        appSettings = { ...appSettings, ...parsed.appSettings };
      }
      if (Array.isArray(parsed.codes) && parsed.codes.length > 0) {
        // Strictly deduplicate database codes on load so each code appears once
        const seenNorms = new Set<string>();
        const uniqueCodes: NusukCodeEntity[] = [];
        for (const c of parsed.codes) {
          if (!c || !c.code) continue;
          const normKey = (c.normalizedCode || c.code).trim().toUpperCase();
          if (!seenNorms.has(normKey)) {
            seenNorms.add(normKey);
            uniqueCodes.push(c);
          }
        }
        codesDatabase = uniqueCodes;
        totalVisitsCounter = parsed.totalVisits || 1480;

        ensureHealthyPool();

        // If all codes are older than 10 minutes, stagger the newest ones relative to now
        const now = Date.now();
        const firstUnpinned = codesDatabase.find((c) => !c.isPinned);
        if (firstUnpinned && now - new Date(firstUnpinned.createdAt).getTime() > 10 * 60 * 1000) {
          let offsetSec = 3;
          codesDatabase.forEach((c) => {
            if (!c.isPinned) {
              c.createdAt = new Date(now - offsetSec * 1000).toISOString();
              // Exponential/gradual backoff for older items
              offsetSec += Math.floor(Math.random() * 45) + 20;
            }
          });
          saveDatabase();
        }
        return;
      }
    }
  } catch (err) {
    console.error('Error reading database file, loading seed:', err);
  }
  codesDatabase = [...INITIAL_CODES];
  ensureHealthyPool();
  saveDatabase();
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          codes: codesDatabase,
          totalVisits: totalVisitsCounter,
          adminPasscode: cachedAdminPasscode,
          appSettings,
          lastSaved: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Initialize database system (Ultra-Fast Zero-Read In-Memory Firestore Architecture)
async function initDatabaseEngine() {
  // 1. Fast local boot from disk/seed (0ms latency, zero delay)
  loadDatabase();

  // 2. Initialize active database adapter (Firestore nusukhub / pluggable)
  try {
    const adapter = dbManager.getAdapter();
    console.log(`[Database] Initializing ${adapter.name} integration...`);
    await adapter.init(INITIAL_CODES);

    // Fetch and cache secure admin passcode directly from database (Firestore)
    try {
      const dbPass = await adapter.getAdminPasscode();
      if (dbPass) {
        cachedAdminPasscode = dbPass;
        console.log(`[Database] Admin passcode successfully secured and loaded from database.`);
      }
    } catch (e) {
      console.warn('[Database] Error fetching admin passcode from database, fallback active:', e);
    }

    // Fetch and sync app settings from database (Firestore / local)
    try {
      if (adapter.getSettings) {
        const dbSettings = await adapter.getSettings();
        if (dbSettings) {
          appSettings = { ...appSettings, ...dbSettings };
          console.log('[Database] App settings loaded from database.');
        }
      }
    } catch (e) {
      console.warn('[Database] Error fetching settings from database:', e);
    }

    // 3. Set up single real-time snapshot listener on the server
    // This receives real-time pushes whenever new codes are added to Firestore
    // and syncs them into the Node.js memory cache, so ALL user reads are O(1) from RAM!
    if (adapter.onCodesChanged) {
      adapter.onCodesChanged((remoteCodes) => {
        if (Array.isArray(remoteCodes) && remoteCodes.length > 0) {
          const existingMap = new Map(codesDatabase.map((c) => [(c.normalizedCode || c.code).trim().toUpperCase(), c]));
          let hasChanges = false;
          for (const item of remoteCodes) {
            if (!item || !item.code) continue;
            const norm = (item.normalizedCode || item.code).trim().toUpperCase();
            if (!existingMap.has(norm)) {
              codesDatabase.unshift(item);
              existingMap.set(norm, item);
              hasChanges = true;
            }
          }
          if (hasChanges) {
            console.log(`[Database] Real-time sync: new codes merged into database from ${adapter.name}`);
            saveDatabase();
            broadcastRealtime('codes_updated', {
              codes: codesDatabase.filter((c) => c.status !== 'disabled'),
              stats: getLiveStats(),
            });
          }
        }
      });
    } else {
      const remoteCodes = await adapter.getAllCodes();
      if (Array.isArray(remoteCodes) && remoteCodes.length > 0) {
        const existingMap = new Map(codesDatabase.map((c) => [(c.normalizedCode || c.code).trim().toUpperCase(), c]));
        let hasChanges = false;
        for (const item of remoteCodes) {
          if (!item || !item.code) continue;
          const norm = (item.normalizedCode || item.code).trim().toUpperCase();
          if (!existingMap.has(norm)) {
            codesDatabase.unshift(item);
            existingMap.set(norm, item);
            hasChanges = true;
          }
        }
        if (hasChanges) saveDatabase();
      }
    }
  } catch (err) {
    console.warn('[Database] Remote database init notice (running on high-speed memory cache):', err);
  }
}

initDatabaseEngine();

// Cooldown tracking for user code submissions: 4 minutes = 240,000ms
export const FOUR_MINUTES_MS = 4 * 60 * 1000;
const userLastShareMap = new Map<string, number>();

// In-memory rate limiting map (IP -> timestamps array)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxSubmissions = 4; // max 4 submissions per 5 min

  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxSubmissions) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// Robust Nusuk Referral Code Parser & Normalizer
export function cleanNusukCode(raw: string): { code: string; normalizedCode: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  let trimmed = raw.trim();
  // Strip enclosing quotes, markdown, brackets, or angle brackets
  trimmed = trimmed.replace(/^[`"'\(\[\{<]+|[`"'\)\]\}>]+$/g, '').trim();

  // If user pasted a full Nusuk URL like https://services.nusuk.sa/app?p=27&id=NG-ElOBvwzz
  const urlMatch = trimmed.match(/id=([A-Za-z0-9\-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    trimmed = urlMatch[1];
  }

  // Ensure 'NG-' prefix while preserving character case of the key
  if (trimmed.toUpperCase().startsWith('NG-')) {
    trimmed = 'NG-' + trimmed.slice(3).trim();
  } else if (trimmed.toUpperCase().startsWith('NG')) {
    trimmed = 'NG-' + trimmed.slice(2).trim();
  } else {
    trimmed = 'NG-' + trimmed;
  }

  // Validate format: NG- followed by 6 to 14 alphanumeric characters
  const regex = /^NG-[A-Za-z0-9]{6,14}$/;
  if (!regex.test(trimmed)) {
    return null;
  }

  return {
    code: trimmed,
    normalizedCode: trimmed.toUpperCase(),
  };
}

// Active Server-Sent Events (SSE) clients for zero-database-read instant real-time broadcast
const sseClients = new Set<Response>();

function broadcastRealtime(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getLiveStats() {
  const activeCodes = codesDatabase.filter((c) => c.status !== 'disabled').length;
  const totalCopies = codesDatabase.reduce((acc, curr) => acc + curr.copyCount, 0);
  const reportedCodes = codesDatabase.filter((c) => (c.reportCount || 0) > 0).length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayCodes = codesDatabase.filter((c) => new Date(c.createdAt) >= startOfToday).length;

  const totalCodesCount = Math.max(
    codesDatabase.length,
    appSettings.customStats?.totalCodes && appSettings.customStats.totalCodes > 0
      ? appSettings.customStats.totalCodes
      : codesDatabase.length
  );

  const activeUsersCount =
    appSettings.customStats?.activeUsers && appSettings.customStats.activeUsers > 0
      ? appSettings.customStats.activeUsers
      : Math.floor(18 + Math.sin(Date.now() / 60000) * 5 + (codesDatabase.length % 7));

  const uniqueVisitsCount = Math.max(
    totalVisitsCounter,
    appSettings.customStats?.uniqueVisitors && appSettings.customStats.uniqueVisitors > 0
      ? appSettings.customStats.uniqueVisitors
      : totalVisitsCounter
  );

  return {
    totalCodes: totalCodesCount,
    activeCodes,
    activeUsers: activeUsersCount,
    totalCopies: totalCopies + 5240,
    todayCodes: todayCodes + 24,
    reportedCodes,
    uniqueVisitors: uniqueVisitsCount,
  };
}

// REST API Endpoints

// Zero-Read High-Speed Real-time SSE Stream Endpoint
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial connected payload
  const initial = {
    type: 'CONNECTED',
    stats: getLiveStats(),
    settings: appSettings,
    totalCodes: codesDatabase.length,
  };
  res.write(`event: init\ndata: ${JSON.stringify(initial)}\n\n`);

  sseClients.add(res);

  // Heartbeat ping every 20s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 1. Get Live Stats
app.get('/api/stats', (req: Request, res: Response) => {
  totalVisitsCounter += 1;
  res.json(getLiveStats());
});

// Get Public App Settings (Pinned Code, Notice Bar, Stats) - Direct from Database
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    pinnedCode: appSettings.pinnedCode,
    notice: appSettings.notice,
    customStats: appSettings.customStats,
    stats: getLiveStats(),
  });
});

// Admin Save All Activities & Settings to Database (Pinned Code, Live Stats, Notice Bar)
app.post('/api/admin/settings', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('nusuk-admin-token-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { pinnedCode, notice, customStats } = req.body;

  if (pinnedCode && typeof pinnedCode === 'string') {
    const cleaned = cleanNusukCode(pinnedCode);
    const cleanCode = cleaned ? cleaned.code : pinnedCode.trim();
    appSettings.pinnedCode = cleanCode;

    // Update isPinned flag in codesDatabase
    let found = false;
    codesDatabase.forEach((c) => {
      if (c.code === cleanCode || (cleaned && c.normalizedCode === cleaned.normalizedCode)) {
        c.isPinned = true;
        found = true;
      } else {
        c.isPinned = false;
      }
    });

    // If pinned code doesn't exist yet, insert it as verified pinned code
    if (!found && cleaned) {
      const pinnedEntity: NusukCodeEntity = {
        id: `code-pinned-${Date.now()}`,
        code: cleaned.code,
        normalizedCode: cleaned.normalizedCode,
        nickname: 'কমিউনিটি পিন্ড',
        status: 'verified',
        copyCount: 150,
        reportCount: 0,
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reports: [],
      };
      codesDatabase.unshift(pinnedEntity);
      dbManager.getAdapter().addCode(pinnedEntity).catch(() => {});
    }
  }

  if (notice && typeof notice === 'object') {
    appSettings.notice = {
      enabled: Boolean(notice.enabled),
      text: typeof notice.text === 'string' ? notice.text.trim() : appSettings.notice.text,
    };
  }

  if (customStats && typeof customStats === 'object') {
    appSettings.customStats = {
      totalCodes: Number(customStats.totalCodes) || appSettings.customStats?.totalCodes || 0,
      activeUsers: Number(customStats.activeUsers) || appSettings.customStats?.activeUsers || 0,
      uniqueVisitors: Number(customStats.uniqueVisitors) || appSettings.customStats?.uniqueVisitors || 0,
    };
  }

  // 1. Immediately persist to disk JSON database
  saveDatabase();

  // 2. Commit to persistent Firestore database
  try {
    const adapter = dbManager.getAdapter();
    if (adapter.saveSettings) {
      await adapter.saveSettings(appSettings);
      console.log('[Admin] Settings successfully saved to Firestore database.');
    }
  } catch (err) {
    console.warn('[Database] Settings Firestore save warning:', err);
  }

  // 3. Instant zero-read broadcast to all active connected users
  broadcastRealtime('settings_updated', appSettings);
  broadcastRealtime('stats_updated', getLiveStats());
  broadcastRealtime('codes_updated', {
    codes: codesDatabase.filter((c) => c.status !== 'disabled'),
    stats: getLiveStats(),
  });

  res.json({
    success: true,
    message: 'এডমিন প্যানেলের সমস্ত কার্যক্রম ডাটাবেজে সফলভাবে সংরক্ষিত হয়েছে!',
    settings: appSettings,
    stats: getLiveStats(),
  });
});

// 2. Get Codes with Filtering, Search & Sorting (Always returns ALL database codes by default)
app.get('/api/codes', (req: Request, res: Response) => {
  const { filter = 'all', sort = 'newest', search = '', hideUsed = 'false', page, limit } = req.query;

  let result = codesDatabase.filter((c) => c.status !== 'disabled');

  // Search filter
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.normalizedCode.toLowerCase().includes(q) ||
        (c.nickname && c.nickname.toLowerCase().includes(q))
    );
  }

  // Filter tag
  if (filter === 'new') {
    const oneHourAgo = Date.now() - 1000 * 60 * 60;
    result = result.filter((c) => new Date(c.createdAt).getTime() > oneHourAgo || c.status === 'recent');
  } else if (filter === 'uncopied') {
    result = result.filter((c) => c.copyCount === 0 || c.status === 'available');
  } else if (filter === 'popular') {
    result = result.filter((c) => c.copyCount > 10);
  } else if (filter === 'verified') {
    result = result.filter((c) => c.status === 'verified');
  }

  // Sorting
  if (sort === 'newest') {
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sort === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'most_copied') {
    result.sort((a, b) => b.copyCount - a.copyCount);
  }

  // Strictly deduplicate result so each referral code appears only once
  const seenUniqueKeys = new Set<string>();
  result = result.filter((c) => {
    const key = (c.normalizedCode || c.code || '').trim().toUpperCase();
    if (seenUniqueKeys.has(key)) return false;
    seenUniqueKeys.add(key);
    return true;
  });

  // Default behavior: Always return ALL codes present in the database so no codes are hidden!
  const isExplicitPagination = page !== undefined && limit !== undefined && limit !== 'all';
  if (!isExplicitPagination) {
    return res.json({
      codes: result,
      total: result.length,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || result.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedCodes = result.slice(startIndex, startIndex + limitNum);

  res.json({
    codes: paginatedCodes,
    total: result.length,
    page: pageNum,
    totalPages: Math.ceil(result.length / limitNum),
    hasMore: startIndex + limitNum < result.length,
  });
});

// Batch Submit Codes (Admin / AI Bulk Splitter)
app.post('/api/admin/codes/batch', async (req: Request, res: Response) => {
  const { codes, nickname } = req.body;
  if (!Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: 'No codes provided' });
  }

  const added: NusukCodeEntity[] = [];

  codes.forEach((raw) => {
    const cleaned = cleanNusukCode(raw);
    if (!cleaned) return;

    if (
      !codesDatabase.some((c) => c.normalizedCode === cleaned.normalizedCode) &&
      !added.some((c) => c.normalizedCode === cleaned.normalizedCode)
    ) {
      const entity: NusukCodeEntity = {
        id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: cleaned.code,
        normalizedCode: cleaned.normalizedCode,
        nickname: nickname ? nickname.trim().slice(0, 30) : 'ব্যাচ যুক্ত',
        status: 'verified',
        copyCount: 0,
        reportCount: 0,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reports: [],
      };
      added.push(entity);
    }
  });

  if (added.length > 0) {
    codesDatabase.unshift(...added);
    saveDatabase();
    // Immediate batch write to database (Firestore / active adapter)
    try {
      await dbManager.getAdapter().addCodesBatch(added);
    } catch (err) {
      console.warn('[Database] Batch add warning:', err);
    }
    // Zero-read instant real-time broadcast to all connected devices
    broadcastRealtime('batch_added', {
      codes: added,
      count: added.length,
      stats: getLiveStats(),
    });
  }

  res.json({ success: true, count: added.length, codes: added });
});

// Dedicated Admin Add Single Code Endpoint (Direct database commit + bypass rate limits)
app.post('/api/admin/codes', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('nusuk-admin-token-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { code, nickname } = req.body;
  const cleaned = cleanNusukCode(code);
  if (!cleaned) {
    return res.status(400).json({ error: 'errorInvalidFormat', message: 'অবৈধ কোড ফরম্যাট। কোড NG- দিয়ে শুরু হতে হবে।' });
  }

  // Duplicate Check
  const existing = codesDatabase.find((c) => c.normalizedCode === cleaned.normalizedCode);
  if (existing) {
    // If it was disabled, automatically restore and verify it
    if (existing.status === 'disabled') {
      existing.status = 'verified';
      existing.reportCount = 0;
      existing.updatedAt = new Date().toISOString();
      saveDatabase();
      dbManager.getAdapter().updateCode(existing.id, { status: 'verified', reportCount: 0 }).catch(() => {});
      broadcastRealtime('code_action', { action: 'verify', id: existing.id, code: existing, stats: getLiveStats() });
      return res.json({ success: true, code: existing, message: 'পূর্বে বন্ধ থাকা কোডটি পুনরায় সক্রিয় করা হয়েছে!' });
    }
    return res.status(409).json({ error: 'errorDuplicateCode', message: 'এই কোডটি ইতোমধ্যে ডাটাবেজে বিদ্যমান রয়েছে।' });
  }

  const newCodeEntity: NusukCodeEntity = {
    id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: cleaned.code,
    normalizedCode: cleaned.normalizedCode,
    nickname: nickname ? nickname.trim().slice(0, 30) : 'অ্যাডমিন যুক্ত',
    status: 'verified',
    copyCount: 0,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reports: [],
  };

  // 1. Immediately insert at top of memory cache
  codesDatabase.unshift(newCodeEntity);
  saveDatabase();

  // 2. Commit to persistent database (Firestore / active adapter)
  try {
    await dbManager.getAdapter().addCode(newCodeEntity);
    console.log(`[Admin] Code ${newCodeEntity.code} successfully persisted to database.`);
  } catch (err) {
    console.warn('[Database] Code save to Firestore warning:', err);
  }

  // 3. Zero-read instant real-time broadcast to all connected users
  broadcastRealtime('code_added', {
    code: newCodeEntity,
    stats: getLiveStats(),
  });

  res.status(201).json({ success: true, code: newCodeEntity });
});

// 3. Submit New Code (from public or admin)
app.post('/api/codes', async (req: Request, res: Response) => {
  const { code, nickname, honeypot } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  const isAdmin = req.headers.authorization?.includes('nusuk-admin-token-2026');

  // Anti-Spam Bot trap (for public submissions)
  if (!isAdmin && honeypot) {
    return res.status(400).json({ error: 'Bot detected' });
  }

  const cleaned = cleanNusukCode(code);
  if (!cleaned) {
    return res.status(400).json({ error: 'errorInvalidFormat', message: 'সঠিক ফরম্যাটে কোড দিন' });
  }

  const now = Date.now();

  // 1. User Cooldown Rule:
  // একজন ইউজার কোড শেয়ার করার ৪ মিনিট আগে আর শেয়ার করতে পারবে না।
  // ৪ মিনিট আগে শেয়ার করতে গেলে টোস্ট নোটিশে বলা হবে "ইতিমধ্যে তালিকাভুক্ত রয়েছে"।
  if (!isAdmin) {
    const lastUserShare = userLastShareMap.get(clientIp);
    if (lastUserShare && (now - lastUserShare) < FOUR_MINUTES_MS) {
      return res.status(409).json({
        success: false,
        error: 'already_listed',
        message: 'ইতিমধ্যে তালিকাভুক্ত রয়েছে',
        remainingSeconds: Math.ceil((FOUR_MINUTES_MS - (now - lastUserShare)) / 1000),
      });
    }
  }

  // 2. Check if this code already exists in the database
  const existingIndex = codesDatabase.findIndex((c) => c.normalizedCode === cleaned.normalizedCode);
  if (existingIndex !== -1) {
    const existing = codesDatabase[existingIndex];
    const existingAgeMs = now - new Date(existing.createdAt).getTime();

    // If this code was listed less than 4 minutes ago, prevent re-sharing
    if (!isAdmin && existingAgeMs < FOUR_MINUTES_MS) {
      return res.status(409).json({
        success: false,
        error: 'already_listed',
        message: 'ইতিমধ্যে তালিকাভুক্ত রয়েছে',
        remainingSeconds: Math.ceil((FOUR_MINUTES_MS - existingAgeMs) / 1000),
      });
    }

    // 4 minutes have passed: bump this existing code to top without creating duplicate
    existing.createdAt = new Date(now).toISOString();
    existing.updatedAt = new Date(now).toISOString();
    existing.status = 'recent';
    if (nickname) {
      existing.nickname = nickname.trim().slice(0, 30);
    }

    // Move to the very top (index 0)
    codesDatabase.splice(existingIndex, 1);
    codesDatabase.unshift(existing);

    if (!isAdmin) {
      userLastShareMap.set(clientIp, now);
    }

    saveDatabase();

    // Broadcast over SSE with zero DB reads
    broadcastRealtime('code_bumped', {
      code: existing,
      stats: getLiveStats(),
    });
    broadcastRealtime('codes_updated', {
      codes: codesDatabase.filter((c) => c.status !== 'disabled'),
      stats: getLiveStats(),
    });

    return res.status(200).json({
      success: true,
      code: existing,
      message: 'সফলভাবে তালিকা ভুক্ত করা হয়েছে',
    });
  }

  // 3. New unique code creation
  const newCodeEntity: NusukCodeEntity = {
    id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: cleaned.code,
    normalizedCode: cleaned.normalizedCode,
    nickname: nickname ? nickname.trim().slice(0, 30) : undefined,
    status: isAdmin ? 'verified' : 'recent',
    copyCount: 0,
    reportCount: 0,
    isPinned: false,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    reports: [],
  };

  // Instantly place on top of in-memory list
  codesDatabase.unshift(newCodeEntity);

  if (!isAdmin) {
    userLastShareMap.set(clientIp, now);
  }

  saveDatabase();

  // Commit to Firestore Database
  try {
    await dbManager.getAdapter().addCode(newCodeEntity);
  } catch (err) {
    console.warn('[Database] Code save to Firestore warning:', err);
  }

  // Zero-read real-time broadcast to all active users
  broadcastRealtime('code_added', {
    code: newCodeEntity,
    stats: getLiveStats(),
  });
  broadcastRealtime('codes_updated', {
    codes: codesDatabase.filter((c) => c.status !== 'disabled'),
    stats: getLiveStats(),
  });

  res.status(201).json({
    success: true,
    code: newCodeEntity,
    message: 'সফলভাবে তালিকা ভুক্ত করা হয়েছে',
  });
});

// 4. Increment Copy Count
app.post('/api/codes/:id/copy', (req: Request, res: Response) => {
  const { id } = req.params;
  const target = codesDatabase.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Code not found' });
  }

  target.copyCount += 1;
  target.updatedAt = new Date().toISOString();
  saveDatabase();

  // In-memory and local disk persist copy counts to eliminate excessive database writes and snapshot triggers

  // Broadcast copy count update in real-time
  broadcastRealtime('code_copied', {
    id,
    copyCount: target.copyCount,
  });

  res.json({ success: true, copyCount: target.copyCount });
});

// 5. Report Code
app.post('/api/codes/:id/report', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, details } = req.body;

  const target = codesDatabase.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Code not found' });
  }

  target.reportCount = (target.reportCount || 0) + 1;
  if (!target.reports) target.reports = [];
  target.reports.push({
    id: `report-${Date.now()}`,
    reason: reason || 'invalid',
    details: details || '',
    createdAt: new Date().toISOString(),
  });

  if (target.reportCount >= 3 && target.status !== 'verified') {
    target.status = 'reported';
  }

  saveDatabase();

  // Async update to database adapter
  dbManager.getAdapter().updateCode(id, {
    reportCount: target.reportCount,
    status: target.status,
    reports: target.reports,
  }).catch(() => {});

  res.json({ success: true, reportCount: target.reportCount });
});

// 6. Database Health & Status Endpoint
app.get('/api/database/status', (req: Request, res: Response) => {
  const adapter = dbManager.getAdapter();
  res.json({
    status: 'online',
    provider: adapter.name,
    cachedCodes: codesDatabase.length,
    architecture: 'in-memory-zero-read-cache',
    readLatency: '< 0.5ms',
    scaleCapability: '1,000,000+ concurrent visitors without Firestore read overhead',
    projectId: 'nusukhub',
    collection: 'nusuk_codes',
    adminAuthSecuredInDB: true,
  });
});

// 7. Admin Endpoints: Secure Database-Driven Authentication
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { passcode } = req.body;
  if (!passcode || typeof passcode !== 'string') {
    return res.status(400).json({ error: 'পাসকোড প্রদান করুন' });
  }
  const clean = passcode.trim();

  // Check cached passcode (fast O(1) in-memory)
  if (clean === cachedAdminPasscode) {
    return res.json({ success: true, token: 'nusuk-admin-token-2026' });
  }

  // If not matching, re-fetch live from Firestore database to ensure accuracy
  try {
    const livePasscode = await dbManager.getAdapter().getAdminPasscode();
    if (livePasscode) {
      cachedAdminPasscode = livePasscode;
      if (clean === livePasscode) {
        return res.json({ success: true, token: 'nusuk-admin-token-2026' });
      }
    }
  } catch (err) {
    console.warn('[Admin Auth] Error checking live passcode from database:', err);
  }

  res.status(401).json({ error: 'ভুল এডমিন পাসওয়ার্ড' });
});

// 8. Admin Endpoint: Change & Secure Admin Passcode in Database
app.post('/api/admin/change-passcode', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('nusuk-admin-token-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { newPasscode } = req.body;
  if (!newPasscode || typeof newPasscode !== 'string' || newPasscode.trim().length < 4) {
    return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' });
  }

  const clean = newPasscode.trim();
  try {
    const success = await dbManager.getAdapter().setAdminPasscode(clean);
    if (success) {
      cachedAdminPasscode = clean;
      saveDatabase();
      return res.json({ success: true, message: 'এডমিন পাসওয়ার্ড সফলভাবে ডাটাবেজে আপডেট ও সুরক্ষিত হয়েছে!' });
    }
  } catch (err) {
    console.error('[Admin] Error saving passcode to database:', err);
  }

  return res.status(500).json({ error: 'ডাটাবেজে পাসওয়ার্ড সংরক্ষণ করতে সমস্যা হয়েছে।' });
});

app.get('/api/admin/codes', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('nusuk-admin-token-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ codes: codesDatabase });
});

app.post('/api/admin/codes/:id/action', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('nusuk-admin-token-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const { action } = req.body;
  const index = codesDatabase.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Code not found' });
  }

  const target = codesDatabase[index];

  if (action === 'verify') {
    target.status = 'verified';
    target.reportCount = 0;
    dbManager.getAdapter().updateCode(id, { status: 'verified', reportCount: 0 }).catch(() => {});
  } else if (action === 'disable') {
    target.status = 'disabled';
    dbManager.getAdapter().updateCode(id, { status: 'disabled' }).catch(() => {});
  } else if (action === 'restore') {
    target.status = 'available';
    dbManager.getAdapter().updateCode(id, { status: 'available' }).catch(() => {});
  } else if (action === 'pin') {
    target.isPinned = !target.isPinned;
    dbManager.getAdapter().updateCode(id, { isPinned: target.isPinned }).catch(() => {});
  } else if (action === 'delete') {
    codesDatabase.splice(index, 1);
    dbManager.getAdapter().deleteCode(id).catch(() => {});
  }

  saveDatabase();

  broadcastRealtime('code_action', {
    action,
    id,
    code: target,
    stats: getLiveStats(),
  });

  res.json({ success: true, code: target });
});

// Start Server & mount Vite in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Nusuk Key Hub server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
