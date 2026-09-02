/**
 * CASHRUSH — Application entry & UI state machine
 */

import { Game } from './game.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { Characters } from './characters.js';
import { Achievements } from './achievements.js';
import { CONFIG } from './config.js';

// Screens
const screens = {
  loading: document.getElementById('loading-screen'),
  menu: document.getElementById('main-menu'),
  howto: document.getElementById('howto-screen'),
  characters: document.getElementById('character-screen'),
  achievements: document.getElementById('achievements-screen'),
  settings: document.getElementById('settings-screen'),
  game: document.getElementById('game-screen')
};

const overlays = {
  pause: document.getElementById('pause-overlay'),
  gameover: document.getElementById('gameover-overlay'),
  sector: document.getElementById('sector-overlay')
};

let game = null;
let selectedCharId = 'cash';
let isMobile = false;

function showScreen(name) {
  // HTML data-back uses "main-menu"; internal key is "menu"
  const key = name === 'main-menu' ? 'menu' : name;
  Object.values(screens).forEach(s => {
    if (s) s.classList.remove('active');
  });
  if (screens[key]) {
    screens[key].classList.add('active');
  } else {
    // Safe fallback — never leave a blank UI
    console.warn('Unknown screen:', name, '→ falling back to menu');
    if (screens.menu) screens.menu.classList.add('active');
  }
}

function showOverlay(name) {
  Object.values(overlays).forEach(o => o.classList.remove('active'));
  if (name && overlays[name]) overlays[name].classList.add('active');
}

function hideOverlays() {
  Object.values(overlays).forEach(o => {
    if (!o) return;
    o.classList.remove('active');
    o.style.display = '';
  });
}

// Loading simulation
async function boot() {
  Storage.load();
  Audio.init();

  const bar = document.getElementById('loading-bar');
  const text = document.getElementById('loading-text');
  const steps = [
    'Initializing Grid...',
    'Loading runner protocols...',
    'Calibrating sat collectors...',
    'Syncing local ledger...',
    'Ready.'
  ];

  for (let i = 0; i < steps.length; i++) {
    text.textContent = steps[i];
    bar.style.width = ((i + 1) / steps.length * 100) + '%';
    await new Promise(r => setTimeout(r, 180 + Math.random() * 120));
  }

  // Detect mobile
  isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth < 900);

  // Apply settings
  applySettings();

  // Menu stats
  updateMenuStats();

  showScreen('menu');

  // Init game instance
  const canvas = document.getElementById('game-canvas');
  game = new Game(canvas, onGameEvent);

  // Register SW for offline
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  }
}

function updateMenuStats() {
  const data = Storage.data;
  document.getElementById('menu-highscore').textContent = (data.highScore || 0).toLocaleString();
  document.getElementById('menu-totalsats').textContent = (data.totalSats || 0).toLocaleString();
}

function applySettings() {
  const s = Storage.get('settings') || {};
  document.getElementById('setting-sfx').checked = s.sfx !== false;
  document.getElementById('setting-music').checked = s.music !== false;
  document.getElementById('setting-mobile-controls').checked = !!s.mobileControls;
  document.getElementById('setting-reduced-motion').checked = !!s.reducedMotion;

  const mobileCtrl = document.getElementById('mobile-controls');
  if (s.mobileControls || (isMobile && s.mobileControls !== false)) {
    // show only if explicitly enabled or mobile + default
  }
  if (s.mobileControls) {
    mobileCtrl.classList.remove('hidden');
  } else {
    mobileCtrl.classList.add('hidden');
  }
}

