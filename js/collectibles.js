/**
 * CASHRUSH — Collectibles: Sats, Cash Drops, Token Orbs
 */

import { CONFIG } from './config.js';

export class Collectible {
  constructor(type, x, y, extra = {}) {
    this.type = type; // 'sat' | 'cashDrop' | 'orb'
    this.x = x;
    this.y = y;
    this.rarity = extra.rarity || 'common';
    this.alive = true;
    this.collected = false;
    this.frame = Math.random() * 10;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.magnetPull = false;
  }

  get hitbox() {
    const s = this.type === 'sat' ? 12 : this.type === 'cashDrop' ? 20 : 16;
    return { x: this.x - s / 2, y: this.y - s / 2, w: s, h: s };
  }

  update(dt, speed, player) {
    this.x -= speed * dt;
    this.frame += dt * 0.15;
    this.y += Math.sin(this.frame + this.bobOffset) * 0.3;

    // Magnet attraction
    if (player.magnetActive || (player.abilityActive && player.char.ability === 'attract')) {
      const dx = (player.x + player.width / 2) - this.x;
      const dy = (player.y + player.height / 2) - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        this.x += dx * 0.12 * dt;
        this.y += dy * 0.12 * dt;
        this.magnetPull = true;
      }
    }

    if (this.x < -40) this.alive = false;
  }

  draw(ctx) {
    const { x, y, type, rarity } = this;
    ctx.save();

    if (type === 'sat') {
      // Small green sat
      ctx.shadowColor = CONFIG.COLORS.green;
      ctx.shadowBlur = 6;
      ctx.fillStyle = CONFIG.COLORS.green;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = CONFIG.COLORS.greenGlow;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      // tiny ₿
      ctx.fillStyle = '#003300';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('₿', x, y + 2.5);
    } else if (type === 'cashDrop') {
      // Distinctive diamond-like drop
      ctx.shadowColor = CONFIG.COLORS.gold;
      ctx.shadowBlur = 12;
      ctx.fillStyle = CONFIG.COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 10, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff8e1';
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 5, y);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'orb') {
      const colors = {
        common: CONFIG.COLORS.greenDim,
        uncommon: CONFIG.COLORS.cyan,
        rare: CONFIG.COLORS.purple,
        legendary: CONFIG.COLORS.gold
      };
      const col = colors[rarity] || colors.common;
      ctx.shadowColor = col;
      ctx.shadowBlur = rarity === 'legendary' ? 16 : 8;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Rarity ring
      if (rarity !== 'common') {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 12 + Math.sin(this.frame) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export class CollectibleManager {
  constructor() {
    this.list = [];
    this.spawnTimer = 0;
  }

  reset() {
    this.list = [];
    this.spawnTimer = 40;
  }

  update(dt, speed, player, groundY, canvasW) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (Math.random() < CONFIG.COLLECTIBLE_SPAWN_CHANCE) {
        this.spawn(groundY, canvasW);
      }
      this.spawnTimer = 25 + Math.random() * 35;
    }

    for (const c of this.list) {
      c.update(dt, speed, player);
    }
    this.list = this.list.filter(c => c.alive && !c.collected);
  }

  spawn(groundY, canvasW) {
    const x = canvasW + 30 + Math.random() * 60;
    // Height: ground level or floating
    const yBase = groundY - 30 - Math.random() * 90;
    const r = Math.random();

    if (r < 0.72) {
      // Sat cluster possible
      const count = Math.random() < 0.3 ? 3 : 1;
      for (let i = 0; i < count; i++) {
        this.list.push(new Collectible('sat', x + i * 18, yBase - i * 8));
      }
    } else if (r < 0.90) {
      this.list.push(new Collectible('cashDrop', x, yBase));
    } else {
      // Token Orb with rarity
      const rr = Math.random();
      let rarity = 'common';
      if (rr > 0.97) rarity = 'legendary';
      else if (rr > 0.88) rarity = 'rare';
      else if (rr > 0.65) rarity = 'uncommon';
      this.list.push(new Collectible('orb', x, yBase, { rarity }));
    }
  }

  checkCollections(player) {
    const collected = [];
    const ph = player.hitbox;
    for (const c of this.list) {
      if (c.collected) continue;
      const ch = c.hitbox;
      if (ph.x < ch.x + ch.w && ph.x + ph.w > ch.x &&
          ph.y < ch.y + ch.h && ph.y + ph.h > ch.y) {
        c.collected = true;
        c.alive = false;
        collected.push(c);
      }
    }
    return collected;
  }

  draw(ctx) {
    for (const c of this.list) c.draw(ctx);
  }
}
