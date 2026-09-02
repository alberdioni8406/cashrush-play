/**
 * CASHRUSH — Data-driven achievement + optional discovery system
 * Philosophy: GAMEPLAY FIRST → ACHIEVEMENT → OPTIONAL DISCOVERY → OPTIONAL SHARING
 */

import { ACHIEVEMENTS } from './config.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';

const MAIN_IDS = ACHIEVEMENTS.filter(a => !a.secret).map(a => a.id);

function defById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export const Achievements = {
  getProgress(def, live = {}) {
    const data = Storage.data || Storage.load();
    const stats = data.stats || {};
    switch (def.type) {
      case 'runs':
        return stats.gamesPlayed || 0;
      case 'sats':
        return data.totalSats || 0;
      case 'sector':
        return Math.max(live.sectorReached || 0, stats.maxSector || 0);
      case 'distance_run':
        return Math.max(live.distance || 0, stats.maxDistanceRun || 0);
      case 'legendary_orb':
        return stats.legendaryOrbs || 0;
      case 'legend': {
        const unlocked = MAIN_IDS.filter(id => Storage.hasAchievement(id) && id !== 'cashrush_legend');
        return unlocked.length;
      }
      case 'fee_walls_run':
        return Math.max(live.feeWallsJumped || 0, stats.maxFeeWallsRun || 0);
      case 'perfect_run':
        return stats.perfectRuns || 0;
      case 'hashrush_run':
        return Math.max(live.hashrushCount || 0, stats.maxHashrushRun || 0);
      default:
        return 0;
    }
  },

  unlock(id, meta = {}) {
    const def = defById(id);
    if (!def) return false;
    if (Storage.hasAchievement(id)) return false;
    const ok = Storage.unlockAchievement(id);
    if (!ok) return false;

    try {
      const data = Storage.data;
      data.achievements[id] = {
        ...(data.achievements[id] || {}),
        unlockedAt: Date.now(),
        meta
      };
      Storage.save();
    } catch (_) {}

    this.showUnlockPrompt(def, meta);
    try { Audio.achievement(); } catch (_) {}

    if (id !== 'cashrush_legend') {
      const count = MAIN_IDS.filter(i => i !== 'cashrush_legend' && Storage.hasAchievement(i)).length;
      if (count >= 10) this.unlock('cashrush_legend', { count });
    }
    return true;
  },

  showUnlockPrompt(def, meta = {}) {
    const toast = document.getElementById('achievement-toast');
    const nameEl = document.getElementById('toast-name');
    const titleEl = toast?.querySelector('.toast-title');
    if (!toast || !nameEl) return;

    if (titleEl) titleEl.textContent = def.secret ? 'SECRET ACHIEVEMENT' : 'ACHIEVEMENT UNLOCKED';
    nameEl.textContent = def.name;

    let actions = document.getElementById('toast-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'toast-actions';
      actions.className = 'toast-actions';
      actions.innerHTML = `
        <button type="button" id="toast-view" class="toast-btn">VIEW</button>
        <button type="button" id="toast-close" class="toast-btn primary">CLOSE</button>
      `;
      toast.appendChild(actions);
    }

    const viewBtn = document.getElementById('toast-view');
    const closeBtn = document.getElementById('toast-close');
    const hide = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 350);
    };

    if (viewBtn) {
      viewBtn.onclick = (e) => {
        e.stopPropagation();
        hide();
        this.openDetail(def.id);
      };
    }
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        hide();
      };
    }

    toast.classList.remove('hidden');
    requestAnimationFrame(() => toast.classList.add('show'));

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(hide, 5000);
  },

  checkRun(stats) {
    const live = {
      distance: stats.distance || 0,
      sectorReached: stats.sectorReached || stats.sectorsCleared || 0,
      feeWallsJumped: stats.feeWallsJumped || 0,
      hashrushCount: stats.hashrushCount || 0,
      satsThisRun: stats.satsThisRun || 0,
      tookDamage: stats.tookDamage
    };

    try {
      const data = Storage.data || Storage.load();
      data.stats = data.stats || {};
      data.stats.maxSector = Math.max(data.stats.maxSector || 0, live.sectorReached);
      data.stats.maxDistanceRun = Math.max(data.stats.maxDistanceRun || 0, live.distance);
      data.stats.maxFeeWallsRun = Math.max(data.stats.maxFeeWallsRun || 0, live.feeWallsJumped);
      data.stats.maxHashrushRun = Math.max(data.stats.maxHashrushRun || 0, live.hashrushCount);
      if (live.distance >= 800 && live.tookDamage === false) {
        data.stats.perfectRuns = (data.stats.perfectRuns || 0) + 1;
      }
      Storage.save();
    } catch (_) {}

    if ((stats.gamesPlayed || 0) >= 1) this.unlock('first_rush');
    this.checkProgress(Storage.data || {}, live);

    if (live.feeWallsJumped >= 50) this.unlock('fee_wall_survivor', { feeWalls: live.feeWallsJumped });
    if (live.distance >= 800 && live.tookDamage === false) {
      this.unlock('perfect_run', { distance: Math.floor(live.distance) });
    }
    if (live.hashrushCount >= 3) this.unlock('grid_hunter', { hashrush: live.hashrushCount });
  },

  checkProgress(global, live = {}) {
    const sats = global.totalSats || 0;
    const runs = (global.stats && global.stats.gamesPlayed) || 0;
    const sector = Math.max(live.sectorReached || 0, (global.stats && global.stats.maxSector) || 0);
    const distRun = Math.max(live.distance || 0, (global.stats && global.stats.maxDistanceRun) || 0);
    const legendary = (global.stats && global.stats.legendaryOrbs) || 0;

    if (sats >= 1000) this.unlock('sat_runner', { sats });
    if (sats >= 10000) this.unlock('stacking_up', { sats });
    if (sats >= 25000) this.unlock('cash_is_king', { sats });
    if (runs >= 10) this.unlock('your_keys', { runs });
    if (sector >= 3) this.unlock('block_builder', { sector });
    if (sector >= 5) this.unlock('network_runner', { sector });
    if (sector >= 7) this.unlock('cash_wallet', { sector });
    if (sector >= 10) this.unlock('grid_master', { sector });
    if (distRun >= 5000) this.unlock('decentralized', { distance: Math.floor(distRun) });
    if (legendary >= 1) this.unlock('token_discovery', { orbs: legendary });
  },

  checkLive(live) {
    this.checkProgress(Storage.data || Storage.load(), live);
    if ((live.feeWallsJumped || 0) >= 50) this.unlock('fee_wall_survivor', { feeWalls: live.feeWallsJumped });
    if ((live.hashrushCount || 0) >= 3) this.unlock('grid_hunter', { hashrush: live.hashrushCount });
  },

  recordLegendaryOrb() {
    try {
      const data = Storage.data || Storage.load();
      data.stats = data.stats || {};
      data.stats.legendaryOrbs = (data.stats.legendaryOrbs || 0) + 1;
      Storage.save();
      this.unlock('token_discovery', { orbs: data.stats.legendaryOrbs });
    } catch (_) {}
  },

  getList() {
    return ACHIEVEMENTS.map(a => {
      const unlocked = Storage.hasAchievement(a.id);
      const progress = this.getProgress(a);
      return {
        ...a,
        unlocked,
        progress,
        displayName: a.secret && !unlocked ? 'SECRET ACHIEVEMENT' : a.name,
        displayDesc: a.secret && !unlocked ? 'Keep exploring the Grid…' : a.desc,
        displayReq: a.secret && !unlocked ? '???' : a.requirement
      };
    });
  },

  renderList(container) {
    if (!container) return;
    const list = this.getList();
    container.innerHTML = list.map(a => {
      const pct = a.target ? Math.min(100, Math.floor((a.progress / a.target) * 100)) : (a.unlocked ? 100 : 0);
      return `
        <button type="button" class="ach-item ${a.unlocked ? 'unlocked' : ''} ${a.secret ? 'secret' : ''}" data-ach-id="${a.id}">
          <div class="ach-icon">${a.unlocked ? a.icon : '🔒'}</div>
          <div class="ach-info">
            <div class="ach-name">${a.displayName}</div>
            <div class="ach-desc">${a.displayDesc}</div>
            <div class="ach-req">${a.displayReq}${!a.unlocked && a.target && !a.secret ? ` · ${a.progress}/${a.target}` : ''}</div>
            ${!a.unlocked && a.target && !a.secret ? `<div class="ach-bar"><div class="ach-bar-fill" style="width:${pct}%"></div></div>` : ''}
          </div>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.ach-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ach-id');
        const def = defById(id);
        if (!def) return;
        if (!Storage.hasAchievement(id) && def.secret) return;
        this.openDetail(id);
      });
    });
  },

  openDetail(id) {
    const def = defById(id);
    if (!def) return;
    const unlocked = Storage.hasAchievement(id);
    const panel = document.getElementById('achievement-detail');
    if (!panel) return;

    const progress = this.getProgress(def);
    const meta = (Storage.data?.achievements?.[id]?.meta) || (Storage.data?.achievements?.[id]) || {};

    let discoveryHtml = '';
    if (unlocked && def.discovery) {
      const links = (def.discovery.links || [])
        .map(l => `<a class="ach-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`)
        .join(' ');
      discoveryHtml = `
        <div class="ach-discovery">
          <div class="ach-discovery-title">DISCOVERY</div>
          <div class="ach-discovery-heading">${def.discovery.title}</div>
          <p class="ach-discovery-body">${def.discovery.body.replace(/\n/g, '<br/>')}</p>
          ${links ? `<div class="ach-links">${links}</div>` : ''}
        </div>
      `;
    } else if (!unlocked) {
      discoveryHtml = `<p class="ach-locked-note">Reach the goal to unlock this discovery.</p>`;
    }

    panel.innerHTML = `
      <div class="ach-detail-panel">
        <button type="button" class="back-btn" id="ach-detail-close">← BACK</button>
        <div class="ach-detail-icon">${unlocked ? def.icon : '🔒'}</div>
        <h3 class="ach-detail-name">${unlocked || !def.secret ? def.name : 'SECRET ACHIEVEMENT'}</h3>
        <div class="ach-detail-status">${unlocked ? '✓ UNLOCKED' : 'LOCKED'}</div>
        <p class="ach-detail-desc">${unlocked || !def.secret ? def.desc : 'Keep exploring the Grid…'}</p>
        <p class="ach-detail-req">${unlocked || !def.secret ? def.requirement : '???'}${def.target && !def.secret ? ` (${progress}/${def.target})` : ''}</p>
        ${discoveryHtml}
        ${unlocked ? `
          <div class="ach-detail-actions">
            <button type="button" class="menu-btn primary" id="btn-download-card">DOWNLOAD CARD</button>
            <button type="button" class="menu-btn" id="btn-share-card">SHARE</button>
          </div>
        ` : ''}
      </div>
    `;

    panel.classList.add('active');
    panel.classList.remove('hidden');

    document.getElementById('ach-detail-close')?.addEventListener('click', () => {
      panel.classList.remove('active');
      panel.classList.add('hidden');
    });

    if (unlocked) {
      document.getElementById('btn-download-card')?.addEventListener('click', () => this.downloadCard(def, meta));
      document.getElementById('btn-share-card')?.addEventListener('click', () => this.shareCard(def, meta));
    }
  },

  renderCard(def, meta = {}) {
    const W = 1920;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#050a05');
    g.addColorStop(0.5, '#0a1a0a');
    g.addColorStop(1, '#051005');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0, 230, 118, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(64, 64, W - 128, H - 128);

    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CASHRUSH', 100, 130);
    ctx.fillStyle = '#00a854';
    ctx.font = '22px monospace';
    ctx.fillText('THE GRID', 100, 168);

    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ACHIEVEMENT UNLOCKED', W / 2, 280);

    ctx.font = '120px monospace';
    ctx.fillText(def.icon || '★', W / 2, 420);

    ctx.fillStyle = '#f0fff0';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(def.name, W / 2, 540);

    ctx.fillStyle = '#00e676';
    ctx.font = '32px monospace';
    ctx.fillText(def.desc, W / 2, 610);

    const stat = meta.sats != null ? `${Number(meta.sats).toLocaleString()} SATS` :
      meta.distance != null ? `${Number(meta.distance).toLocaleString()} m` :
      meta.sector != null ? `SECTOR ${meta.sector}` :
      meta.runs != null ? `${meta.runs} RUNS` :
      meta.feeWalls != null ? `${meta.feeWalls} FEE WALLS` :
      meta.hashrush != null ? `${meta.hashrush}× HASHRUSH` : '';
    if (stat) {
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(stat, W / 2, 680);
    }

    ctx.fillStyle = '#00a854';
    ctx.font = '24px monospace';
    ctx.fillText('Run. Survive. Collect. Own.', W / 2, H - 120);
    ctx.font = '20px monospace';
    ctx.fillText('cashrush-play.vercel.app', W / 2, H - 80);

    return canvas;
  },

  downloadCard(def, meta = {}) {
    const canvas = this.renderCard(def, meta);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashrush-${def.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  },

  async shareCard(def, meta = {}) {
    const canvas = this.renderCard(def, meta);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (!blob) return;
    const file = new File([blob], `cashrush-${def.id}.png`, { type: 'image/png' });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `CASHRUSH — ${def.name}`,
          text: `${def.name}: ${def.desc}`,
          files: [file]
        });
        return;
      }
    } catch (_) {}
    this.downloadCard(def, meta);
  }
};
