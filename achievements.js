/**
 * CASHRUSH — Local achievement system
 */

import { ACHIEVEMENTS } from './config.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';

export const Achievements = {
  queue(id) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    if (Storage.hasAchievement(id)) return false;
    const unlocked = Storage.unlockAchievement(id);
    if (unlocked) {
      this.showToast(def.name);
      Audio.achievement();
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

  checkRun(stats) {
    // Called at end of run or during
    if (stats.gamesPlayed === 1) this.unlock('first_block');
    if (stats.satsThisRun === 0 && stats.distance > 500) this.unlock('ghost_mode');
    if (stats.maxCombo >= 8) this.unlock('combo_king');
    if (stats.runTime >= 180) this.unlock('survivor');
  },

  checkProgress(global) {
    if (global.totalSats >= 1000) this.unlock('sat_stacker');
    if (global.totalPlayTime >= 600) this.unlock('still_running');
    if (global.feeWallsJumped >= 100) this.unlock('fee_escape');
    if (global.hashrushActivations >= 10) this.unlock('hashrush_master');
    if (global.totalDistance >= 10000) this.unlock('distance_10k');
    // Early runner: first 100 games ever on this device (or just unlock on first play for V1)
    if (global.gamesPlayed <= 3) this.unlock('early_runner');
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