function onGameEvent(type, data) {
  if (type === 'pause') {
    showOverlay('pause');
  } else if (type === 'resume') {
    hideOverlays();
  } else if (type === 'gameover') {
    try {
      document.getElementById('go-score').textContent = (data.score || 0).toLocaleString();
      document.getElementById('go-distance').textContent = (data.distance || 0) + 'm';
      document.getElementById('go-sats').textContent = (data.sats || 0).toLocaleString();
      document.getElementById('go-combo').textContent = 'x' + (data.maxCombo || 1).toFixed(1);
      const secEl = document.getElementById('go-sectors');
      if (secEl) secEl.textContent = String(data.sectorsCleared || 0);
      const highEl = document.getElementById('go-new-high');
      if (highEl) highEl.style.display = data.isNewHigh ? 'flex' : 'none';
    } catch (_) {}
    showOverlay('gameover');
    const go = document.getElementById('gameover-overlay');
    if (go) {
      go.classList.add('active');
      go.style.display = 'flex';
    }
    updateMenuStats();
  } else if (type === 'sector_clear') {
    try {
      document.getElementById('sector-cleared-name').textContent =
        'S' + data.cleared.id + ' ' + data.cleared.name;
      document.getElementById('sector-bonus').textContent = '+' + (data.bonus || 0);
      document.getElementById('sector-next-name').textContent =
        'S' + data.next.id + ' ' + data.next.name;
      document.getElementById('sector-next-blurb').textContent = data.next.blurb || '';
    } catch (_) {}
    if (game) game.pause();
    showOverlay('sector');
    const so = document.getElementById('sector-overlay');
    if (so) {
      so.classList.add('active');
      so.style.display = 'flex';
    }
    Audio.achievement();
  }
}

function startGame() {
  selectedCharId = Storage.get('selectedCharacter') || 'cash';
  hideOverlays();
  showScreen('game');
  const mobileCtrl = document.getElementById('mobile-controls');
  const s = Storage.get('settings') || {};
  if (s.mobileControls || isMobile) {
    mobileCtrl.classList.remove('hidden');
  } else {
    mobileCtrl.classList.add('hidden');
  }
  game.start(selectedCharId);
}

// UI bindings
document.getElementById('btn-play').addEventListener('click', () => {
  Audio.uiClick();
  startGame();
});

document.getElementById('btn-howto')?.addEventListener('click', () => {
  Audio.uiClick();
  showScreen('howto');
});

document.getElementById('btn-howto-play')?.addEventListener('click', () => {
  Audio.uiClick();
  startGame();
});

document.getElementById('btn-sector-continue')?.addEventListener('click', () => {
  Audio.uiClick();
  hideOverlays();
  if (game) game.resume();
});

document.getElementById('btn-characters').addEventListener('click', () => {
  Audio.uiClick();
  selectedCharId = Characters.getSelected();
  Characters.renderList(document.getElementById('character-list'), selectedCharId);
  showScreen('characters');
});

document.getElementById('btn-achievements').addEventListener('click', () => {
  Audio.uiClick();
  Achievements.renderList(document.getElementById('achievements-list'));
  showScreen('achievements');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  Audio.uiClick();
  applySettings();
  showScreen('settings');
});

document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    Audio.uiClick();
    showScreen(btn.dataset.back);
    updateMenuStats();
  });
});

// Character selection
document.getElementById('character-list').addEventListener('click', e => {
  const card = e.target.closest('.char-card');
  if (!card || card.classList.contains('locked')) return;
  selectedCharId = card.dataset.id;
  document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  Audio.uiClick();
});

document.getElementById('btn-select-char').addEventListener('click', () => {
  if (Characters.select(selectedCharId)) {
    Audio.uiClick();
    showScreen('menu');
  }
});

// Settings
['setting-sfx', 'setting-music', 'setting-mobile-controls', 'setting-reduced-motion'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    const settings = Storage.get('settings') || {};
    const key = id.replace('setting-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    // map
    const map = {
      'sfx': 'sfx',
      'music': 'music',
      'mobileControls': 'mobileControls',
      'reducedMotion': 'reducedMotion'
    };
    const k = id === 'setting-sfx' ? 'sfx' :
              id === 'setting-music' ? 'music' :
              id === 'setting-mobile-controls' ? 'mobileControls' : 'reducedMotion';
    settings[k] = e.target.checked;
    Storage.set('settings', settings);
    applySettings();
  });
});

document.getElementById('btn-reset-data').addEventListener('click', () => {
  if (confirm('Reset all progress, high scores and unlocks? This cannot be undone.')) {
    Storage.reset();
    updateMenuStats();
    Audio.uiClick();
    alert('All data reset.');
  }
});

// Pause / resume / game over buttons
document.getElementById('btn-pause').addEventListener('click', () => {
  if (game && game.running && !game.gameOver) game.pause();
});

document.getElementById('btn-resume').addEventListener('click', () => {
  hideOverlays();
  if (game) game.resume();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  hideOverlays();
  startGame();
});

document.getElementById('btn-quit').addEventListener('click', () => {
  if (game) game.stop();
  hideOverlays();
  showScreen('menu');
  updateMenuStats();
});

