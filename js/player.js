/**
 * CASHRUSH — Player entity & rendering (proportion-correct)
 */

import { CONFIG, CHARACTERS } from './config.js';

export class Player {
  constructor(charId = 'cash') {
    this.setCharacter(charId);
    this.reset();
  }

  setCharacter(id) {
    this.charId = id;
    this.char = CHARACTERS[id] || CHARACTERS.cash;
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.width = CONFIG.PLAYER_WIDTH;
    this.height = CONFIG.PLAYER_HEIGHT;
    this.isJumping = false;
    this.isDucking = false;
    this.onGround = true;
    this.frame = 0;
    this.animTimer = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.hasShield = false;
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.speedBoost = false;
    this.speedBoostTimer = 0;
    this.hashrush = false;
    this.hashrushTimer = 0;
    this.abilityCharge = 0;
    this.abilityReady = false;
    this.abilityActive = false;
    this.abilityTimer = 0;
    this.dead = false;
    this.flashTimer = 0;
    // Physics multipliers set by Game from worldScale
    this.jumpForce = CONFIG.JUMP_FORCE;
    this.gravity = CONFIG.GRAVITY;
  }

  get hitbox() {
    const h = this.isDucking ? this.height * CONFIG.DUCK_HEIGHT_RATIO : this.height;
    const yOff = this.isDucking ? this.height - h : 0;
    const insetX = Math.max(7, Math.floor(this.width * 0.2));
    const insetTop = this.isDucking ? 2 : 5;
    const insetBottom = this.isDucking ? 2 : 9;
    return {
      x: this.x + insetX,
      y: this.y + yOff + insetTop,
      w: this.width - insetX * 2,
      h: Math.max(8, h - insetTop - insetBottom)
    };
  }

  jump() {
    if (this.onGround && !this.dead) {
      this.vy = this.jumpForce;
      this.isJumping = true;
      this.onGround = false;
      this.isDucking = false;
      return true;
    }
    return false;
  }

  duck(active) {
    if (this.dead) return;
    this.isDucking = !!active;
  }

  activateAbility() {
    if (!this.abilityReady || !this.char.ability || this.dead) return false;
    this.abilityReady = false;
    this.abilityCharge = 0;
    this.abilityActive = true;
    this.abilityTimer = 120;
    return true;
  }

  update(dt, groundY) {
    if (this.dead) return;

    this.vy += this.gravity * dt;
    this.y += this.vy * dt;

    if (this.y >= groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
      this.isJumping = false;
    } else {
      this.onGround = false;
    }

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }
    if (this.magnetActive) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) this.magnetActive = false;
    }
    if (this.speedBoost) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) this.speedBoost = false;
    }
    if (this.hashrush) {
      this.hashrushTimer -= dt;
      if (this.hashrushTimer <= 0) {
        this.hashrush = false;
        this.invincible = false;
      }
    }
    if (this.abilityActive) {
      this.abilityTimer -= dt;
      if (this.abilityTimer <= 0) this.abilityActive = false;
    }

    if (this.char.ability && !this.abilityReady && !this.abilityActive) {
      this.abilityCharge = Math.min(100, this.abilityCharge + 0.08 * dt);
      if (this.abilityCharge >= 100) this.abilityReady = true;
    }

    this.animTimer += dt;
    if (this.animTimer > 5) {
      this.animTimer = 0;
      this.frame = (this.frame + 1) % 4;
    }

    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  takeHit() {
    if (this.invincible || this.hashrush || (this.abilityActive && this.char.ability === 'phase')) {
      return false;
    }
    if (this.hasShield) {
      this.hasShield = false;
      this.flashTimer = 15;
      return false;
    }
    this.dead = true;
    this.flashTimer = 30;
    return true;
  }

  /**
   * Draw proportional to this.width / this.height so legs never stretch on large screens.
   */
  draw(ctx) {
    const c = this.char;
    const x = this.x;
    const w = this.width;
    const fullH = this.height;
    const h = this.isDucking ? fullH * CONFIG.DUCK_HEIGHT_RATIO : fullH;
    const yDraw = this.isDucking ? this.y + (fullH - h) : this.y;
    const s = w / 36; // unit scale relative to design width

    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (this.hashrush) {
      ctx.save();
      ctx.shadowColor = c.accent;
      ctx.shadowBlur = 16 * s;
      ctx.fillStyle = c.accent + '44';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, yDraw + h / 2, w * 0.65, h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.hasShield) {
      ctx.strokeStyle = CONFIG.COLORS.cyan;
      ctx.lineWidth = 2 * s;
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
      ctx.strokeRect(x - 3 * s, yDraw - 3 * s, w + 6 * s, h + 6 * s);
      ctx.globalAlpha = 1;
    }

    const legH = Math.round(h * 0.28);
    const legW = Math.max(4, Math.round(w * 0.16));
    const torsoH = Math.round(this.isDucking ? h * 0.5 : h * 0.42);
    const torsoY = yDraw + (this.isDucking ? h * 0.12 : h * 0.22);
    const hoodH = Math.round(h * 0.22);
    const hoodY = yDraw + (this.isDucking ? 0 : h * 0.06);

    // Legs
    ctx.fillStyle = c.color;
    if (!this.isDucking) {
      const legOff = this.onGround ? Math.sin(this.frame * 1.5) * (3 * s) : 0;
      ctx.fillRect(x + w * 0.22, yDraw + h - legH, legW, legH + legOff);
      ctx.fillRect(x + w * 0.58, yDraw + h - legH, legW, legH - legOff);
    } else {
      ctx.fillRect(x + w * 0.15, yDraw + h - legH * 0.7, w * 0.7, legH * 0.7);
    }

    // Torso
    ctx.fillStyle = c.color;
    ctx.fillRect(x + w * 0.18, torsoY, w * 0.64, torsoH);

    // Hood
    ctx.fillStyle = c.accent;
    ctx.fillRect(x + w * 0.22, hoodY, w * 0.56, hoodH);

    // Face
    const faceY = hoodY + hoodH * 0.35;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + w * 0.34, faceY, w * 0.32, h * 0.1);
    ctx.fillStyle = CONFIG.COLORS.greenGlow;
    const eyeS = Math.max(2, 2 * s);
    ctx.fillRect(x + w * 0.38, faceY + h * 0.02, eyeS, eyeS);
    ctx.fillRect(x + w * 0.55, faceY + h * 0.02, eyeS, eyeS);

    // Pack
    ctx.fillStyle = CONFIG.COLORS.cyan;
    ctx.fillRect(x + w * 0.04, torsoY + torsoH * 0.15, w * 0.16, h * 0.2);
    ctx.fillStyle = CONFIG.COLORS.greenGlow;
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 150) * 0.3;
    ctx.fillRect(x + w * 0.07, torsoY + torsoH * 0.28, w * 0.1, h * 0.08);
    ctx.globalAlpha = 1;

    // Arms
    if (!this.isDucking) {
      const armSwing = Math.sin(this.frame * 1.5) * (4 * s);
      const armW = Math.max(3, Math.round(w * 0.12));
      const armH = Math.round(h * 0.28);
      ctx.fillStyle = c.color;
      ctx.fillRect(x + w * 0.02, torsoY + torsoH * 0.2, armW, armH + armSwing);
      ctx.fillRect(x + w * 0.86, torsoY + torsoH * 0.2, armW, armH - armSwing);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, this.y + fullH + 2 * s, w * 0.38, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
