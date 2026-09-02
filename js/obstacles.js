/**
 * CASHRUSH — Obstacle system
 */

import { CONFIG } from './config.js';

const TYPES = {
  feeWall: {
    w: 36, h: 70, color: '#ff3366',
    label: 'FEE', needsJump: true, needsDuck: false
  },
  mempoolMonster: {
    w: 48, h: 44, color: '#ff6d00',
    label: 'MPOOL', needsJump: true, needsDuck: false, moves: true
  },
  centralizer: {
    w: 56, h: 84, color: '#d500f9',
    label: 'CTRL', needsJump: true, needsDuck: false, complex: true
  },
  brokenBlock: {
    w: 40, h: 40, color: '#ffaa00',
    label: 'BLK', needsJump: true, needsDuck: false, falls: true
  },
  redTape: {
    w: 72, h: 22, color: '#ff1744',
    label: 'TAPE', needsJump: false, needsDuck: true, slows: true
  }
};

export class Obstacle {
  constructor(type, x, groundY, scale = 1) {
    const t = TYPES[type] || TYPES.feeWall;
    const s = scale || 1;
    this.type = type;
    this.x = x;
    this.w = Math.round(t.w * s);
    this.h = Math.round(t.h * s);
    this.y = groundY - this.h;
    this.color = t.color;
    this.label = t.label;
    this.needsJump = t.needsJump;
    this.needsDuck = t.needsDuck;
    this.moves = !!t.moves;
    this.falls = !!t.falls;
    this.slows = !!t.slows;
    this.complex = !!t.complex;
    this.vy = this.falls ? 1.5 + Math.random() * 1.5 : 0;
    this.vx = this.moves ? -1.5 - Math.random() : 0;
    this.alive = true;
    this.hit = false;
    this.frame = 0;
  }

  get hitbox() {
    // Inset so only a solid body impact counts, not a 1px graze
    const ix = Math.max(4, Math.floor(this.w * 0.15));
    const iy = Math.max(4, Math.floor(this.h * 0.12));
    return {
      x: this.x + ix,
      y: this.y + iy,
      w: Math.max(6, this.w - ix * 2),
      h: Math.max(6, this.h - iy * 2)
    };
  }

  update(dt, speed) {
    this.x -= speed * dt;
    if (this.moves) this.x += this.vx * dt;
    if (this.falls) {
      this.y += this.vy * dt;
      // bounce slightly near ground
      if (this.y > 1000) this.alive = false;
    }
    this.frame += dt * 0.2;
    if (this.x + this.w < -50) this.alive = false;
  }

  draw(ctx) {
    const { x, y, w, h, color, type } = this;

    ctx.save();
    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    if (type === 'feeWall') {
      // Digital barrier
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#1a0000';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 4, y + 8 + i * 12, w - 8, 4);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.fillText('FEE', x + 4, y + 14);
    } else if (type === 'mempoolMonster') {
      // Spiky creature
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h * 0.4);
      ctx.lineTo(x + w * 0.8, y + h);
      ctx.lineTo(x + w * 0.2, y + h);
      ctx.lineTo(x, y + h * 0.4);
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 10, y + 12, 6, 6);
      ctx.fillRect(x + 24, y + 12, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 12, y + 14, 3, 3);
      ctx.fillRect(x + 26, y + 14, 3, 3);
    } else if (type === 'centralizer') {
      // Tall mechanical tower
      ctx.fillStyle = color;
      ctx.fillRect(x + 8, y, w - 16, h);
      ctx.fillRect(x, y + 10, w, 12);
      ctx.fillRect(x, y + h - 20, w, 16);
      // Antenna
      ctx.fillStyle = CONFIG.COLORS.warning;
      ctx.fillRect(x + w / 2 - 2, y - 12, 4, 14);
      ctx.beginPath();
      ctx.arc(x + w / 2, y - 14, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'brokenBlock') {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = '#1a1000';
      ctx.fillRect(x + 8, y + 8, 6, 6);
      ctx.fillRect(x + 18, y + 16, 6, 6);
    } else if (type === 'redTape') {
      // Horizontal barrier at mid height
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + i * 12, y + 2, 8, h - 4);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.fillText('RED TAPE', x + 6, y + 12);
    }

    ctx.restore();
  }
}

export class ObstacleManager {
  constructor() {
    this.list = [];
    this.spawnTimer = 0;
    this.spawnInterval = CONFIG.OBSTACLE_SPAWN_BASE;
    this.scale = 1;
  }

  reset() {
    this.list = [];
    this.spawnTimer = 60;
    this.spawnInterval = CONFIG.OBSTACLE_SPAWN_BASE;
  }

  setScale(s) {
    this.scale = s || 1;
  }

  update(dt, speed, groundY, canvasW, score) {
    // Difficulty scaling
    const progress = Math.min(1, score / 50000);
    this.spawnInterval = CONFIG.OBSTACLE_SPAWN_BASE - progress * (CONFIG.OBSTACLE_SPAWN_BASE - CONFIG.OBSTACLE_SPAWN_MIN);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn(groundY, canvasW, progress);
      this.spawnTimer = this.spawnInterval + (Math.random() * 20 - 10);
    }

    for (const o of this.list) {
      o.update(dt, speed);
    }
    this.list = this.list.filter(o => o.alive);
  }

  spawn(groundY, canvasW, progress) {
    const types = CONFIG.OBSTACLE_TYPES;
    const s = this.scale || 1;
    // Weight toward harder types later
    let type;
    const r = Math.random();
    if (progress < 0.2) {
      type = r < 0.6 ? 'feeWall' : r < 0.85 ? 'redTape' : 'brokenBlock';
    } else if (progress < 0.5) {
      type = types[Math.floor(Math.random() * types.length)];
    } else {
      // more complex
      const hard = ['centralizer', 'mempoolMonster', 'feeWall', 'brokenBlock'];
      type = hard[Math.floor(Math.random() * hard.length)];
    }

    const o = new Obstacle(type, canvasW + 20, groundY, s);

    // Red tape is mid-air (scaled)
    if (type === 'redTape') {
      o.y = groundY - Math.round(60 * s);
      o.h = Math.round(20 * s);
    }
    // Occasional double spawn
    if (progress > 0.4 && Math.random() < 0.25) {
      const o2 = new Obstacle('feeWall', canvasW + 80 + Math.random() * 40, groundY, s);
      this.list.push(o2);
    }

    this.list.push(o);
  }

  checkCollisions(player) {
    const ph = player.hitbox;
    for (const o of this.list) {
      if (o.hit) continue;
      const oh = o.hitbox;
      // Axis overlap
      const overlapX = Math.min(ph.x + ph.w, oh.x + oh.w) - Math.max(ph.x, oh.x);
      const overlapY = Math.min(ph.y + ph.h, oh.y + oh.h) - Math.max(ph.y, oh.y);
      if (overlapX <= 0 || overlapY <= 0) continue;

      // Require a concrete impact: meaningful area, not a light corner graze
      const minDim = Math.min(ph.w, ph.h, oh.w, oh.h);
      const area = overlapX * overlapY;
      const areaThreshold = minDim * minDim * 0.18; // ~18% of smaller box
      const depthThreshold = Math.max(6, minDim * 0.22);

      if (overlapX >= depthThreshold && overlapY >= depthThreshold * 0.5 && area >= areaThreshold) {
        o.hit = true;
        return o;
      }
    }
    return null;
  }

  draw(ctx) {
    for (const o of this.list) o.draw(ctx);
  }
}
