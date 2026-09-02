/**
 * CASHRUSH — Player entity & rendering
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
  }

  get hitbox() {
    // Tight core body hitbox — ignores feet edge and outer glow
    // so light grazes / landing near tops don't instantly kill
    const h = this.isDucking ? this.height * CONFIG.DUCK_HEIGHT_RATIO : this.height;
    const yOff = this.isDucking ? this.height - h : 0;
    const insetX = Math.max(8, Math.floor(this.width * 0.22));
    const insetTop = this.isDucking ? 2 : 6;
    const insetBottom = this.isDucking ? 2 : 10; // feet zone is forgiving
    return {
      x: this.x + insetX,
      y: this.y + yOff + insetTop,
      w: this.width - insetX * 2,
      h: Math.max(8, h - insetTop - insetBottom)
    };
  }

  jump() {
    if (this.onGround && !this.dead) {
      this.vy = CONFIG.JUMP_FORCE;
      this.isJumping = true;
      this.onGround = false;
      // Stay ducking flag false when jumping, but don't force stand mid-air issues
      this.isDucking = false;
      return true;
    }
    return false;
  }

  duck(active) {
    if (this.dead) return;
    // Allow duck while airborne slightly (helps red-tape timing) only if pressing
    if (active) {
      this.isDucking = true;
    } else {
      this.isDucking = false;
    }
  }

  activateAbility() {
    if (!this.abilityReady || !this.char.ability || this.dead) return false;
    this.abilityReady = false;
    this.abilityCharge = 0;
    this.abilityActive = true;
    this.abilityTimer = 120; // ~2s
    return true;
  }

  update(dt, groundY, gameSpeed) {
    if (this.dead) return;

    // Gravity
    this.vy += CONFIG.GRAVITY * dt;
    this.y += this.vy * dt;

    if (this.y >= groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
      this.isJumping = false;
    } else {
      this.onGround = false;
    }

    // Timers
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

    // Ability charge (while running)
    if (this.char.ability && !this.abilityReady && !this.abilityActive) {
      this.abilityCharge = Math.min(100, this.abilityCharge + 0.08 * dt);
      if (this.abilityCharge >= 100) this.abilityReady = true;
    }

    // Animation
    this.animTimer += dt;
    if (this.animTimer > 5) {
      this.animTimer = 0;
      this.frame = (this.frame + 1) % 4;
    }

    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  takeHit() {
    if (this.invincible || this.hashrush || (this.abilityActive && this.char.ability === 'phase')) {
      return false; // no damage
    }
    if (this.hasShield) {
      this.hasShield = false;
      this.flashTimer = 15;
      return false;
    }
    this.dead = true;
    this.flashTimer = 30;
    return true; // fatal
  }

  draw(ctx, scale = 1) {
    const c = this.char;
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.isDucking ? this.height * CONFIG.DUCK_HEIGHT_RATIO : this.height;
    const yDraw = this.isDucking ? this.y + (this.height - h) : this.y;

    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Glow aura when power-ups active
    if (this.hashrush) {
      ctx.save();
      ctx.shadowColor = c.accent;
      ctx.shadowBlur = 18;
      ctx.fillStyle = c.accent + '44';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, yDraw + h / 2, w * 0.7, h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.hasShield) {
      ctx.strokeStyle = CONFIG.COLORS.cyan;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
      ctx.strokeRect(x - 3, yDraw - 3, w + 6, h + 6);
      ctx.globalAlpha = 1;
    }

    // Body (hoodie runner)
    ctx.fillStyle = c.color;
    // Legs (running)
    const legOff = this.onGround && !this.isDucking ? Math.sin(this.frame * 1.5) * 4 : 0;
    if (!this.isDucking) {
      ctx.fillRect(x + 8, yDraw + h - 16, 6, 14 + legOff);
      ctx.fillRect(x + 18, yDraw + h - 16, 6, 14 - legOff);
    } else {
      ctx.fillRect(x + 6, yDraw + h - 10, 20, 10);
    }

    // Torso
    const torsoH = this.isDucking ? h * 0.55 : h * 0.45;
    ctx.fillStyle = c.color;
    ctx.fillRect(x + 6, yDraw + (this.isDucking ? 4 : 12), 20, torsoH);

    // Hoodie hood
    ctx.fillStyle = c.accent;
    ctx.fillRect(x + 8, yDraw + (this.isDucking ? 0 : 4), 16, 12);
    // Face
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 12, yDraw + (this.isDucking ? 4 : 8), 8, 6);
    // Eyes
    ctx.fillStyle = CONFIG.COLORS.greenGlow;
    ctx.fillRect(x + 13, yDraw + (this.isDucking ? 5 : 9), 2, 2);
    ctx.fillRect(x + 17, yDraw + (this.isDucking ? 5 : 9), 2, 2);

    // Backpack / energy source
    ctx.fillStyle = CONFIG.COLORS.cyan;
    ctx.fillRect(x + 2, yDraw + (this.isDucking ? 8 : 16), 6, 10);
    ctx.fillStyle = CONFIG.COLORS.greenGlow;
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 150) * 0.3;
    ctx.fillRect(x + 3, yDraw + (this.isDucking ? 10 : 18), 4, 4);
    ctx.globalAlpha = 1;

    // Arms
    if (!this.isDucking) {
      const armSwing = Math.sin(this.frame * 1.5) * 5;
      ctx.fillStyle = c.color;
      ctx.fillRect(x + 2, yDraw + 18, 5, 12 + armSwing);
      ctx.fillRect(x + 25, yDraw + 18, 5, 12 - armSwing);
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, this.y + this.height + 2, w * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
