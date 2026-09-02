/**
 * CASHRUSH — Local achievement system
 * Unlocks only when specific goals are reached.
 */

import { ACHIEVEMENTS } from './config.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';

export const Achievements = {
  unlock(id) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    if (Storage.hasAchievement(id)) return false;
    const unlocked = Storage.unlockAchievement(id);
    if (unlocked) {
      this.showToast(def.name);
      try { Audio.achievement(); } catch (_) {}
    }
    return unlocked;
  },

  showToast(name) {
    const toast = document.getElementById('achievement-toast');
    const nameEl = document.getElementById('toast-name');
    if (!toast || !nameEl) return;
    nameEl.textContent = name;
    toast.classList.remove('hidden');
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 400);
    }, 2800);
  },

  /** End-of-run checks */
  checkRun(stats) {
    if ((stats.gamesPlayed || 0) >= 1) this.unlock('first_block');
    if ((stats.satsThisRun || 0) === 0 && (stats.distance || 0) >= 500) this.unlock('ghost_mode');
    if ((stats.maxCombo || 0) >= 8) this.unlock('combo_king');
    if ((stats.runTime || 0) >= 180) this.unlock('survivor');
    if ((stats.sectorsCleared || 0) >= 5) this.unlock('sector_5');
    if ((stats.sectorsCleared || 0) >= 9) this.unlock('sector_10');
  },

  /** Lifetime / cumulative goals */
  checkProgress(global) {
    if ((global.totalSats || 0) >= 1000) this.unlock('sat_stacker');
    if ((global.totalPlayTime || 0) >= 600) this.unlock('still_running');
    if ((global.feeWallsJumped || 0) >= 100) this.unlock('fee_escape');
    if ((global.hashrushActivations || 0) >= 10) this.unlock('hashrush_master');
    if ((global.totalDistance || 0) >= 10000) this.unlock('distance_10k');
    if ((global.gamesPlayed || 0) <= 3 && (global.gamesPlayed || 0) >= 1) {
      this.unlock('early_runner');
    }
  },

  getList() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: Storage.hasAchievement(a.id)
    }));
  },

  renderList(container) {
    if (!container) return;
    const list = this.getList();
    container.innerHTML = list.map(a => `
      <div class="ach-item ${a.unlocked ? 'unlocked' : ''}">
        <div class="ach-icon">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      </div>
    `).join('');
  }
};
