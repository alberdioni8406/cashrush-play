/**
 * CASHRUSH — Core game loop & world
 */

import { CONFIG, SECTORS } from './config.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { CollectibleManager } from './collectibles.js';
import { PowerUpManager } from './powerups.js';
import { Audio } from './audio.js';
import { Storage } from './storage.js';
import { Achievements } from './achievements.js';

export class Game {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});
    this.player = new Player();
    this.obstacles = new ObstacleManager();
    this.collectibles = new CollectibleManager();
    this.powerups = new PowerUpManager();

    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.lastTime = 0;
    this.rafId = null;

    // World state
    this.speed = CONFIG.BASE_SPEED * (this.dailyMods.speedMult || 1);
    this.distance = 0;
    this.score = 0;
    this.sats = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.runTime = 0;
    this.feeWallsJumped = 0;
    this.hashrushCount = 0;
    this.satsThisRun = 0;
    this.multiplier = 1;

    // Parallax offsets
    this.parallax = [0, 0, 0, 0];
    this.particles = [];
    this.bgPhase = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
    this.groundY = h * CONFIG.GROUND_Y_RATIO;
    // Mild scale — keeps jump physics consistent on PC/tablet/mobile
    const raw = h / (CONFIG.DESIGN_HEIGHT || 700);
    this.worldScale = Math.min(CONFIG.SCALE_MAX || 1.35, Math.max(CONFIG.SCALE_MIN || 0.95, raw));
    if (this.player) {
      this.applyPlayerScale();
      this.player.x = w * CONFIG.PLAYER_X_RATIO;
      if (!this.running) this.player.y = this.groundY - this.player.height;
    }
  }

  applyPlayerScale() {
    const s = this.worldScale || 1;
    this.player.width = Math.round(CONFIG.PLAYER_WIDTH * s);
    this.player.height = Math.round(CONFIG.PLAYER_HEIGHT * s);
    // Scale jump/gravity so arc height matches obstacle scale
    this.player.jumpForce = CONFIG.JUMP_FORCE * Math.sqrt(s);
    this.player.gravity = CONFIG.GRAVITY * s;
  }

  start(charId, options = {}) {
    this.dailyMode = !!(options && options.dailyMode);
    this.dailyMods = (options && options.mods) || {};
    this.isDailyRun = !!(options && options.dailyMode);

    this.player.setCharacter(charId || Storage.get('selectedCharacter') || 'cash');
    this.player.reset();
    this.applyPlayerScale();
    this.player.x = this.w * CONFIG.PLAYER_X_RATIO;
    this.player.y = this.groundY - this.player.height;

    this.obstacles.reset();
    this.collectibles.reset();
    this.powerups.reset();
    this.obstacles.setMods?.(this.dailyMods);
    this.collectibles.setMods?.(this.dailyMods);
    this.powerups.setMods?.(this.dailyMods);

    this.speed = CONFIG.BASE_SPEED * (this.dailyMods.speedMult || 1);
    this.distance = 0;
    this.score = 0;
    this.sats = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.runTime = 0;
    this.feeWallsJumped = 0;
    this.hashrushCount = 0;
    this.satsThisRun = 0;
    this.multiplier = 1;
    this.parallax = [0, 0, 0, 0];
    this.particles = [];
    this.bgPhase = 0;
    this.gameOver = false;
    this.paused = false;
    this.running = true;
    this.sectorIndex = 0;
    this.sectorsCleared = 0;
    this.tookDamage = false;
    this.orbsThisRun = 0;
    this.sectorBannerTimer = 180;
    this.lastTime = performance.now();

    Audio.startMusic();
    this.loop(this.lastTime);
    this.updateHUD();
    this.onEvent('sector', this.currentSector());
  }

  currentSector() {
    return SECTORS[Math.min(this.sectorIndex, SECTORS.length - 1)];
  }

  checkSectorProgress() {
    const sector = this.currentSector();
    if (!sector || sector.id >= 10) return;
    if (this.distance >= sector.goalDistance) {
      this.sectorsCleared++;
      const bonus = 500 + this.sectorIndex * 350;
      this.score += bonus;
      const cleared = sector;
      this.sectorIndex = Math.min(this.sectorIndex + 1, SECTORS.length - 1);
      // Brief on-canvas banner only — never pause the run
      this.sectorBannerTimer = 120;
      this.sectorFlash = {
        title: 'SECTOR ' + cleared.id + ' CLEARED',
        sub: '+' + bonus + '  →  ' + this.currentSector().name,
        timer: 120
      };
      // Achievements evaluated via checkLive / checkRun
    }
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    Audio.stopMusic();
  }

  pause() {
    if (!this.running || this.gameOver) return;
    this.paused = true;
    Audio.stopMusic();
    this.onEvent('pause');
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    Audio.startMusic();
    this.loop(this.lastTime);
    this.onEvent('resume');
  }

  loop(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(t => this.loop(t));

    if (this.paused || document.hidden) {
      this.lastTime = now;
      return;
    }

    const dt = Math.min((now - this.lastTime) / (1000 / 60), 3); // normalize to 60fps units
    this.lastTime = now;

    this.update(dt);
    this.draw();
  }

  update(dt) {
    if (this.gameOver) return;

    this.runTime += dt / 60;

    // Speed progression
    const late = this.distance > 3000;
    this.speed = Math.min(
      CONFIG.MAX_SPEED,
      this.speed + (late ? CONFIG.SPEED_ACCEL_LATE : CONFIG.SPEED_ACCEL) * dt
    );

    let effectiveSpeed = this.speed;
    if (this.player.speedBoost) effectiveSpeed *= CONFIG.SPEED_BOOST_MULT;
    if (this.player.hashrush) effectiveSpeed *= 1.15;

    this.distance += effectiveSpeed * 0.18 * dt;
    this.score += effectiveSpeed * CONFIG.DISTANCE_SCORE_RATE * this.combo * this.multiplier * dt;

    if (this.sectorBannerTimer > 0) this.sectorBannerTimer -= dt;
    this.checkSectorProgress();
    // Non-blocking goal checks while running
    try {
      Achievements.checkLive({
        distance: this.distance,
        sectorReached: (this.sectorIndex || 0) + 1,
        feeWallsJumped: this.feeWallsJumped,
        hashrushCount: this.hashrushCount
      });
    } catch (_) {}

    // Parallax
    CONFIG.PARALLAX.forEach((p, i) => {
      this.parallax[i] = (this.parallax[i] + effectiveSpeed * p * dt) % this.w;
    });

    this.player.update(dt, this.groundY);
    this.obstacles.setScale(this.worldScale || 1);
    this.obstacles.update(dt, effectiveSpeed, this.groundY, this.w, this.score);
    this.collectibles.setScale?.(this.worldScale || 1);
    this.collectibles.update(dt, effectiveSpeed, this.player, this.groundY, this.w);
    this.powerups.setScale?.(this.worldScale || 1);
    this.powerups.update(dt, effectiveSpeed, this.groundY, this.w);

    // Combo decay
    this.comboTimer -= dt;
    if (this.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - 1);
      this.comboTimer = CONFIG.COMBO_WINDOW * 0.5;
    }

    // Collections
    const cols = this.collectibles.checkCollections(this.player);
    for (const c of cols) {
      this.onCollect(c);
    }

    // Power-ups
    const powers = this.powerups.checkCollections(this.player);
    for (const p of powers) {
      this.powerups.apply(this.player, p);
      Audio.powerup();
      if (p.type === 'hashrush') {
        this.hashrushCount++;
        Audio.hashrush();
        Audio.setMusicIntensity(true);
        this.multiplier = CONFIG.HASHRUSH_MULT;
      }
      this.showPowerupIndicator(p.info.label);
    }

    if (this.player.hashrush && this.player.hashrushTimer <= 0) {
      this.multiplier = 1;
      Audio.setMusicIntensity(false);
    }

    // Collisions
    const hit = this.obstacles.checkCollisions(this.player);
    if (hit) {
      // Count fee walls jumped (passed)
      if (hit.type === 'feeWall' && !hit.hitCounted) {
        // will count on successful pass instead
      }
      const fatal = this.player.takeHit();
      this.tookDamage = true;
      if (fatal) {
        this.endGame();
      } else {
        Audio.hit();
        this.combo = 1;
        // destroy or phase
        if (this.player.abilityActive && this.player.char.ability === 'destroy') {
          hit.alive = false;
        }
        if (this.player.abilityActive && this.player.char.ability === 'phase') {
          hit.hit = true; // ignore further
        }
      }
    }

    // Count successful fee wall passes
    for (const o of this.obstacles.list) {
      if (o.type === 'feeWall' && !o.passed && o.x + o.w < this.player.x) {
        o.passed = true;
        this.feeWallsJumped++;
      }
    }

    // Particles
    this.updateParticles(dt, effectiveSpeed);

    // Ability meter UI
    this.updateAbilityUI();

    this.updateHUD();
  }

  onCollect(c) {
    this.comboTimer = CONFIG.COMBO_WINDOW;
    this.combo = Math.min(CONFIG.COMBO_MAX, this.combo + 0.5);
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    let value = 0;
    if (c.type === 'sat') {
      value = CONFIG.SAT_VALUE * this.combo * this.multiplier;
      this.sats += CONFIG.SAT_VALUE;
      this.satsThisRun += CONFIG.SAT_VALUE;
      Audio.collectSat();
    } else if (c.type === 'cashDrop') {
      value = CONFIG.CASH_DROP_VALUE * this.combo * this.multiplier;
      this.sats += Math.floor(CONFIG.CASH_DROP_VALUE / 5);
      this.satsThisRun += Math.floor(CONFIG.CASH_DROP_VALUE / 5);
      this.multiplier = Math.max(this.multiplier, CONFIG.CASH_DROP_MULTIPLIER);
      // temporary multiplier boost
      setTimeout(() => {
        if (!this.player.hashrush) this.multiplier = Math.max(1, this.multiplier / CONFIG.CASH_DROP_MULTIPLIER);
      }, CONFIG.CASH_DROP_DURATION * 16);
      Audio.collectCashDrop();
      this.spawnParticles(c.x, c.y, CONFIG.COLORS.gold, 12);
    } else if (c.type === 'orb') {
      value = (CONFIG.TOKEN_ORB_VALUES[c.rarity] || 50) * this.combo * this.multiplier;
      Audio.collectOrb(c.rarity);
      this.spawnParticles(c.x, c.y, CONFIG.COLORS.purple, 10);
      if (c.rarity === 'legendary') {
        try { Achievements.recordLegendaryOrb(); } catch (_) {}
      }
      this.orbsThisRun = (this.orbsThisRun || 0) + 1;
      try {
        const d = Storage.data; d.stats = d.stats || {};
        d.stats.orbsCollected = (d.stats.orbsCollected || 0) + 1;
      } catch (_) {}
    }

    this.score += value;
    this.spawnParticles(c.x, c.y, CONFIG.COLORS.green, 6);
  }

  endGame() {
    this.gameOver = true;
    this.running = false;
    try { Audio.gameOver(); } catch (_) {}
    try { Audio.stopMusic(); } catch (_) {}

    let isNewHigh = false;
    try {
      if (!Storage.data) Storage.load();
      const data = Storage.data;
      isNewHigh = this.score > (data.highScore || 0);
      if (isNewHigh) data.highScore = Math.floor(this.score);
      data.totalDistance = (data.totalDistance || 0) + Math.floor(this.distance);
      data.totalSats = (data.totalSats || 0) + this.sats;
      data.totalPlayTime = (data.totalPlayTime || 0) + this.runTime;
      data.stats = data.stats || {};
      data.stats.gamesPlayed = (data.stats.gamesPlayed || 0) + 1;
      data.stats.feeWallsJumped = (data.stats.feeWallsJumped || 0) + this.feeWallsJumped;
      data.stats.hashrushActivations = (data.stats.hashrushActivations || 0) + this.hashrushCount;
      data.stats.maxCombo = Math.max(data.stats.maxCombo || 0, this.maxCombo);
      Storage.save();
      Storage.checkCharacterUnlocks(data.highScore);
      Achievements.checkRun({
        gamesPlayed: data.stats.gamesPlayed,
        satsThisRun: this.satsThisRun,
        distance: this.distance,
        maxCombo: this.maxCombo,
        runTime: this.runTime,
        sectorsCleared: this.sectorsCleared || 0,
        sectorReached: (this.sectorIndex || 0) + 1,
        feeWallsJumped: this.feeWallsJumped || 0,
        hashrushCount: this.hashrushCount || 0,
        tookDamage: !!this.tookDamage
      });
      Achievements.checkProgress({
        totalSats: data.totalSats,
        totalPlayTime: data.totalPlayTime,
        feeWallsJumped: data.stats.feeWallsJumped,
        hashrushActivations: data.stats.hashrushActivations,
        totalDistance: data.totalDistance,
        gamesPlayed: data.stats.gamesPlayed
      });
    } catch (err) {
      console.warn('endGame persist error', err);
    }

    // Always fire UI event even if persist fails
    try {
      this.onEvent('gameover', {
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        sats: this.sats,
        maxCombo: this.maxCombo,
        isNewHigh,
        sectorsCleared: this.sectorsCleared || 0,
        sectorReached: (this.sectorIndex || 0) + 1,
        feeWallsJumped: this.feeWallsJumped || 0,
        hashrushCount: this.hashrushCount || 0,
        orbs: this.orbsThisRun || 0,
        runTime: this.runTime || 0,
        maxCombo: this.maxCombo || 1,
        isDailyRun: !!this.isDailyRun
      });
    } catch (err) {
      console.warn('gameover UI event failed', err);
    }
  }

  // Input
  jump() {
    if (this.player.jump()) Audio.jump();
  }

  duck(active) {
    this.player.duck(active);
    if (active) Audio.duck();
  }

  tryAbility() {
    if (this.player.activateAbility()) {
      Audio.powerup();
    }
  }

  // Visuals
  updateHUD() {
    const el = id => document.getElementById(id);
    if (el('hud-score')) el('hud-score').textContent = Math.floor(this.score).toLocaleString();
    if (el('hud-sats')) el('hud-sats').textContent = this.sats.toLocaleString();
    if (el('hud-distance')) el('hud-distance').textContent = Math.floor(this.distance) + 'm';
    if (el('hud-combo')) el('hud-combo').textContent = 'x' + this.combo.toFixed(1);
    const sector = this.currentSector();
    if (el('hud-sector') && sector) {
      el('hud-sector').textContent = 'S' + sector.id;
    }
    if (el('hud-goal') && sector) {
      if (sector.id >= 10) {
        el('hud-goal').textContent = '∞';
      } else {
        const left = Math.max(0, Math.ceil(sector.goalDistance - this.distance));
        el('hud-goal').textContent = left + 'm';
      }
    }
  }

  updateAbilityUI() {
    const meter = document.getElementById('ability-meter');
    const fill = document.getElementById('ability-fill');
    if (!meter || !fill) return;
    if (this.player.char.ability) {
      meter.classList.remove('hidden');
      fill.style.width = this.player.abilityCharge + '%';
      if (this.player.abilityReady) fill.style.boxShadow = '0 0 10px #00e5ff';
    } else {
      meter.classList.add('hidden');
    }
  }

  showPowerupIndicator(label) {
    const el = document.getElementById('powerup-indicator');
    if (!el) return;
    el.textContent = label + ' ACTIVE';
    el.classList.remove('hidden');
    clearTimeout(this._powerTimer);
    this._powerTimer = setTimeout(() => el.classList.add('hidden'), 2000);
  }

  spawnParticles(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  updateParticles(dt, speed) {
    for (const p of this.particles) {
      p.x += p.vx * dt - speed * 0.3 * dt;
      p.y += p.vy * dt;
      p.vy += 0.1 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const gy = this.groundY;

    // Background
    ctx.fillStyle = CONFIG.COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // HashRush visual shift
    if (this.player.hashrush) {
      ctx.fillStyle = 'rgba(0, 40, 0, 0.25)';
      ctx.fillRect(0, 0, w, h);
    }

    this.drawParallax(ctx, w, h, gy);

    // Ground
    ctx.fillStyle = CONFIG.COLORS.ground;
    ctx.fillRect(0, gy, w, h - gy);
    // Ground line
    ctx.strokeStyle = CONFIG.COLORS.greenDim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();

    // Grid lines on ground
    ctx.strokeStyle = 'rgba(0, 168, 84, 0.15)';
    ctx.lineWidth = 1;
    const gridOff = (this.parallax[3] * 2) % 40;
    for (let x = -gridOff; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Entities
    this.collectibles.draw(ctx);
    this.powerups.draw(ctx);
    this.obstacles.draw(ctx);
    this.player.draw(ctx);

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Non-blocking sector banner (game keeps running)
    const flash = this.sectorFlash;
    if (flash && flash.timer > 0) {
      flash.timer -= 1;
      const alpha = Math.min(1, flash.timer / 30);
      ctx.globalAlpha = alpha;
      const bw = Math.min(420, w * 0.75);
      const bx = (w - bw) / 2;
      const by = h * 0.14;
      ctx.fillStyle = 'rgba(0, 25, 0, 0.82)';
      ctx.fillRect(bx, by, bw, 54);
      ctx.strokeStyle = CONFIG.COLORS.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, 54);
      ctx.fillStyle = CONFIG.COLORS.green;
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(flash.title, w / 2, by + 22);
      ctx.fillStyle = CONFIG.COLORS.gold || '#ffd700';
      ctx.font = '12px monospace';
      ctx.fillText(flash.sub, w / 2, by + 42);
      ctx.globalAlpha = 1;
    } else if (this.sectorBannerTimer > 0) {
      // Opening sector label
      const sector = this.currentSector();
      const alpha = Math.min(1, this.sectorBannerTimer / 40);
      ctx.globalAlpha = alpha * 0.95;
      const bw = Math.min(420, w * 0.75);
      const bx = (w - bw) / 2;
      const by = h * 0.14;
      ctx.fillStyle = 'rgba(0, 20, 0, 0.75)';
      ctx.fillRect(bx, by, bw, 54);
      ctx.strokeStyle = CONFIG.COLORS.greenDim;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, 54);
      ctx.fillStyle = CONFIG.COLORS.green;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SECTOR ' + sector.id + ' — ' + sector.name, w / 2, by + 22);
      ctx.fillStyle = CONFIG.COLORS.greenDim;
      ctx.font = '11px monospace';
      ctx.fillText(sector.blurb, w / 2, by + 42);
      ctx.globalAlpha = 1;
    }
  }

  drawParallax(ctx, w, h, gy) {
    // Layer 0: distant city
    const p0 = this.parallax[0];
    ctx.fillStyle = '#0a150a';
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 90 - p0 * 0.5) % (w + 100)) - 50;
      const bh = 40 + (i % 5) * 25;
      ctx.fillRect(bx, gy - bh - 80, 30 + (i % 3) * 15, bh);
    }

    // Layer 1: network towers
    const p1 = this.parallax[1];
    ctx.strokeStyle = 'rgba(0, 168, 84, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const tx = ((i * 140 - p1) % (w + 120)) - 40;
      const th = 60 + (i % 4) * 30;
      ctx.beginPath();
      ctx.moveTo(tx, gy - 20);
      ctx.lineTo(tx, gy - th - 40);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 230, 118, 0.15)';
      ctx.fillRect(tx - 8, gy - th - 50, 16, 12);
    }

    // Layer 2: digital landscape hills
    const p2 = this.parallax[2];
    ctx.fillStyle = '#081408';
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x <= w; x += 20) {
      const y = gy - 30 - Math.sin((x + p2) * 0.01) * 20 - Math.sin((x + p2) * 0.03) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, gy);
    ctx.closePath();
    ctx.fill();

    // Stars / data points
    ctx.fillStyle = 'rgba(0, 230, 118, 0.4)';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 73 + this.parallax[0] * 0.2) % w);
      const sy = (i * 37) % (gy - 60);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}
