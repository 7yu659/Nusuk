import React from 'react';
import { NusukLogo } from './NusukLogo';
import { fmtNum, t } from './i18n';
import type { AutomationMode, Lang, OverlayState } from './types';

interface OverlayWidgetProps {
  lang: Lang;
  overlay: OverlayState;
  onMinimizeToggle: () => void;
  onClose: () => void;
  onModeChange: (mode: AutomationMode) => void;
  onCountChange: (count: number) => void;
  onPaceToggle: () => void;
  onStartStop: () => void;
  onPauseResume: () => void;
}

export function OverlayWidget({
  lang,
  overlay,
  onMinimizeToggle,
  onClose,
  onModeChange,
  onCountChange,
  onPaceToggle,
  onStartStop,
  onPauseResume,
}: OverlayWidgetProps) {
  if (!overlay.visible) {
    return null;
  }

  const progressText = `${fmtNum(lang, overlay.completedCount)} / ${fmtNum(lang, overlay.targetCount)}`;

  if (overlay.minimized) {
    return (
      <button
        type="button"
        onClick={onMinimizeToggle}
        className="inline-flex items-center h-11 pl-2 pr-3.5 rounded-full bg-[#0F2E1E]/95 border border-[#86EFAC] shadow-lg transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
      >
        <NusukLogo className="w-6 h-6 shrink-0" />
        <span className="ml-2 text-[15px] font-light text-[#F5F5F4] whitespace-nowrap">
          Nusuk Auto
        </span>
        <span className="ml-2.5 text-[15px] font-light text-[#86EFAC] tabular-nums whitespace-nowrap">
          {progressText}
        </span>
      </button>
    );
  }

  return (
    <div className="w-[276px] rounded-2xl bg-[#0F2E1E]/95 border border-[#2E6B4B] p-2.5 shadow-xl text-[#F5F5F4] select-none">
      {/* Header */}
      <div className="flex items-center h-8 mb-2">
        <NusukLogo className="w-6 h-6 shrink-0" />
        <span className="ml-2 flex-1 text-[16px] font-light text-[#F5F5F4] truncate">
          Nusuk Auto
        </span>
        <button
          type="button"
          onClick={onMinimizeToggle}
          aria-label="Minimize widget"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A7F3D0] hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          —
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, 'Close')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A7F3D0] hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          ✕
        </button>
      </div>

      {/* Mode segmented control (hidden while running) */}
      {!overlay.running && (
        <div className="flex items-center h-9 mb-2 p-[3px] rounded-xl bg-[#153D29] border border-[#2E6B4B]">
          <button
            type="button"
            onClick={() => onModeChange('CODES')}
            className={`flex-1 h-full rounded-lg text-[14px] font-light transition-colors whitespace-nowrap ${
              overlay.mode === 'CODES'
                ? 'bg-[#15803D] text-white shadow-sm'
                : 'text-[#A7F3D0] hover:text-white'
            }`}
          >
            {t(lang, 'Codes')}
          </button>
          <button
            type="button"
            onClick={() => onModeChange('QUIZ')}
            className={`flex-1 h-full rounded-lg text-[14px] font-light transition-colors whitespace-nowrap ${
              overlay.mode === 'QUIZ'
                ? 'bg-[#15803D] text-white shadow-sm'
                : 'text-[#A7F3D0] hover:text-white'
            }`}
          >
            {t(lang, 'Quiz')}
          </button>
        </div>
      )}

      {/* Status + progress + thinkBar */}
      <div className="relative mb-2 rounded-xl bg-[#153D29] border border-[#2E6B4B] overflow-hidden">
        <div className="flex items-center justify-between min-h-[42px] px-2.5 py-1.5 gap-2">
          <span className="text-[13px] font-light text-[#D1FAE5] truncate">
            {t(lang, overlay.statusText)}
          </span>
          <span className="text-[17px] font-light text-[#86EFAC] tabular-nums shrink-0 whitespace-nowrap">
            {progressText}
          </span>
        </div>
        {overlay.thinkingProgress > 0 && (
          <div className="h-[3px] w-full bg-[#1C4D34]">
            <div
              className="h-full bg-[#4ADE80] transition-all duration-150"
              style={{ width: `${Math.min(100, overlay.thinkingProgress)}%` }}
            />
          </div>
        )}
      </div>

      {/* Target count stepper (hidden while running) */}
      {!overlay.running && (
        <div className="flex items-center h-10 mb-2 gap-1.5">
          <button
            type="button"
            onClick={() => onCountChange(Math.max(1, overlay.targetCount - (overlay.targetCount > 50 ? 25 : 5)))}
            aria-label="Decrease count"
            className="w-11 h-full rounded-xl bg-[#153D29] border border-[#2E6B4B] hover:bg-[#1D5237] text-[20px] font-light text-[#F5F5F4] transition-colors flex items-center justify-center"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={8000}
            value={overlay.targetCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              onCountChange(Number.isNaN(v) ? 1 : Math.max(1, Math.min(8000, v)));
            }}
            aria-label="Target count"
            className="no-spinner flex-1 min-w-0 h-full rounded-xl bg-[#0F2E1E] border border-[#2E6B4B] text-center text-[17px] font-light text-white tabular-nums focus:outline-none focus:border-[#86EFAC]"
          />
          <button
            type="button"
            onClick={() => onCountChange(Math.min(8000, overlay.targetCount + (overlay.targetCount >= 50 ? 25 : 5)))}
            aria-label="Increase count"
            className="w-11 h-full rounded-xl bg-[#153D29] border border-[#2E6B4B] hover:bg-[#1D5237] text-[20px] font-light text-[#F5F5F4] transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
      )}

      {/* Human-like pace switch (Quiz mode) */}
      {overlay.mode === 'QUIZ' && (
        <button
          type="button"
          onClick={onPaceToggle}
          className="w-full flex items-center justify-between h-8 px-1 mb-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="text-[14px] font-light text-[#A7F3D0] truncate">
            {t(lang, 'Human-like pace')}
          </span>
          <span
            className={`relative inline-flex w-9 h-5 rounded-full transition-colors shrink-0 ${
              overlay.humanPace ? 'bg-[#16A34A]' : 'bg-[#0F2E1E] border border-[#2E6B4B]'
            }`}
          >
            <span
              className={`inline-block w-3.5 h-3.5 mt-[2px] rounded-full bg-white transition-transform ${
                overlay.humanPace ? 'translate-x-[19px]' : 'translate-x-[3px]'
              }`}
            />
          </span>
        </button>
      )}

      {/* Action buttons */}
      <div className="flex items-center h-11 gap-1.5">
        {overlay.running && (
          <button
            type="button"
            onClick={onPauseResume}
            className="flex-1 h-full rounded-xl bg-[#153D29] border border-[#2E6B4B] hover:bg-[#1D5237] text-[15px] font-light text-[#F5F5F4] transition-colors whitespace-nowrap px-2"
          >
            {overlay.paused ? `▶  ${t(lang, 'Resume')}` : `❚❚  ${t(lang, 'Pause')}`}
          </button>
        )}
        <button
          type="button"
          onClick={onStartStop}
          className={`flex-1 h-full rounded-xl text-[15px] font-medium transition-colors whitespace-nowrap px-2 ${
            overlay.running
              ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
              : 'bg-[#DCFCE7] hover:bg-white text-[#0F2E1E]'
          }`}
        >
          {overlay.running
            ? `■  ${t(lang, 'Stop')}`
            : `▶  ${t(lang, overlay.mode === 'QUIZ' ? 'Start quiz' : 'Start codes')}`}
        </button>
      </div>
    </div>
  );
}
