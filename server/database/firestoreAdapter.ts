import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  writeBatch,
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

  constructor() {
    const existing = getApps().find((a) => a.name === 'nusuk-server');
    this.app = existing || initializeApp(firebaseConfig, 'nusuk-server');
    this.db = getFirestore(this.app);
  }

  async init(initialSeedCodes: NusukCodeEntity[]): Promise<void> {
    try {
      const colRef = collection(this.db, this.collectionName);
      const snapshot = await getDocs(colRef);

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
      console.warn('[Firestore] Initialization warning (will use in-memory/fallback mode if offline or restricted rules):', err);
    }
  }

  async getAllCodes(): Promise<NusukCodeEntity[]> {
    try {
      const colRef = collection(this.db, this.collectionName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const codes: NusukCodeEntity[] = [];
      snapshot.forEach((d) => {
        codes.push(d.data() as NusukCodeEntity);
      });
      return codes;
    } catch (err) {
      console.warn('[Firestore] getAllCodes error:', err);
      return [];
    }
  }

  async addCode(code: NusukCodeEntity): Promise<boolean> {
    try {
      const docRef = doc(this.db, this.collectionName, code.id);
      await setDoc(docRef, code);
      return true;
    } catch (err) {
      console.warn('[Firestore] addCode warning:', err);
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

  onCodesChanged(callback: (codes: NusukCodeEntity[]) => void): () => void {
    try {
      const colRef = collection(this.db, this.collectionName);
      this.unsubscribeSnapshot = onSnapshot(
        colRef,
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
          console.warn('[Firestore] onSnapshot error:', error.message);
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
