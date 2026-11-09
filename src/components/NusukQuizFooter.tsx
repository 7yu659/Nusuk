import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Globe2,
  BookmarkCheck,
  ArrowRight,
  Flame,
  KeyRound,
  FileText
} from 'lucide-react';

interface QuestionSample {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SAMPLE_QUESTIONS: QuestionSample[] = [
  {
    id: 1,
    category: 'পবিত্র কুরআনুল কারীম',
    question: 'পবিত্র কুরআনের কোন সূরায় দুটি "বিসমিল্লাহির রাহমানির রাহিম" উল্লেখ রয়েছে?',
    options: ['সূরা আত-তাওবাহ', 'সূরা আন-নামল', 'সূরা আল-বাকারাহ', 'সূরা আল-ফাতহ'],
    correctIndex: 1,
    explanation: 'সূরা আন-নামলের শুরুতে এবং ৩০ নম্বর আয়াতে সুলাইমান (আ.) এর পত্রের শুরুতে "বিসমিল্লাহির রাহমানির রাহিম" রয়েছে।',
  },
  {
    id: 2,
    category: 'মক্কার ইতিহাস ও মসজিদুল হারাম',
    question: 'মসজিদুল হারামে এক ওয়াক্ত নামাজের সওয়াব সাধারণ মসজিদের তুলনায় কত গুণ?',
    options: ['১,০০০ গুণ', '১০,০০০ গুণ', '৫০,০০০ গুণ', '১,০০,০০০ গুণ'],
    correctIndex: 3,
    explanation: 'সহীহ হাদীস অনুযায়ী মসজিদুল হারামে এক ওয়াক্ত নামাজের সওয়াব এক লক্ষ (১,০০,০০০) গুণ বেশি।',
  },
  {
    id: 3,
    category: 'মদিনা ও মসজিদে নববী',
    question: 'রাসূলুল্লাহ (সা.) এর মিম্বর ও রওজা মুবারকের মধ্যবর্তী বরকতময় স্থানটিকে কী বলা হয়?',
    options: ['রিয়াজুল জান্নাহ', 'মাকামে ইবরাহীম', 'আস-সুফফাহ', 'মিহরাবে নববী'],
    correctIndex: 0,
    explanation: 'হাদীসে বর্ণিত হয়েছে: "আমার ঘর এবং আমার মিম্বরের মধ্যবর্তী স্থানটি জান্নাতের বাগানসমূহের একটি বাগান" (রিয়াজুল জান্নাহ)।',
  },
  {
    id: 4,
    category: 'নবীজির মহিমান্বিত সীরাহ',
    question: 'নবীজি (সা.) মদিনায় হিজরতের পর সর্বপ্রথম কোন বরকতময় মসজিদটি নির্মাণ করেছিলেন?',
    options: ['মসজিদে নববী', 'মসজিদে কুবা', 'মসজিদুল কিবলাতাইন', 'মসজিদে জুমা'],
    correctIndex: 1,
    explanation: 'মদিনা মুনাওয়ারায় প্রবেশের পূর্বে কুবা নামক স্থানে নবীজি (সা.) ইসলামের ইতিহাসের প্রথম মসজিদ "মসজিদে কুবা" প্রতিষ্ঠা করেন।',
  },
  {
    id: 5,
    category: 'হজ ও উমরাহ বিধিমালা',
    question: 'হজের ফরয রোকনগুলোর মধ্যে ৯ই জিলহজের প্রধান রোকন কোনটি?',
    options: ['তাওয়াফে যিয়ারত', 'আরাফাহর ময়দানে অবস্থান', 'সাফা-মারওয়ায় সাঈ', 'মুযদালিফায় রাতযাপন'],
    correctIndex: 1,
    explanation: 'নবীজি (সা.) এর অমিয় বাণী: "আল-হাজ্জু আরাফাহ" অর্থাৎ আরাফাহর ময়দানে অবস্থানই হজের মূল ভিত্তি।',
  },
  {
    id: 6,
    category: 'পবিত্র কুরআনুল কারীম',
    question: 'পবিত্র কুরআনের কোন সূরাকে "কুরআনের অন্তর" (কালবুল কুরআন) বলা হয়?',
    options: ['সূরা আল-ইখলাস', 'সূরা আর-রহমান', 'সূরা ইয়াসীন', 'সূরা আল-মুলক'],
    correctIndex: 2,
    explanation: 'হাদীসে সূরা ইয়াসীনকে পবিত্র কুরআনের অন্তর হিসেবে আখ্যায়িত করা হয়েছে।',
  },
  {
    id: 7,
    category: 'মক্কার ইতিহাস ও নিদর্শন',
    question: 'পবিত্র কাবা শরীফ তাওয়াফ করার সময় প্রতি চক্কর কোন ঐতিহাসিক পাথর থেকে শুরু ও শেষ হয়?',
    options: ['হাজরে আসওয়াদ', 'রুকনে ইয়ামানী', 'মাকামে ইবরাহীম', 'হাতিমে কাবা'],
    correctIndex: 0,
    explanation: 'তাওয়াফের প্রতিটি চক্কর হাজরে আসওয়াদ পাথরের দিক থেকে বিসমিল্লাহি আল্লাহু আকবার বলে শুরু ও শেষ করতে হয়।',
  },
  {
    id: 8,
    category: 'মদিনা ও মসজিদে নববী',
    question: 'মসজিদে নববীতে এক ওয়াক্ত নামাজের ফজিলত কত গুণ বেশি?',
    options: ['৫০০ গুণ', '১,০০০ গুণ', '১০,০০০ গুণ', '৫০,০০০ গুণ'],
    correctIndex: 1,
    explanation: 'সহীহ হাদীসের বর্ণনা অনুযায়ী মসজিদে নববীতে এক রাকাত নামাজ অন্যান্য সাধারণ মসজিদের চেয়ে ১,০০০ গুণ বেশি উত্তম।',
  },
];

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '১. নুসুক উমরাহ চ্যালেঞ্জ ও কুইজ কী?',
    a: 'সৌদি আরবের হজ ও উমরাহ মন্ত্রণালয়ের অফিসিয়াল মোবাইল প্ল্যাটফর্ম "নুসুক (Nusuk)"-এ পরিচালিত একটি ইসলামিক সাধারণ জ্ঞান প্রতিযোগিতা। বিশ্বজুড়ে মুসলিমরা ইসলামী ইতিহাস, কুরআন, সীরাহ ও হারমাইনের বিষয়ে উত্তর দিয়ে সৌভাগ্যবান বিজয়ী হিসেবে ফ্রি উমরাহ ট্রিপ ও বিভিন্ন আকর্ষণীয় পুরস্কার অর্জন করতে পারেন।',
  },
  {
    q: '২. কুইজে প্রতিদিন কয়টি ফ্রি চেষ্টা (Free Key) পাওয়া যায়?',
    a: 'নুসুক অ্যাপে নিবন্ধিত প্রত্যেক ব্যবহারকারীকে প্রতিদিন অন্তত ১টি করে "ডেইলি ফ্রি কি (Daily Free Key)" দেওয়া হয়। এই কি ব্যবহার করে কুইজের যেকোনো একটি ক্যাটাগরিতে অংশগ্রহণ করা যায়।',
  },
  {
    q: '৩. রেফারেল কি (যেমন NG-ElOBvwzz) দিলে আমার কী লাভ হয়?',
    a: 'রেফারেল কি হলো অতিরিক্ত "বোনাস কি (Bonus Keys)" পাওয়ার সবচেয়ে কার্যকরী মাধ্যম। যখন অন্য কোনো হাজি বা প্রতিযোগী আপনার রেফারেল কোডটি ব্যবহার করবেন, তখন আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে অতিরিক্ত বোনাস কি যোগ হবে। এর ফলে আপনি দিনে একাধিকবার কুইজ খেলে লাকি ড্র পুলে নিজের নাম বহুবার এন্ট্রি করার সুযোগ পাবেন, যা আপনার জেতার সম্ভাবনা শতগুণ বাড়িয়ে দেয়।',
  },
  {
    q: '৪. কুইজের সঠিক উত্তর দিলে ড্র টিকিট কীভাবে গণনা করা হয়?',
    a: 'প্রতিটি সফল সঠিক উত্তরের মাধ্যমে অ্যাপের কেন্দ্রীয় সার্ভারে আপনার নামে ১টি ভেরিফাইড এন্ট্রি টিকিট তৈরি হয়। যদি আপনি রেফারেল কি দিয়ে ১০টি বোনাস কি অর্জন করেন এবং সবগুলো সঠিক উত্তর দেন, তবে লটারির ড্র পুলে আপনার নামে ১০টি টিকিট যুক্ত হবে।',
  },
  {
    q: '৫. বাংলাদেশ বা সৌদি আরবের বাইরে থেকে কি অংশ নেওয়া যাবে?',
    a: 'হ্যাঁ, নুসুক অ্যাপ সম্পূর্ণ আন্তর্জাতিক এবং বিশ্বের যেকোনো প্রান্ত থেকে যেকোনো মুসলিম বৈধ অ্যাকাউন্ট খুলে এই কুইজ প্রতিযোগিতায় অংশগ্রহণ করতে পারেন।',
  },
  {
    q: '৬. কুইজে ভুল উত্তর দিলে কি আইডি বা অ্যাকাউন্ট ব্যান হবে?',
    a: 'না, ভুল উত্তর দিলে অ্যাকাউন্ট ব্যান হয় না। শুধুমাত্র ঐ দিনের বরাদ্দকৃত কি-টি সমাপ্ত হয়ে যায়। তবে রেফারেল কি ব্যবহার করে অতিরিক্ত বোনাস কি নিয়ে পুনরায় চেষ্টা করা যায়।',
  },
  {
    q: '৭. গ্র্যান্ড প্রাইজ বিজয়ী হলে নুসুক কর্তৃপক্ষ কীভাবে যোগাযোগ করে?',
    a: 'নুসুক অ্যাপে নিবন্ধিত মোবাইল নম্বর, অফিসিয়াল ইমেইল এবং অ্যাপের নোটিফিকেশন সেন্টারে সরাসরি নোটিশ পাঠানো হয়। এছাড়াও অ্যাপের অফিশিয়াল লিডারবোর্ড ও সৌদি মন্ত্রণালয়ের সোশ্যাল মিডিয়ায় তালিকা প্রকাশ করা হয়।',
  },
  {
    q: '৮. এই ওয়েবসাইট কি নুসুকের অফিশিয়াল সাইট?',
    a: 'না, এটি বিশ্বজুড়ে হাজি, উমরাহযাত্রী ও প্রতিযোগীদের জন্য নির্মিত একটি স্বতন্ত্র, উন্মুক্ত ও সম্পূর্ণ ফ্রি "কমিউনিটি রেফারেল হাব"। এখানে ব্যবহারকারীরা সহজে নিজেদের রেফারেল কোড শেয়ার করে পারস্পরিকভাবে বোনাস কি সংগ্রহ করতে পারেন।',
  },
];

