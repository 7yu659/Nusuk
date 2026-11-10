export interface NusukCodeEntity {
  id: string;
  code: string;
  normalizedCode: string;
  nickname?: string;
  status: 'available' | 'recent' | 'verified' | 'copied' | 'reported' | 'disabled';
  copyCount: number;
  reportCount: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  reports?: Array<{
    id: string;
    reason: string;
    details?: string;
    createdAt: string;
  }>;
}

export interface IDatabaseAdapter {
  name: string;
  init(initialSeedCodes: NusukCodeEntity[]): Promise<void>;
  getAllCodes(): Promise<NusukCodeEntity[]>;
  addCode(code: NusukCodeEntity): Promise<boolean>;
  addCodesBatch(codes: NusukCodeEntity[]): Promise<boolean>;
  updateCode(id: string, updates: Partial<NusukCodeEntity>): Promise<boolean>;
  deleteCode(id: string): Promise<boolean>;
  getAdminPasscode(): Promise<string>;
  setAdminPasscode(passcode: string): Promise<boolean>;
  getSettings?(): Promise<any>;
  saveSettings?(settings: any): Promise<boolean>;
  onCodesChanged?(callback: (codes: NusukCodeEntity[]) => void): () => void;
}
