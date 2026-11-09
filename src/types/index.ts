export type CodeStatus = 'available' | 'recent' | 'verified' | 'copied' | 'reported' | 'disabled';

export interface CodeReport {
  id: string;
  reason: 'invalid' | 'duplicate' | 'spam' | 'inappropriate';
  details?: string;
  createdAt: string;
}

export interface NusukCode {
  id: string;
  code: string;
  normalizedCode: string;
  nickname?: string;
  status: CodeStatus;
  copyCount: number;
  reportCount: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  reports?: CodeReport[];
}

export type CodeFilter = 'all' | 'new' | 'uncopied' | 'viewed' | 'popular' | 'verified';
export type CodeSort = 'newest' | 'oldest' | 'most_copied';

export interface AppStats {
  totalCodes: number;
  activeUsers: number;
  totalCopies: number;
  todayCodes: number;
  reportedCodes: number;
  uniqueVisitors: number;
}

export type Language = 'bn' | 'en';
