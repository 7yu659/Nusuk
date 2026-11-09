import { NusukCode } from '../types';

/**
 * Authentic Realistic Live Update Engine for Nusuk Referral Code Community.
 * Ensures the live board dynamically reflects real-world activity without feeling static.
 * Seamlessly merges existing database codes with real submissions.
 */

// Realistic Bengali community nicknames
const BENGALI_COMMUNITY_NICKNAMES = [
  'মাহমুদুল হাসান',
  'তানভীর হোসাইন',
  'আব্দুল্লাহ আল-মামুন',
  'সালমান ফারসি',
  'রফিকুল ইসলাম',
  'জুবায়ের আহমেদ',
  'তারিক জামিল',
  'কাজী রায়হান',
  'সাইফুল ইসলাম',
  'হাবিবুর রহমান',
  'আসিফ ইকবাল',
  'নাজমুল হুদা',
  'শামিম ওসমান',
  'ইমরান হোসাইন',
  'মেহেদী হাসান',
  'আরিফুল ইসলাম',
  'ফাহিম শাহরিয়ার',
  'মুস্তাফিজুর রহমান',
  'হাসিবুর রহমান',
  'সাকিব আল হাসান',
  'শাহাদাত হোসেন',
  'তৌহিদ হৃদয়',
  'মিজানুর রহমান',
  'মোস্তাফিজ আল-মক্কী',
  'আব্দুর রহিম',
  'কামরুল ইসলাম',
  'সাইয়েদ আহমেদ',
  'নাঈমুল ইসলাম',
];

// Nusuk alphanumeric character pool for referral codes
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

export function generateRealisticNusukCode(): string {
  let result = 'NG-';
  const len = Math.floor(Math.random() * 3) + 8; // 8 to 10 chars
  for (let i = 0; i < len; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return result;
}

export function getRandomNickname(): string {
  return BENGALI_COMMUNITY_NICKNAMES[
    Math.floor(Math.random() * BENGALI_COMMUNITY_NICKNAMES.length)
  ];
}

/**
 * Ensures code timestamps appear freshly active and progressive.
 * When a user first opens the page or refreshes:
 * - The latest code is 2-4 seconds ago.
 * - The 2nd is 12-25 seconds ago.
 * - The 3rd is 45-80 seconds ago.
 * - And so forth, simulating a thriving active room.
 */
export function normalizeLiveTimestamps(codes: NusukCode[]): NusukCode[] {
  if (!codes || codes.length === 0) return codes;

  const now = Date.now();
  let accumulatedOffset = 2; // start 2 seconds ago

  return codes.map((item, index) => {
    // Keep pinned code intact
    if (item.isPinned) {
      return item;
    }

    // Check if this item already has a fresh timestamp created within the last 15 minutes
    const currentAge = now - new Date(item.createdAt).getTime();
    if (currentAge > 0 && currentAge < 15 * 60 * 1000 && index < 5) {
      return item;
    }

    // Assign realistic staggering
    const staggeredTime = new Date(now - accumulatedOffset * 1000).toISOString();

    // Increment offset realistically for subsequent rows
    if (index === 0) {
      accumulatedOffset += Math.floor(Math.random() * 8) + 6; // +6..13s
    } else if (index < 5) {
      accumulatedOffset += Math.floor(Math.random() * 20) + 15; // +15..35s
    } else if (index < 15) {
      accumulatedOffset += Math.floor(Math.random() * 45) + 30; // +30..75s
    } else if (index < 35) {
      accumulatedOffset += Math.floor(Math.random() * 120) + 90; // +1.5..3.5m
    } else {
      accumulatedOffset += Math.floor(Math.random() * 300) + 200; // +3..8m
    }

    return {
      ...item,
      createdAt: staggeredTime,
    };
  });
}
