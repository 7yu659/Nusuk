import type { Lang } from './types';

const EXACT: Record<string, string> = {
  // Main screen
  'Notifications': 'নোটিফিকেশন',
  'Open statistics': 'স্ট্যাটস দেখো',
  'Codes today': 'আজকের কোড',
  'Quiz today': 'আজকের কুইজ',
  'Adding codes': 'কোড অ্যাড হচ্ছে',
  'Playing quiz': 'কুইজ খেলা হচ্ছে',
  'Running in the background': 'ব্যাকগ্রাউন্ডে চলছে',
  'Stop': 'থামাও',
  'Stopped': 'থামানো হয়েছে',
  'Setup required': 'সেটআপ করতে হবে',
  'Finish setup to work inside Nusuk.': 'নুসুকের ভেতরে কাজ করতে সেটআপ শেষ করো।',
  'Nusuk app not installed': 'নুসুক অ্যাপ ইনস্টল করা নেই',
  'Install': 'ইনস্টল',
  'Accessibility service': 'অ্যাক্সেসিবিলিটি সার্ভিস',
  'Enable': 'অন করো',
  'Fix': 'ঠিক করো',
  'Floating overlay': 'ফ্লোটিং ওভারলে',
  'Allow': 'অ্যালাউ করো',
  'Auto Add Codes': 'অটো কোড অ্যাড',
  'Enters Umrah codes for you': 'ওমরাহ কোড অটো এন্টার হবে',
  'Auto Play Quiz': 'অটো কুইজ খেলো',
  'Answers the Nusuk quiz for you': 'তোমার হয়ে নুসুক কুইজ সলভ করে',
  'Add your own codes': 'তোমার নিজের কোড অ্যাড করো',
  'Settings': 'সেটিংস',
  'Help & guides': 'হেল্প ও গাইড',
  'Join our Facebook group': 'ফেসবুক গ্রুপে জয়েন করো',
  'Follow on Facebook': 'ফেসবুকে যুক্ত হও',
  'Share the app': 'অ্যাপটা শেয়ার করো',
  'Sponsored': 'স্পন্সরড',
  'Close': 'ক্লোজ',
  'ALSO BY THE DEVELOPER': 'ডেভেলপারের আরেকটি কাজ',
  'Al Fitan': 'আল ফিতান',
  'The first and largest digital archive on Fitan and the end times.': 'ফিতনা ও শেষ জামানা বিষয়ক সর্বপ্রথম ও সর্ববৃহত ডিজিটাল আর্কাইভ',
  'Visit alfitan.com': 'alfitan.com ঘুরে এসো',
  'About developer': 'ডেভেলপার সম্পর্কে',
  'Back': 'ব্যাক',

  // Overlay
  'Codes': 'কোড',
  'Quiz': 'কুইজ',
  'Ready': 'রেডি',
  'Human-like pace': 'মানুষের মতো স্পিড',
  'Pause': 'পজ',
  'Resume': 'রিজিউম',
  'Start': 'স্টার্ট',
  'Start quiz': 'কুইজ স্টার্ট',
  'Start codes': 'কোড স্টার্ট',
  'Stopped by user': 'তুমি থামিয়েছ',
  'Starting Quiz...': 'কুইজ শুরু হচ্ছে...',
  'Starting Codes...': 'কোড শুরু হচ্ছে...',
  'Paused': 'পজ করা আছে',
  'Paused: open Nusuk to continue': 'পজ: কন্টিনিউ করতে নুসুক ওপেন করো',
  'Done': 'শেষ',
  'Thinking...': 'ভাবছে...',
  'All codes tested!': 'সব কোড টেস্ট শেষ!',

  // Settings
  'Language': 'ভাষা',
  'Choose the language of the app.': 'অ্যাপের ভাষা বেছে নাও।',
  'Quiz pace': 'কুইজ স্পিড',
  'Choose how fast the quiz is played.': 'কুইজ কত স্পিডে খেলা হবে, বেছে নাও।',
  'Normal (recommended)': 'নরমাল (রেকমেন্ডেড)',
  'Thinks for a moment before giving each answer, like a real person. The next door is chosen at once. Safest for your account.':
    'প্রতিটা উত্তর দেওয়ার আগে একটু ভাবে, ঠিক মানুষের মতো। পরের দরজা সাথে সাথেই বেছে নেয়। অ্যাকাউন্টের জন্য সবচেয়ে সেইফ।',
  'Fast': 'ফাস্ট',
  'No waiting at all. Quicker, but looks like a bot and your account may get limited.':
    'কোনো অপেক্ষা নেই। দ্রুত হয়, কিন্তু বটের মতো দেখায় আর অ্যাকাউন্টে লিমিট পড়তে পারে।',
  'Thinking time before each answer': 'প্রতিটা উত্তরের আগে ভাবার সময়',
  'Shortest': 'সবচেয়ে কম',
  'Longest': 'সবচেয়ে বেশি',
  'Your codes': 'তোমার কোড',
  'Found some Nusuk codes? Add them to the shared list so everyone can use them.':
    'নুসুকের কিছু কোড পেয়েছ? শেয়ার্ড লিস্টে অ্যাড করো, সবাই ব্যবহার করতে পারবে।',
  'Share': 'শেয়ার',
  'Know someone who does Umrah quizzes? Share the app with them.':
    'চেনা কেউ ওমরাহ কুইজ করে? তাকে অ্যাপটা শেয়ার করো।',
  'Support': 'সাপোর্ট',
  'Something not working? Send a report with your app version, phone model and recent errors.':
    'কিছু কাজ করছে না? অ্যাপ ভার্সন, ফোনের মডেল আর সাম্প্রতিক এরর সহ একটি রিপোর্ট পাঠাও।',
  'Share debug report': 'ডিবাগ রিপোর্ট শেয়ার করো',
  'Adds Umrah codes and plays the Nusuk quiz for you, so you save time.':
    'তোমার হয়ে ওমরাহ কোড অ্যাড করে আর নুসুক কুইজ খেলে, ফলে সময় বাঁচে।',
  'You have the latest version': 'তুমি লেটেস্ট ভার্সনেই আছো',
  'Check for updates': 'আপডেট চেক করো',

  // Statistics
  'Statistics': 'স্ট্যাটস',
  'This is your own usage on this phone.': 'এগুলো এই ফোনে তোমার নিজের ব্যবহারের হিসাব।',
  'By date': 'ডেট অনুযায়ী',
  'Date': 'ডেট',
  'Today': 'আজ',
  'Yesterday': 'গতকাল',
  'Nothing yet. Codes you add and questions the app solves are counted here by day.':
    'এখনো কিছু নেই। তুমি যত কোড অ্যাড করবে আর অ্যাপ যত প্রশ্ন সলভ করবে, দিন অনুযায়ী এখানে দেখা যাবে।',

  // Notifications
  'Clear all': 'সব ক্লিয়ার',
  'No notifications yet': 'এখনো কোনো নোটিফিকেশন নেই',
  'News and updates we send from the server will be saved here.':
    'সার্ভার থেকে পাঠানো নিউজ আর আপডেট এখানে জমা থাকবে।',
  'Tap to open': 'ট্যাপ করে ওপেন করো',

  // Add keys
  'Paste your codes below, one or many, in any format. Codes look like NG-p36wAxup. We check each one and add the new ones to the shared list.':
    'তোমার কোডগুলো নিচে পেস্ট করো, একটা বা অনেকগুলো, যেকোনো ফরম্যাটে। কোড দেখতে এরকম: NG-p36wAxup। আমরা প্রতিটা চেক করে নতুনগুলো শেয়ার্ড লিস্টে অ্যাড করব।',
  'Paste': 'পেস্ট',
  'Add codes': 'কোড অ্যাড করো',
  'No codes found in the text. A code looks like NG-p36wAxup.':
    'লেখাটায় কোনো কোড পাওয়া যায়নি। কোড দেখতে এরকম: NG-p36wAxup।',

  // Developer
  'Ebrahim Khalil': 'ইব্রাহিম খলিল',
  'Email': 'ইমেইল',
  'WhatsApp': 'হোয়াটসঅ্যাপ',
  'Facebook': 'ফেসবুক',
  'Official website': 'অফিসিয়াল ওয়েবসাইট',
  'FYNEX · SOFTWARE & AUTOMATION': 'FYNEX · সফটওয়্যার ও অটোমেশন',
  'Founder & Lead Developer · Fynex': 'প্রতিষ্ঠাতা ও প্রধান ডেভেলপার · Fynex',
  'Built by Fynex': 'Fynex দ্বারা নির্মিত',
  'Developer of Nusuk Auto': 'Nusuk Auto-র ডেভেলপার',
  'Connect': 'যোগাযোগ',
  'Facebook profile': 'ফেসবুক প্রোফাইল',
  'Website': 'ওয়েবসাইট',
  'About the app': 'অ্যাপ সম্পর্কে',
  'Nusuk Auto is developed and maintained by Ebrahim Khalil at Fynex (fynex.site) to help Umrah pilgrims automate Nusuk codes and challenges safely.':
    'Nusuk Auto-টি Fynex (fynex.site)-এর অধীনে ইব্রাহিম খলিল তৈরি ও পরিচালনা করেন, যাতে ওমরাহ যাত্রীরা সহজে নুসুক কোড ও কুইজ অটোমেট করতে পারেন।',
  'Nusuk Auto is an unofficial helper made for Nusuk users. It is not connected to the Nusuk app or the Ministry of Hajj and Umrah.':
    'Nusuk Auto নুসুক ইউজারদের জন্য বানানো একটা আনঅফিশিয়াল হেল্পার অ্যাপ। নুসুক অ্যাপ বা হজ ও ওমরাহ মন্ত্রণালয়ের সাথে এর কোনো সম্পর্ক নেই।',
  'Questions, problems or ideas? Open Help for step-by-step fixes, or write in the Facebook group or to the developer.':
    "কোনো প্রশ্ন, সমস্যা বা আইডিয়া আছে? স্টেপ বাই স্টেপ সমাধানের জন্য 'হেল্প' ওপেন করো, অথবা ফেসবুক গ্রুপে বা ডেভেলপারকে লেখো।",
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function t(lang: Lang, text: string): string {
  if (lang === 'en') return text;
  if (EXACT[text]) return EXACT[text];

  // Dynamic patterns from L.java
  const verMatch = text.match(/^Version (\d[\d.]*)$/);
  if (verMatch) return `ভার্সন ${toBnDigits(verMatch[1])}`;

  const totalMatch = text.match(/^Total (\d+)$/);
  if (totalMatch) return `মোট ${toBnDigits(totalMatch[1])}`;

  const secMatch = text.match(/^(\d+) s$/);
  if (secMatch) return `${toBnDigits(secMatch[1])} সে.`;

  const doorMatch = text.match(/^Selecting Door (\d+)\.\.\.$/);
  if (doorMatch) return `দরজা ${toBnDigits(doorMatch[1])} সিলেক্ট করছে...`;

  const thinkMatch = text.match(/^Thinking\.\.\. (\d+)s$/);
  if (thinkMatch) return `ভাবছে... ${toBnDigits(thinkMatch[1])} সেকেন্ড`;

  const enterMatch = text.match(/^Entering (\S+) \((.+)\)$/);
  if (enterMatch) return `${enterMatch[1]} দিচ্ছে (${toBnDigits(enterMatch[2])})`;

  const checkMatch = text.match(/^Checking (\S+) \((.+)\)$/);
  if (checkMatch) return `${checkMatch[1]} যাচাই করছে (${toBnDigits(checkMatch[2])})`;

  const selMatch = text.match(/^Selected \(saved\): (.*)$/);
  if (selMatch) return `বাছাই করেছে (সংরক্ষিত): ${selMatch[1]}`;

  const collectMatch = text.match(/^Collecting key \((.+)\)$/);
  if (collectMatch) return `কী সংগ্রহ করছে (${toBnDigits(collectMatch[1])})`;

  const doneQuizMatch = text.match(/^Done \((\d+) quizzes, (\d+) ✓\)$/);
  if (doneQuizMatch) return `শেষ (${toBnDigits(doneQuizMatch[1])}টি কুইজ, ${toBnDigits(doneQuizMatch[2])} ✓)`;

  const doneCodesMatch = text.match(/^Done \((\d+) codes\)$/);
  if (doneCodesMatch) return `শেষ (${toBnDigits(doneCodesMatch[1])}টি কোড)`;

  return text;
}

export function fmtNum(lang: Lang, n: number): string {
  return lang === 'bn' ? toBnDigits(n) : String(n);
}
