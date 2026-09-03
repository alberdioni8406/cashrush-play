/**
 * CASHRUSH — Power-up system
 */

import { CONFIG } from './config.js';

const POWER_TYPES = {
  magnet: { color: '#00e5ff', label: 'MAGNET', duration: CONFIG.MAGNET_DURATION },
  shield: { color: '#18ffff', label: 'SHIELD', duration: 0 },
  speed: { color: '#ffaa00', label: 'BOOST', duration: CONFIG.SPEED_BOOST_DURATION },
  hashrush: { color: '#39ff14', label: 'HASHRUSH', duration: CONFIG.HASHRUSH_DURATION }
};

export class PowerUp {
  constructor(type, x, y, scale = 1) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.scale = scale || 1;
    this.alive = true;
    this.collected = false;
    this.frame = 0;
    this.info = POWER_TYPES[type] || POWER_TYPES.magnet;
  }

  get hitbox() {
    const s = 14 * (this.scale || 1);
    return { x: this.x - s, y: this.y - s, w: s * 2, h: s * 2 };
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.frame += dt * 0.12;
    this.y += Math.sin(this.frame) * 0.4;
    if (this.x < -40) this.alive = false;
  }

  draw(ctx) {
    const { x, y, info, type } = this;
    const sc = this.scale || 1;
    ctx.save();
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 16 * sc;

    // Outer ring
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2.5 * sc;
    ctx.beginPath();
    ctx.arc(x, y, (16 + Math.sin(this.frame * 2) * 2) * sc, 0, Math.PI * 2);
    ctx.stroke();

    // Core
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(x, y, 10 * sc, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(9 * sc)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const short = type === 'hashrush' ? 'HR' : type === 'magnet' ? 'M' : type === 'shield' ? 'S' : 'B';
    ctx.fillText(short, x, y);

    ctx.restore();
  }
}

export class PowerUpManager {
  constructor() {
    this.list = [];
    this.spawnTimer = 0;
    this.scale = 1;
  }

  reset() {
    this.list = [];
    this.spawnTimer = 180;
  }

  setScale(s) {
    this.scale = Math.min(1.25, s || 1);
  }

  setMods(mods = {}) {
    this.chanceMult = mods.powerupChance ? (mods.powerupChance / 0.12) : 1;
  }

  update(dt, speed, groundY, canvasW) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (Math.random() < CONFIG.POWERUP_SPAWN_CHANCE * (this.chanceMult || 1)) {
        this.spawn(groundY, canvasW);
      }
      this.spawnTimer = 140 + Math.random() * 120;
    }

    for (const p of this.list) p.update(dt, speed);
    this.list = this.list.filter(p => p.alive && !p.collected);
  }

  spawn(groundY, canvasW) {
    const sc = this.scale || 1;
    // HashRush rarer
    const r = Math.random();
    let type;
    if (r < 0.08) type = 'hashrush';
    else if (r < 0.35) type = 'shield';
    else if (r < 0.65) type = 'magnet';
    else type = 'speed';

    const y = groundY - Math.round(45 * sc) - Math.random() * Math.round(80 * sc);
    this.list.push(new PowerUp(type, canvasW + 40, y, sc));
  }

  checkCollections(player) {
    const collected = [];
    const ph = player.hitbox;
    for (const p of this.list) {
      if (p.collected) continue;
      const hb = p.hitbox;
      if (ph.x < hb.x + hb.w && ph.x + ph.w > hb.x &&
          ph.y < hb.y + hb.h && ph.y + ph.h > hb.y) {
        p.collected = true;
        p.alive = false;
        collected.push(p);
      }
    }
    return collected;
  }

  apply(player, power) {
    switch (power.type) {
      case 'magnet':
        player.magnetActive = true;
        player.magnetTimer = CONFIG.MAGNET_DURATION;
        break;
      case 'shield':
        player.hasShield = true;
        break;
      case 'speed':
        player.speedBoost = true;
        player.speedBoostTimer = CONFIG.SPEED_BOOST_DURATION;
        break;
      case 'hashrush':
        player.hashrush = true;
        player.hashrushTimer = CONFIG.HASHRUSH_DURATION;
        player.invincible = true;
        player.invincibleTimer = CONFIG.HASHRUSH_DURATION;
        break;
    }
  }

  draw(ctx) {
    for (const p of this.list) p.draw(ctx);
  }
}
