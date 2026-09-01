/**
 * CASHRUSH — Character system (modular)
 */

import { CHARACTERS } from './config.js';
import { Storage } from './storage.js';

export const Characters = {
  getAll() {
    return Object.values(CHARACTERS).map(c => ({
      ...c,
      unlocked: Storage.isUnlocked(c.id)
    }));
  },

  getSelected() {
    return Storage.get('selectedCharacter') || 'cash';
  },

  select(id) {
    if (Storage.isUnlocked(id)) {
      Storage.set('selectedCharacter', id);
      return true;
    }
    return false;
  },

  renderList(container, selectedId) {
    if (!container) return;
    const chars = this.getAll();
    container.innerHTML = chars.map(c => `
      <div class="char-card ${c.id === selectedId ? 'selected' : ''} ${c.unlocked ? '' : 'locked'}"
           data-id="${c.id}">
        <canvas class="char-preview" width="64" height="64" data-char="${c.id}"></canvas>
        <div class="char-name">${c.name}</div>
        <div class="char-desc">${c.description}</div>
        ${c.abilityDesc ? `<div class="char-ability">${c.abilityDesc}</div>` : ''}
        ${!c.unlocked && c.unlockScore ? `<div class="char-desc">Unlock at ${c.unlockScore.toLocaleString()} score</div>` : ''}
      </div>
    `).join('');

    // Draw previews
    container.querySelectorAll('canvas.char-preview').forEach(cv => {
      const id = cv.dataset.char;
      const char = CHARACTERS[id];
      if (!char) return;
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      this.drawPreview(ctx, char, 64);
    });
  },

  drawPreview(ctx, char, size) {
    ctx.clearRect(0, 0, size, size);
    const scale = size / 48;
    const x = 8 * scale;
    const y = 4 * scale;

    // Body
    ctx.fillStyle = char.color;
    ctx.fillRect(x + 6, y + 12, 20, 22);
    // Legs
    ctx.fillRect(x + 8, y + 34, 6, 12);
    ctx.fillRect(x + 18, y + 34, 6, 12);
    // Hood
    ctx.fillStyle = char.accent;
    ctx.fillRect(x + 8, y + 4, 16, 12);
    // Face
    ctx.fillStyle = '#111';
    ctx.fillRect(x + 12, y + 8, 8, 6);
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(x + 13, y + 9, 2, 2);
    ctx.fillRect(x + 17, y + 9, 2, 2);
    // Pack
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(x + 2, y + 16, 6, 10);
  }
};
