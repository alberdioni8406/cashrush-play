/**
 * CASHRUSH — Lightweight procedural audio via Web Audio API
 * No external files required. Fully offline.
 */

import { Storage } from './storage.js';

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicOsc = null;
let musicInterval = null;
let isMusicPlaying = false;

function ensureCtx() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.7;
    sfxGain.connect(masterGain);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(masterGain);
  } catch (e) {
    console.warn('Web Audio not available', e);
  }
}

function tone(freq, duration, type = 'square', volume = 0.3, detune = 0) {
  if (!ctx || !Storage.get('settings')?.sfx) return;
  ensureCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const Audio = {
  init() {
    ensureCtx();
    // Resume on first user gesture
    const resume = () => {
      if (ctx && ctx.state === 'suspended') ctx.resume();
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('keydown', resume);
    };
    document.addEventListener('pointerdown', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  },

  jump() {
    tone(420, 0.08, 'square', 0.25);
    setTimeout(() => tone(620, 0.1, 'square', 0.2), 40);
  },

  duck() {
    tone(180, 0.1, 'triangle', 0.2);
  },

  collectSat() {
    tone(880, 0.06, 'sine', 0.18);
    setTimeout(() => tone(1320, 0.08, 'sine', 0.15), 30);
  },

  collectCashDrop() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => tone(f, 0.12, 'square', 0.22), i * 50);
    });
  },

  collectOrb(rarity) {
    const base = { common: 600, uncommon: 750, rare: 900, legendary: 1100 }[rarity] || 600;
    tone(base, 0.1, 'sine', 0.25);
    setTimeout(() => tone(base * 1.5, 0.15, 'sine', 0.2), 60);
  },

  powerup() {
    [400, 600, 800, 1000].forEach((f, i) => {
      setTimeout(() => tone(f, 0.1, 'sawtooth', 0.18), i * 40);
    });
  },

  hashrush() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => tone(300 + i * 80, 0.08, 'square', 0.2), i * 35);
    }
  },

  hit() {
    tone(120, 0.25, 'sawtooth', 0.35);
    setTimeout(() => tone(80, 0.3, 'triangle', 0.25), 50);
  },

  gameOver() {
    [400, 350, 300, 200].forEach((f, i) => {
      setTimeout(() => tone(f, 0.2, 'triangle', 0.25), i * 120);
    });
  },

  achievement() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => tone(f, 0.15, 'sine', 0.22), i * 70);
    });
  },

  uiClick() {
    tone(660, 0.04, 'square', 0.12);
  },

  startMusic() {
    if (!ctx || !Storage.get('settings')?.music || isMusicPlaying) return;
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    isMusicPlaying = true;

    // Simple pulsing bass + arpeggio loop
    const notes = [110, 130.81, 146.83, 164.81];
    let idx = 0;

    const playBeat = () => {
      if (!isMusicPlaying || !Storage.get('settings')?.music) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = notes[idx % notes.length];
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(g);
      g.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      // Higher sparkle
      if (idx % 2 === 0) {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'sine';
        o2.frequency.value = notes[idx % notes.length] * 4;
        g2.gain.setValueAtTime(0.06, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        o2.connect(g2);
        g2.connect(musicGain);
        o2.start();
        o2.stop(ctx.currentTime + 0.2);
      }
      idx++;
    };

    playBeat();
    musicInterval = setInterval(playBeat, 380);
  },

  stopMusic() {
    isMusicPlaying = false;
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  },

  setMusicIntensity(high) {
    if (musicGain) {
      musicGain.gain.setTargetAtTime(high ? 0.35 : 0.22, ctx.currentTime, 0.1);
    }
  }
};
