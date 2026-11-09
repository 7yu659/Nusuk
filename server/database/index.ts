import { IDatabaseAdapter, NusukCodeEntity } from './types';
import { FirestoreAdapter } from './firestoreAdapter';
import { LocalJsonAdapter } from './localJsonAdapter';

export * from './types';
export * from './firestoreAdapter';
export * from './localJsonAdapter';

/**
 * Pluggable Database Manager
 * Allows switching between Firestore, LocalJSON, PostgreSQL, Supabase, etc.
 * at any time simply by changing DB_TYPE or registering a new adapter.
 */
export type DatabaseType = 'firestore' | 'json' | 'custom';

class DatabaseManager {
  private activeAdapter: IDatabaseAdapter;
  private backupAdapter: IDatabaseAdapter;

  constructor() {
    const dbType = (process.env.DB_TYPE || 'firestore') as DatabaseType;
    this.backupAdapter = new LocalJsonAdapter();

    switch (dbType) {
      case 'json':
        this.activeAdapter = this.backupAdapter;
        break;
      case 'firestore':
      default:
        this.activeAdapter = new FirestoreAdapter();
        break;
    }
  }

  /**
   * Switch the database adapter at runtime or in configuration
   */
  public setAdapter(adapter: IDatabaseAdapter) {
    this.activeAdapter = adapter;
    console.log(`[DatabaseManager] Switched active database adapter to: ${adapter.name}`);
  }

  public getAdapter(): IDatabaseAdapter {
    return this.activeAdapter;
  }

  public getBackupAdapter(): IDatabaseAdapter {
    return this.backupAdapter;
  }
}

export const dbManager = new DatabaseManager();