document.getElementById('btn-retry').addEventListener('click', () => {
  hideOverlays();
  startGame();
});

document.getElementById('btn-menu').addEventListener('click', () => {
  if (game) game.stop();
  hideOverlays();
  showScreen('menu');
  updateMenuStats();
});

// Keyboard
window.addEventListener('keydown', e => {
  if (!game || !screens.game.classList.contains('active')) return;
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (!game.paused && !game.gameOver) game.jump();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    if (!game.paused && !game.gameOver) game.duck(true);
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (game.paused) {
      hideOverlays();
      game.resume();
    } else if (game.running && !game.gameOver) {
      game.pause();
    }
  } else if (e.code === 'KeyE' || e.code === 'KeyF') {
    // Ability
    if (!game.paused && !game.gameOver) game.tryAbility();
  }
});

window.addEventListener('keyup', e => {
  if (!game) return;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') game.duck(false);
});

// Touch / mobile
let touchStartY = 0;
const canvas = document.getElementById('game-canvas');

canvas.addEventListener('touchstart', e => {
  if (!game || game.paused || game.gameOver) return;
  touchStartY = e.changedTouches[0].clientY;
  // Tap = jump (unless swipe)
}, { passive: true });

let duckHoldUntil = 0;
canvas.addEventListener('touchend', e => {
  if (!game || game.paused || game.gameOver) return;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (dy > 40) {
    // Swipe down: duck for a solid duration (not a blink)
    game.duck(true);
    duckHoldUntil = performance.now() + 650;
    clearTimeout(window.__duckTimer);
    window.__duckTimer = setTimeout(() => {
      if (performance.now() >= duckHoldUntil) game.duck(false);
    }, 650);
  } else if (Math.abs(dy) < 25) {
    game.jump();
  }
}, { passive: true });

// Keep ducking while finger is held after a down-swipe start
canvas.addEventListener('touchmove', e => {
  if (!game || game.paused || game.gameOver) return;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (dy > 50) {
    game.duck(true);
    duckHoldUntil = performance.now() + 200;
  }
}, { passive: true });

// Visible mobile buttons
document.getElementById('btn-jump').addEventListener('touchstart', e => {
  e.preventDefault();
  if (game && !game.paused) game.jump();
});
const btnDuck = document.getElementById('btn-duck');
function startDuck(e) {
  e.preventDefault();
  if (game && !game.paused && !game.gameOver) game.duck(true);
}
function endDuck(e) {
  e.preventDefault();
  if (game) game.duck(false);
}
btnDuck.addEventListener('touchstart', startDuck, { passive: false });
btnDuck.addEventListener('touchend', endDuck, { passive: false });
btnDuck.addEventListener('touchcancel', endDuck, { passive: false });
btnDuck.addEventListener('mousedown', startDuck);
btnDuck.addEventListener('mouseup', endDuck);
btnDuck.addEventListener('mouseleave', endDuck);

// Prevent scroll
document.body.addEventListener('touchmove', e => {
  if (screens.game.classList.contains('active')) e.preventDefault();
}, { passive: false });

// ── Donate / Support ──────────────────────────────────────────────
const DONATE_ADDRESS = 'bitcoincash:qrlluw2ekm2zmp4qn52ashn4qt9xhhg405gcrzehu5';

async function copyDonateAddress(feedbackId) {
  try {
    await navigator.clipboard.writeText(DONATE_ADDRESS);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = DONATE_ADDRESS;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const el = document.getElementById(feedbackId);
  if (el) {
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2000);
  }
  Audio.uiClick();
}

document.getElementById('btn-donate')?.addEventListener('click', () => {
  Audio.uiClick();
  document.getElementById('donate-overlay').classList.add('active');
});

document.getElementById('btn-close-donate')?.addEventListener('click', () => {
  Audio.uiClick();
  document.getElementById('donate-overlay').classList.remove('active');
});

document.getElementById('btn-copy-donate')?.addEventListener('click', () => {
  copyDonateAddress('donate-copied');
});

document.getElementById('btn-copy-donate-modal')?.addEventListener('click', () => {
  copyDonateAddress('donate-copied-modal');
});

document.getElementById('donate-address-box')?.addEventListener('click', () => {
  copyDonateAddress('donate-copied-modal');
});

// Boot
boot();
