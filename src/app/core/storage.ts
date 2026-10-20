import { Preferences } from '@capacitor/preferences';

/*
 * Stockage durable de petites valeurs. Preferences ecrit dans SharedPreferences
 * (Android) et UserDefaults (iOS), que le systeme ne vide pas comme le localStorage
 * d'une WebView ; sur le web, il s'appuie sur le localStorage.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return (await Preferences.get({ key })).value;
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch {
      // Navigation privee, quota : l'application reste utilisable sans persistance.
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch {
      // idem
    }
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJson(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },
};
