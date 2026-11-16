export type Lang = 'en' | 'bn';

export type ScreenId =
  | 'home'
  | 'stats'
  | 'settings'
  | 'notifications'
  | 'addKeys'
  | 'developer'
  | 'help';

export type AutomationMode = 'CODES' | 'QUIZ';

export interface PermissionState {
  nusukInstalled: boolean;
  accessibilityEnabled: boolean;
  overlayAllowed: boolean;
}

export interface DayStat {
  date: string;
  codes: number;
  quiz: number;
}

export interface NoticeItem {
  id: number;
  title: string;
  body: string;
  at: number;
  url?: string;
  unread: boolean;
}

export interface OverlayState {
  visible: boolean;
  minimized: boolean;
  mode: AutomationMode;
  targetCount: number;
  completedCount: number;
  correctCount: number;
  running: boolean;
  paused: boolean;
  humanPace: boolean;
  statusText: string;
  thinkingProgress: number; // 0 to 100
  activeCode: string;
  activeDoor: number;
  activeQuestion: string;
  activeAnswer: string;
}
