import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IDatabaseAdapter, NusukCodeEntity } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export class LocalJsonAdapter implements IDatabaseAdapter {
  public name = 'LocalJSON';
  private codes: NusukCodeEntity[] = [];

  async init(initialSeedCodes: NusukCodeEntity[]): Promise<void> {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.codes) && parsed.codes.length > 0) {
          this.codes = parsed.codes;
          return;
        }
      }
      this.codes = [...initialSeedCodes];
      this.persist();
    } catch (err) {
      console.warn('[LocalJSON] init warning:', err);
      this.codes = [...initialSeedCodes];
    }
  }

  async getAllCodes(): Promise<NusukCodeEntity[]> {
    return [...this.codes];
  }

  async addCode(code: NusukCodeEntity): Promise<boolean> {
    this.codes.unshift(code);
    this.persist();
    return true;
  }

  async updateCode(id: string, updates: Partial<NusukCodeEntity>): Promise<boolean> {
    const target = this.codes.find((c) => c.id === id);
    if (!target) return false;
    Object.assign(target, updates);
    this.persist();
    return true;
  }

  async deleteCode(id: string): Promise<boolean> {
    this.codes = this.codes.filter((c) => c.id !== id);
    this.persist();
    return true;
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify({ codes: this.codes, lastSaved: new Date().toISOString() }, null, 2));
    } catch (err) {
      console.warn('[LocalJSON] persist error:', err);
    }
  }
}
