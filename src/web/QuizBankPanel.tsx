import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import quizSeedRaw from '../../assets/quiz_seed.json';
import { fmtNum } from './i18n';
import type { Lang } from './types';

interface QuizSeedShape {
  right: Record<string, string>;
  wrong?: Record<string, string[]>;
}

const quizSeed = quizSeedRaw as QuizSeedShape;

export function getQuizEntries(): Array<{ question: string; answer: string }> {
  return Object.entries(quizSeed.right || {}).map(([question, answer]) => ({
    question,
    answer,
  }));
}

export function QuizBankPanel({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'right' | 'wrong'>('right');

  const rightEntries = useMemo(() => getQuizEntries(), []);
  const wrongEntries = useMemo(
    () =>
      Object.entries(quizSeed.wrong || {}).map(([question, answers]) => ({
        question,
        answers,
      })),
    [],
  );

  const filteredRight = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rightEntries;
    return rightEntries.filter(
      (item) =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
    );
  }, [query, rightEntries]);

  const filteredWrong = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wrongEntries;
    return wrongEntries.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answers.some((a) => a.toLowerCase().includes(q)),
    );
  }, [query, wrongEntries]);

  return (
    <div className="rounded-2xl bg-white border border-[#E7E5E4] p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1C1917]">
            {lang === 'bn' ? 'অফলাইন কুইজ ডেটাবেজ' : 'Offline Quiz Answer Bank'}
          </h2>
          <p className="text-[13px] text-[#78716C] tabular-nums">
            {lang === 'bn'
              ? `সঠিক উত্তর ${fmtNum(lang, rightEntries.length)}টি · এড়িয়ে চলা ভুল উত্তর ${fmtNum(lang, wrongEntries.length)}টি`
              : `${rightEntries.length} verified answers · ${wrongEntries.length} excluded wrong options`}
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4] self-start">
          <button
            type="button"
            onClick={() => setTab('right')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
              tab === 'right'
                ? 'bg-white text-[#1C1917] shadow-sm'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            {lang === 'bn' ? 'সঠিক উত্তর' : 'Verified Answers'}
          </button>
          <button
            type="button"
            onClick={() => setTab('wrong')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
              tab === 'wrong'
                ? 'bg-white text-[#1C1917] shadow-sm'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            {lang === 'bn' ? 'ভুল তালিকা' : 'Excluded Wrong'}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            lang === 'bn'
              ? 'প্রশ্ন বা উত্তর খুঁজুন (যেমন: zamzam, hijra)...'
              : 'Search bundled quiz questions or answers...'
          }
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#15803D]"
        />
      </div>

      <div className="max-h-[460px] overflow-y-auto divide-y divide-[#F0EEEC] border-t border-[#F0EEEC]">
        {tab === 'right' ? (
          filteredRight.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-[#78716C]">
              {lang === 'bn' ? 'কোনো প্রশ্ন পাওয়া যায়নি' : 'No matching questions found.'}
            </div>
          ) : (
            filteredRight.map((item) => (
              <div key={item.question} className="py-3 space-y-1">
                <div className="text-[14px] text-[#44403C] capitalize">{item.question}?</div>
                <div className="text-[14px] font-medium text-[#15803D]">{item.answer}</div>
              </div>
            ))
          )
        ) : filteredWrong.length === 0 ? (
          <div className="py-10 text-center text-[14px] text-[#78716C]">
            {lang === 'bn' ? 'কোনো তথ্য পাওয়া যায়নি' : 'No matching entries found.'}
          </div>
        ) : (
          filteredWrong.map((item) => (
            <div key={item.question} className="py-3 space-y-1">
              <div className="text-[14px] text-[#44403C] capitalize">{item.question}?</div>
              <div className="text-[14px] font-medium text-[#B91C1C]">
                {item.answers.join(' · ')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