export const NusukQuizFooter: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeCategoryTab, setActiveCategoryTab] = useState<number>(0);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (id: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    {
      title: 'পবিত্র কুরআনুল কারীম',
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
      desc: 'কুরআনের সূরা, আয়াত, শানে নুযূল, তাফসীর ও ঐতিহাসিক ঘটনাপ্রবাহ সম্পর্কিত জ্ঞান।',
      tips: 'মক্কী ও মাদানী সূরার পার্থক্য ও প্রধান বিষয়গুলো ভালোভাবে রিভিশন দিন।',
    },
    {
      title: 'নবীজির মহিমান্বিত সীরাহ',
      icon: <Award className="w-4 h-4 text-blue-500 dark:text-sky-400" />,
      desc: 'রাসূলুল্লাহ (সা.) এর পুণ্যময় শৈশব, নবুওয়াত, মক্কার দাওয়াত, হিজরত ও মদিনা সনদের ইতিহাস।',
      tips: 'ঐতিহাসিক যুদ্ধসমূহ (বদর, উহুদ, খন্দক) ও মক্কা বিজয়ের তারিখগুলো স্মরণ রাখুন।',
    },
    {
      title: 'মক্কা ও মসজিদুল হারাম',
      icon: <Flame className="w-4 h-4 text-rose-500" />,
      desc: 'কাবা শরীফ, জমজম কূপ, সাফা-মারওয়া, তাওয়াফ এবং হজের অপরিহার্য রোকনসমূহ।',
      tips: 'তাওয়াফের বিধান ও হারাম শরীফের পবিত্র সীমানা সংক্রান্ত প্রশ্নের উত্তর বেশি আসে।',
    },
    {
      title: 'মদিনা ও মসজিদে নববী',
      icon: <Sparkles className="w-4 h-4 text-sky-500" />,
      desc: 'মসজিদে নববী, রিয়াজুল জান্নাহ, কুবা মসজিদ, উহুদের শহীদগণ ও রওজা মুবারকের আদব।',
      tips: 'মদিনার ঐতিহাসিক মসজিদসমূহ ও রিয়াজুল জান্নাহর হাদিসগুলো মুখস্থ রাখুন।',
    },
  ];

  return (
    <footer
      id="nusuk-quiz-footer"
      className="w-full bg-slate-100 dark:bg-[#121316] text-slate-900 dark:text-neutral-100 border-t border-slate-200/90 dark:border-[#2b2f3b] mt-8 pt-10 pb-20 transition-colors duration-200 scroll-mt-6"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
        {/* ========================================================= */}
        {/* SECTION 1: HEADER & BADGE */}
        {/* ========================================================= */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-200 dark:border-[#242732]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-[#132238] border border-blue-200 dark:border-[#20446e] text-blue-800 dark:text-sky-300 text-xs font-bold tracking-wide shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#0070e0]" />
            <span>অফিসিয়াল তথ্য সহায়িকা ও পূর্ণাঙ্গ গাইডলাইন</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-snug">
            নুসুক উমরাহ চ্যালেঞ্জ ও ইসলামিক কুইজ সহায়িকা
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed">
            সৌদি আরবের হজ ও উমরাহ মন্ত্রণালয় কর্তৃক পরিচালিত অফিসিয়াল নুসুক উমরাহ চ্যালেঞ্জের সম্পূর্ণ তথ্য, কুইজের ৪টি ক্যাটাগরি, বোনাস কি (Bonus Keys) সংগ্রহের নিয়ম ও সফল হওয়ার বিশেষ কৌশল।
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] text-center shadow-xs">
              <span className="block text-lg font-black text-[#0070e0] font-mono">১টি/দিন</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">ডেইলি ফ্রি কি</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] text-center shadow-xs">
              <span className="block text-lg font-black text-blue-600 dark:text-sky-400 font-mono">৪টি</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">কুইজ ক্যাটাগরি</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] text-center shadow-xs">
              <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">ফ্রি</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">উমরাহ প্যাকেজ ড্র</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] text-center shadow-xs">
              <span className="block text-lg font-black text-purple-600 dark:text-purple-400 font-mono">আনলিমিটেড</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">রেফারেল বোনাস কি</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: HOW THE QUIZ & KEYS SYSTEM WORKS */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-[#14233e] text-[#0070e0] flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              ১. নুসুক চ্যালেঞ্জ ও বোনাস কি সিস্টেম কীভাবে কাজ করে?
            </h3>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 sm:p-5 space-y-4 shadow-xs">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed font-normal">
              সৌদি আরবের সরকারি প্ল্যাটফর্ম নুসুক (Nusuk) নিয়মিতভাবে বিশ্বব্যাপী হাজি ও মুসলিমদের জন্য জ্ঞানভিত্তিক কুইজ আয়োজন করে থাকে। এটি শুধুমাত্র সাধারণ কুইজ নয়; এটি প্রতিটি মুসলমানের কাছে পবিত্র দুই হারামের জ্ঞান পৌঁছে দেওয়ার এক মহৎ প্রয়াস।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200/80 dark:border-[#262934] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0070e0]">
                  <Clock className="w-4 h-4" />
                  <span>দৈনিক ফ্রি কি (Daily Key)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  প্রতিদিন নুসুকে লগইন করলেই ১টি ফ্রি চেষ্টা পাবেন। সঠিক উত্তর দিতে পারলে লাকি ড্র পুলে আপনার নামে ১টি নিশ্চিত টিকিট যোগ হবে।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200/80 dark:border-[#262934] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-sky-400">
                  <Zap className="w-4 h-4" />
                  <span>রেফারেল কোড ও বোনাস কি (Bonus Key)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  আপনার নুসুক রেফারেল কি (যেমন: <code className="font-mono font-bold text-slate-900 dark:text-white">NG-ElOBvwzz</code>) বন্ধুদের মাঝে শেয়ার করলে প্রতিটি ব্যবহারের জন্য আপনি পাবেন অতিরিক্ত বোনাস কি।
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-[#132238] border border-blue-200 dark:border-[#20446e] text-xs text-blue-950 dark:text-sky-200 flex items-start gap-2.5">
              <BookmarkCheck className="w-4 h-4 text-[#0070e0] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>লাইভ বোর্ডের উদ্দেশ্য:</strong> যাতে কেউ কি-এর অভাবে থেমে না থাকেন! এখানে যেকোনো হাজি তার নিজস্ব কোড জমা দিতে পারেন এবং অন্য হাজিদের কোড কপি করে দ্রুত বোনাস কি আনলক করে ড্র পুলে এগিয়ে থাকতে পারেন।
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: 4 OFFICIAL KNOWLEDGE CATEGORIES */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-[#14233e] text-blue-700 dark:text-sky-400 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              ২. কুইজের ৪টি প্রধান ইসলামিক বিভাগ
            </h3>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Category Tab Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#141519] border border-slate-200/80 dark:border-[#252834]">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCategoryTab(idx)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeCategoryTab === idx
                      ? 'bg-white dark:bg-[#1c1e24] text-slate-950 dark:text-white shadow-xs border border-slate-200/90 dark:border-[#383d4c]'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat.icon}
                  <span className="truncate">{cat.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active Category Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200/80 dark:border-[#242732] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {categories[activeCategoryTab].icon}
                  <span>{categories[activeCategoryTab].title}</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-[#152744] text-[#0070e0] dark:text-sky-300">
                  অফিসিয়াল সিলেবাস
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                {categories[activeCategoryTab].desc}
              </p>
              <div className="pt-2 text-xs text-blue-700 dark:text-sky-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span><strong>টিপস:</strong> {categories[activeCategoryTab].tips}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: PRIZES & REWARDS */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-[#142921] text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              ৩. আকর্ষণীয় পুরস্কার ও রিওয়ার্ডস
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Prize 1: Free Umrah */}
            <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#13233c] border border-blue-200 dark:border-[#204066] flex items-center justify-center text-[#0070e0] dark:text-sky-400 mb-2 font-bold text-xl">
                🕋
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">সম্পূর্ণ ফ্রি উমরাহ ট্রিপ</h4>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                ফ্লাইট টিকিট, মক্কা ও মদিনায় পাঁচ তারকা হোটেল আবাসন, উমরাহ পারমিট ও সঙ্গীসহ ভ্রমণের সম্পূর্ণ স্পনসরশিপ।
              </p>
            </div>

            {/* Prize 2: Zamzam Water */}
            <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#13233c] border border-blue-200 dark:border-[#204066] flex items-center justify-center text-[#0070e0] dark:text-sky-300 mb-2 font-bold text-xl">
                💧
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">পবিত্র জমজম ওয়াটার বক্স</h4>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                নির্বাচিত হাজারো রানার্স-আপ প্রতিযোগীদের জন্য সৌদি মন্ত্রণালয়ের পক্ষ থেকে পবিত্র জমজম পানির বিশেষ উপহার কার্টন।
              </p>
            </div>

            {/* Prize 3: Digital Certificate */}
            <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#142820] border border-emerald-200 dark:border-[#224838] flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 font-bold text-xl">
                📜
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">অফিসিয়াল সার্টিফিকেট</h4>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                নুসুক অ্যাপে ডিজিটাল নলেজ ব্যাজ, স্বীকৃতি সনদ ও লিডারবোর্ডে বিশ্ব র‍্যাংকিং স্ট্যাটাস প্রদর্শন।
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: STEP-BY-STEP TUTORIAL */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-[#281c3c] text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              ৪. কুইজে অংশ নেওয়ার ৫টি সহজ ধাপ
            </h3>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 sm:p-5 shadow-xs">
            <div className="space-y-3">
              {[
                {
                  step: '০১',
                  title: 'নুসুক অ্যাপ ডাউনলোড ও অ্যাকাউন্ট রেজিস্ট্রেশন',
                  desc: 'গুগল প্লে স্টোর বা অ্যাপল অ্যাপ স্টোর থেকে অফিশিয়াল "Nusuk" অ্যাপ নামিয়ে পাসপোর্ট বা মোবাইল নম্বর দিয়ে সাইন-আপ করুন।',
                },
                {
                  step: '০২',
                  title: 'হোম পেজে "উমরাহ চ্যালেঞ্জ" অপশনে প্রবেশ',
                  desc: 'অ্যাপের প্রধান হোম স্ক্রিনে প্রদর্শিত "Umrah Challenge" অথবা "Islamic Quiz" ব্যানারে আলতো চাপ দিন।',
                },
                {
                  step: '০৩',
                  title: 'রেফারেল কি ইনপুট করে বোনাস কি সংগ্রহ',
                  desc: 'আমাদের লাইভ বোর্ডে থাকা যেকোনো সক্রিয় কোড (যেমন: NG-ElOBvwzz) পেস্ট করে সাথে সাথে অতিরিক্ত বোনাস কি আনলক করুন।',
                },
                {
                  step: '০৪',
                  title: 'পছন্দের ক্যাটাগরি বেছে নিয়ে কুইজে উত্তর দিন',
                  desc: 'কুরআন, সীরাহ বা হারামাইনের যেকোনো ১টি বিষয় নির্বাচন করে সঠিক উত্তরের বৃত্তে ট্যাপ করুন।',
                },
                {
                  step: '০৫',
                  title: 'লাকি ড্র নিশ্চিত করুন ও নিয়মিত আপডেট থাকুন',
                  desc: 'সঠিক উত্তরের সাথে সাথে আপনার টিকিট স্বয়ংক্রিয়ভাবে ড্র তালিকায় এন্ট্রি হয়ে যাবে। প্রতিদিন অংশগ্রহণ করে পয়েন্ট বৃদ্ধি করুন।',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-200/70 dark:border-[#252834]"
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-[#162744] text-[#0070e0] dark:text-sky-300 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: SAMPLE PRACTICE QUESTIONS (Interactive) */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-[#132820] text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
                ৫. কুইজ প্র্যাকটিস ও নমুনা প্রশ্নমালা (১০+ প্র্যাকটিস)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
              ক্লিক করে উত্তর দেখুন
            </span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-4 sm:p-5 space-y-3 shadow-xs">
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-3">
              নুসুক অ্যাপের কুইজে সচরাচর যে ধরণের জ্ঞানগর্ভ প্রশ্ন জিজ্ঞাসা করা হয়, হাজিদের পূর্বপ্রস্তুতির সুবিধার্থে নিচে তার কয়েকটি নমুনা দেওয়া হলো:
            </p>

            <div className="space-y-3">
              {SAMPLE_QUESTIONS.map((q) => {
                const isRevealed = revealedAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200/80 dark:border-[#262934] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#20222a] text-slate-700 dark:text-neutral-300">
                        {q.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                        প্রশ্ন নং #{q.id}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-neutral-100 leading-snug mb-2.5">
                      {q.question}
                    </h4>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isRevealed && oIdx === q.correctIndex
                              ? 'bg-emerald-50 dark:bg-[#132820] border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'bg-white dark:bg-[#191a20] border-slate-200 dark:border-[#2a2d39] text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          <span className="text-slate-400 mr-1 font-mono">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Reveal Answer Button */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-[#222530]">
                      <button
                        onClick={() => toggleAnswer(q.id)}
                        className="text-xs font-bold text-[#0070e0] hover:text-blue-700 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isRevealed ? 'ব্যাখ্যা লুকান ▴' : 'সঠিক উত্তর ও ব্যাখ্যা দেখুন ▾'}</span>
                      </button>

                      {isRevealed && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>সঠিক: {q.options[q.correctIndex]}</span>
                        </span>
                      )}
                    </div>

                    {isRevealed && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/80 dark:bg-[#132820]/60 border border-emerald-200/80 dark:border-[#1e3e32] text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed animate-in fade-in duration-150">
                        <strong>ব্যাখ্যা:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: PRO TIPS */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-[#14233e] text-blue-700 dark:text-sky-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              ৬. কুইজ জেতার সেরা প্র্যাকটিক্যাল টিপস
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'প্রতিদিন নির্দিষ্ট সময়ে লগইন করুন',
                desc: 'প্রতিদিন সকালবেলায় কুইজে প্রবেশ করলে নতুন ডেইলি কি পাওয়া যায় এবং প্রশ্ন সমাধান করা সহজ হয়।',
              },
              {
                title: 'লাইভ বোর্ডে নিজের কোড শেয়ার রাখুন',
                desc: 'আমাদের লাইভ বোর্ডে প্রতিদিন আপনার রেফারেল কোড সাবমিট করে রাখুন যাতে প্রতিনিয়ত আপনার বোনাস কি জমা হতে থাকে।',
              },
              {
                title: 'প্রশ্ন মনোযোগ দিয়ে পড়ুন',
                desc: 'অনেক প্রশ্নে "কোনটি নয়" বা "ব্যতীত" জাতীয় শব্দ থাকে। তাড়াহুড়ো না করে শান্তভাবে ৪টি বিকল্পই যাচাই করুন।',
              },
              {
                title: 'হজের মাসসমূহে বিশেষ রাউন্ড',
                desc: 'রমজানুল মুবারক ও জিলহজ মাসে উমরাহ চ্যালেঞ্জে অতিরিক্ত পুরস্কার ঘোষণা করা হয়, এই সময় বেশি কি সংগ্রহ করুন।',
              },
            ].map((tip, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] space-y-1 shadow-xs"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-[#0070e0]" />
                  <span>{tip.title}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 8: COMPREHENSIVE FAQ ACCORDION */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-[#14233e] text-[#0070e0] flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              ৭. সচরাচর জিজ্ঞাসিত প্রশ্নোত্তর (FAQ)
            </h3>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] divide-y divide-slate-100 dark:divide-[#252834] overflow-hidden shadow-xs">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#181a20] transition-colors cursor-pointer select-none"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-neutral-100">
                      {faq.q}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed animate-in fade-in duration-150">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200/80 dark:border-[#252834]">
                        {faq.a}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 9: OFFICIAL LINKS & COMMUNITY DISCLAIMER */}
        {/* ========================================================= */}
        <div className="rounded-2xl bg-white dark:bg-[#1c1e24] border border-slate-200/90 dark:border-[#2b2f3b] p-5 space-y-4 shadow-xs text-xs">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#0070e0]" />
              <span className="font-bold text-slate-900 dark:text-white">প্রয়োজনীয় অফিসিয়াল লিঙ্কসমূহ:</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://www.nusuk.sa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0070e0] hover:underline flex items-center gap-1"
              >
                <span>অফিসিয়াল নুসুক পোর্টাল</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-300 dark:text-neutral-600">•</span>
              <a
                href="https://services.nusuk.sa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0070e0] hover:underline flex items-center gap-1"
              >
                <span>নুসুক সার্ভিসেস</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed border-t border-slate-100 dark:border-[#262934] pt-3">
            <strong>ডিসক্লেইমার:</strong> এই প্ল্যাটফর্মটি বিশ্বব্যাপী উমরাহযাত্রী ও শিক্ষার্থীদের পারস্পরিক রেফারেল কি বিনিময় এবং কুইজ সংক্রান্ত জ্ঞান বৃদ্ধির সুবিধার্থে পরিচালিত একটি উন্মুক্ত ও নিরপেক্ষ কমিউনিটি পোর্টাল। এটি সৌদি হজ ও উমরাহ মন্ত্রণালয়ের নিজস্ব কোনো একক সরকারি সাইট নয়। সর্বস্বত্ব সংরক্ষিত © ২০২৬ নুসুক কি হাব।
          </p>
        </div>
      </div>
    </footer>
  );
};
