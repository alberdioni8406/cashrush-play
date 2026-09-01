/**
 * CASHRUSH — Safe localStorage wrapper
 * Corrupted data never breaks the game.
 */

import { CONFIG, CHARACTERS } from './config.js';

const DEFAULTS = {
  highScore: 0,
  totalDistance: 0,
  totalSats: 0,
  totalPlayTime: 0,
  unlockedCharacters: ['cash'],
  selectedCharacter: 'cash',
  achievements: {},
  stats: {
    feeWallsJumped: 0,
    hashrushActivations: 0,
    gamesPlayed: 0,
    maxCombo: 0
  },
  settings: {
    sfx: true,
    music: true,
    mobileControls: false,
    reducedMotion: false
  },
  version: 1
};

function safeParse(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function mergeDefaults(data) {
  const merged = { ...DEFAULTS, ...data };
  merged.settings = { ...DEFAULTS.settings, ...(data.settings || {}) };
  merged.stats = { ...DEFAULTS.stats, ...(data.stats || {}) };
  merged.achievements = { ...DEFAULTS.achievements, ...(data.achievements || {}) };
  if (!Array.isArray(merged.unlockedCharacters)) {
    merged.unlockedCharacters = ['cash'];
  }
  if (!merged.unlockedCharacters.includes('cash')) {
    merged.unlockedCharacters.unshift('cash');
  }
  return merged;
}

export const Storage = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) {
        this.data = { ...DEFAULTS };
        this.save();
        return this.data;
      }
      const parsed = safeParse(raw);
      this.data = parsed ? mergeDefaults(parsed) : { ...DEFAULTS };
      return this.data;
    } catch (e) {
      console.warn('Storage load failed, using defaults', e);
      this.data = { ...DEFAULTS };
      return this.data;
    }
  },

  save() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  get(key) {
    if (!this.data) this.load();
    return this.data[key];
  },

  set(key, value) {
    if (!this.data) this.load();
    this.data[key] = value;
    this.save();
  },

  updateStats(partial) {
    if (!this.data) this.load();
    Object.assign(this.data.stats, partial);
    this.save();
  },

  unlockCharacter(id) {
    if (!this.data) this.load();
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      this.save();
      return true;
    }
    return false;
  },

  isUnlocked(id) {
    if (!this.data) this.load();
    return this.data.unlockedCharacters.includes(id);
  },

  unlockAchievement(id) {
    if (!this.data) this.load();
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = { unlockedAt: Date.now() };
      this.save();
      return true;
    }
    return false;
  },

  hasAchievement(id) {
    if (!this.data) this.load();
    return !!this.data.achievements[id];
  },

  reset() {
    this.data = { ...DEFAULTS };
    this.save();
  },

  checkCharacterUnlocks(highScore) {
    const newly = [];
    for (const [id, char] of Object.entries(CHARACTERS)) {
      if (char.unlockScore && highScore >= char.unlockScore && !this.isUnlocked(id)) {
        this.unlockCharacter(id);
        newly.push(id);
      }
    }
    return newly;
  }
};
