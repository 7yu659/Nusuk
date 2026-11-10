import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  writeBatch,
  query,
  limit,
  orderBy,
} from 'firebase/firestore';
import { IDatabaseAdapter, NusukCodeEntity } from './types';
import { firebaseConfig } from '../../src/config/firebase';

export class FirestoreAdapter implements IDatabaseAdapter {
  public name = 'Firestore';
  private app: FirebaseApp;
  private db: Firestore;
  private collectionName = 'nusuk_codes';
  private unsubscribeSnapshot: (() => void) | null = null;
  private isConnected = false;
  private cachedCodes: NusukCodeEntity[] = [];
  private lastCodesFetchTime = 0;
  private cachedPasscode: string | null = null;
  private cachedSettings: any = null;

  constructor() {
    const existing = getApps().find((a) => a.name === 'nusuk-server');
    this.app = existing || initializeApp(firebaseConfig, 'nusuk-server');
    this.db = getFirestore(this.app);
  }

  async init(initialSeedCodes: NusukCodeEntity[]): Promise<void> {
    try {
      const colRef = collection(this.db, this.collectionName);
      // Minimized database read: only check 1 document instead of reading hundreds!
      const checkQuery = query(colRef, limit(1));
      const snapshot = await getDocs(checkQuery);

      if (snapshot.empty && initialSeedCodes.length > 0) {
        console.log(`[Firestore] Initializing '${this.collectionName}' with ${initialSeedCodes.length} seed codes...`);
        const batch = writeBatch(this.db);
        for (const item of initialSeedCodes) {
          const docRef = doc(this.db, this.collectionName, item.id);
          batch.set(docRef, item);
        }
        await batch.commit();
        console.log(`[Firestore] Successfully seeded ${initialSeedCodes.length} codes.`);
      }

      this.isConnected = true;
      console.log(`[Firestore] Connected to Firebase Project: ${firebaseConfig.projectId}`);
    } catch (err) {
      console.warn('[Firestore] Initialization warning (running high-speed in-memory mode):', err);
    }
  }

  async getAllCodes(): Promise<NusukCodeEntity[]> {
    // Return memory-cached codes if fetched within 10 minutes to prevent high database read volume
    const now = Date.now();
    if (this.cachedCodes.length > 0 && now - this.lastCodesFetchTime < 10 * 60 * 1000) {
      return this.cachedCodes;
    }

    try {
      const colRef = collection(this.db, this.collectionName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const codes: NusukCodeEntity[] = [];
      snapshot.forEach((d) => {
        codes.push(d.data() as NusukCodeEntity);
      });
      this.cachedCodes = codes;
      this.lastCodesFetchTime = now;
      return codes;
    } catch (err) {
      console.warn('[Firestore] getAllCodes error:', err);
      return this.cachedCodes;
    }
  }

  async addCode(code: NusukCodeEntity): Promise<boolean> {
    try {
      const docRef = doc(this.db, this.collectionName, code.id);
      await setDoc(docRef, code);
      console.log(`[Firestore] Successfully saved code '${code.code}' to database.`);
      return true;
    } catch (err) {
      console.warn('[Firestore] addCode warning:', err);
      return false;
    }
  }

  async addCodesBatch(codes: NusukCodeEntity[]): Promise<boolean> {
    if (!codes || codes.length === 0) return true;
    try {
      // Chunk in blocks of 400 (well within Firestore 500 document limit)
      const chunkSize = 400;
      for (let i = 0; i < codes.length; i += chunkSize) {
        const chunk = codes.slice(i, i + chunkSize);
        const batch = writeBatch(this.db);
        for (const item of chunk) {
          const docRef = doc(this.db, this.collectionName, item.id);
          batch.set(docRef, item);
        }
        await batch.commit();
      }
      console.log(`[Firestore] Successfully committed batch of ${codes.length} codes to database.`);
      return true;
    } catch (err) {
      console.warn('[Firestore] addCodesBatch warning:', err);
      return false;
    }
  }

  async updateCode(id: string, updates: Partial<NusukCodeEntity>): Promise<boolean> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, updates);
      return true;
    } catch (err) {
      console.warn('[Firestore] updateCode warning:', err);
      return false;
    }
  }

  async deleteCode(id: string): Promise<boolean> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('[Firestore] deleteCode warning:', err);
      return false;
    }
  }

  /**
   * Secure Admin Passcode Stored in Firestore Database
   * Document: nusuk_settings/admin_auth
   */
  async getAdminPasscode(): Promise<string> {
    const defaultPasscode = 'admin2026';
    if (this.cachedPasscode) {
      return this.cachedPasscode;
    }
    try {
      const docRef = doc(this.db, 'nusuk_settings', 'admin_auth');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && typeof data.passcode === 'string' && data.passcode.trim()) {
          this.cachedPasscode = data.passcode.trim();
          return this.cachedPasscode;
        }
      }
      // Initialize if not present in Firestore
      await setDoc(docRef, {
        passcode: defaultPasscode,
        updatedAt: new Date().toISOString(),
        description: 'Secure admin authentication passcode',
      });
      this.cachedPasscode = defaultPasscode;
      return defaultPasscode;
    } catch (err) {
      console.warn('[Firestore] getAdminPasscode error, using default:', err);
      return defaultPasscode;
    }
  }

  async setAdminPasscode(passcode: string): Promise<boolean> {
    const clean = passcode.trim();
    this.cachedPasscode = clean;
    try {
      const docRef = doc(this.db, 'nusuk_settings', 'admin_auth');
      await setDoc(
        docRef,
        {
          passcode: clean,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log('[Firestore] Admin passcode successfully updated and secured in database.');
      return true;
    } catch (err) {
      console.warn('[Firestore] setAdminPasscode error:', err);
      return false;
    }
  }

  async getSettings(): Promise<any> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }
    try {
      const docRef = doc(this.db, 'nusuk_settings', 'app_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        this.cachedSettings = snap.data();
        return this.cachedSettings;
      }
    } catch (err) {
      console.warn('[Firestore] getSettings error:', err);
    }
    return null;
  }

  async saveSettings(settings: any): Promise<boolean> {
    this.cachedSettings = settings;
    try {
      const docRef = doc(this.db, 'nusuk_settings', 'app_config');
      await setDoc(
        docRef,
        {
          ...settings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log('[Firestore] App settings successfully saved to database.');
      return true;
    } catch (err) {
      console.warn('[Firestore] saveSettings error:', err);
      return false;
    }
  }

  onCodesChanged(callback: (codes: NusukCodeEntity[]) => void): () => void {
    try {
      const colRef = collection(this.db, this.collectionName);
      // Strictly limit listener to the 15 latest codes to prevent reading hundreds of documents
      const recentCodesQuery = query(colRef, orderBy('createdAt', 'desc'), limit(15));
      this.unsubscribeSnapshot = onSnapshot(
        recentCodesQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: NusukCodeEntity[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as NusukCodeEntity);
            });
            callback(list);
          }
        },
        (error) => {
          console.warn('[Firestore] onSnapshot notice:', error.message);
        }
      );

      return () => {
        if (this.unsubscribeSnapshot) {
          this.unsubscribeSnapshot();
          this.unsubscribeSnapshot = null;
        }
      };
    } catch (err) {
      console.warn('[Firestore] onCodesChanged setup error:', err);
      return () => {};
    }
  }
}
