/**
 * CASHRUSH — Global configuration
 * All tunable gameplay values live here for easy balancing.
 */

export const CONFIG = {
  // Canvas & rendering
  TARGET_FPS: 60,
  PIXEL_SCALE: 2,
  GROUND_Y_RATIO: 0.78,
  // Mild scale only — large screens stay readable without breaking jump physics
  DESIGN_HEIGHT: 700,
  SCALE_MIN: 0.95,
  SCALE_MAX: 1.35,

  // Player physics (base — jump scaled at runtime with worldScale)
  GRAVITY: 0.62,
  JUMP_FORCE: -13.2,
  DUCK_HEIGHT_RATIO: 0.52,
  PLAYER_WIDTH: 36,
  PLAYER_HEIGHT: 48,
  PLAYER_X_RATIO: 0.15,

  // Speed & difficulty
  BASE_SPEED: 6.2,
  MAX_SPEED: 15,
  SPEED_ACCEL: 0.00042,
  SPEED_ACCEL_LATE: 0.0002,

  // Obstacles — heights must stay jumpable relative to JUMP_FORCE arc
  OBSTACLE_SPAWN_BASE: 88,
  OBSTACLE_SPAWN_MIN: 42,
  OBSTACLE_TYPES: ['feeWall', 'mempoolMonster', 'centralizer', 'brokenBlock', 'redTape'],

  // Collectibles
  SAT_VALUE: 10,
  CASH_DROP_VALUE: 250,
  CASH_DROP_MULTIPLIER: 2.5,
  CASH_DROP_DURATION: 400,
  TOKEN_ORB_VALUES: { common: 50, uncommon: 150, rare: 400, legendary: 1200 },
  COLLECTIBLE_SPAWN_CHANCE: 0.55,

  // Power-ups
  MAGNET_DURATION: 300,
  SHIELD_DURATION: 1,
  SPEED_BOOST_DURATION: 200,
  SPEED_BOOST_MULT: 1.4,
  HASHRUSH_DURATION: 360,
  HASHRUSH_MULT: 3,
  POWERUP_SPAWN_CHANCE: 0.12,

  // Combo
  COMBO_WINDOW: 90,
  COMBO_MAX: 10,

  // Score
  DISTANCE_SCORE_RATE: 0.1,

  // Parallax
  PARALLAX: [0.15, 0.35, 0.55, 0.8],

  COLORS: {
    bg: '#050a05',
    ground: '#0a1a0a',
    green: '#00e676',
    greenDim: '#00a854',
    greenGlow: '#39ff14',
    white: '#f0fff0',
    danger: '#ff3366',
    warning: '#ffaa00',
    purple: '#b388ff',
    cyan: '#00e5ff',
    gold: '#ffd700',
    dark: '#001a00'
  },

  STORAGE_KEY: 'cashrush_v1'
};

/**
 * Sector / level progression — each sector is a goal to clear.
 * Clearing a sector awards bonus score and advances the run.
 */
export const SECTORS = [
  { id: 1, name: 'GRID ENTRY', goalDistance: 400, blurb: 'Learn the Grid. Jump the first Fee Walls.' },
  { id: 2, name: 'MEMPOOL LANE', goalDistance: 900, blurb: 'Traffic builds. Watch for Red Tape.' },
  { id: 3, name: 'NODE CLUSTER', goalDistance: 1600, blurb: 'Collect sats. Build your combo.' },
  { id: 4, name: 'HASH CORRIDOR', goalDistance: 2500, blurb: 'Power-ups appear more often.' },
  { id: 5, name: 'CENTRAL CORE', goalDistance: 3600, blurb: 'Centralizers online. Stay sharp.' },
  { id: 6, name: 'OPEN MARKET', goalDistance: 5000, blurb: 'Rare Cash Drops in the wild.' },
  { id: 7, name: 'DEEP PROTOCOL', goalDistance: 7000, blurb: 'Speed rising. One mistake ends it.' },
  { id: 8, name: 'GENESIS EDGE', goalDistance: 9500, blurb: 'Only skilled runners reach here.' },
  { id: 9, name: 'SAT STORM', goalDistance: 12500, blurb: 'Legendary orbs may appear.' },
  { id: 10, name: 'INFINITE GRID', goalDistance: 999999, blurb: 'Endless sector. How far can you go?' }
];

export const CHARACTERS = {
  cash: {
    id: 'cash',
    name: 'CASH',
    description: 'Default balanced runner',
    ability: null,
    unlocked: true,
    color: '#00e676',
    accent: '#39ff14'
  },
  ghost: {
    id: 'ghost',
    name: 'GHOST',
    description: 'Phase through obstacles',
    ability: 'phase',
    abilityDesc: 'Phase through 1 obstacle after charging',
    unlocked: false,
    unlockScore: 5000,
    color: '#b388ff',
    accent: '#e040fb'
  },
  miner: {
    id: 'miner',
    name: 'MINER',
    description: 'Destroy selected obstacles',
    ability: 'destroy',
    abilityDesc: 'Destroy nearest obstacle when charged',
    unlocked: false,
    unlockScore: 12000,
    color: '#ffaa00',
    accent: '#ffd54f'
  },
  normie: {
    id: 'normie',
    name: 'NORMIE',
    description: 'Community attractor',
    ability: 'attract',
    abilityDesc: 'Temporarily attract nearby collectibles',
    unlocked: false,
    unlockScore: 25000,
    color: '#00e5ff',
    accent: '#18ffff'
  }
};

export const ACHIEVEMENTS = [
  { id: 'first_block', name: 'First Block', desc: 'Play your first game', icon: '▶' },
  { id: 'sat_stacker', name: 'Sat Stacker', desc: 'Collect 1,000 virtual sats', icon: '₿', target: 1000 },
  { id: 'still_running', name: 'Still Running', desc: 'Survive for 10 minutes total', icon: '⏱', target: 600 },
  { id: 'fee_escape', name: 'Fee Escape', desc: 'Jump over 100 Fee Walls', icon: '⬆', target: 100 },
  { id: 'ghost_mode', name: 'Ghost Mode', desc: 'Complete a run without collecting anything', icon: '👻' },
  { id: 'hashrush_master', name: 'HashRush', desc: 'Activate HashRush 10 times', icon: '⚡', target: 10 },
  { id: 'early_runner', name: 'Early Runner', desc: 'One of the first to enter The Grid', icon: '★' },
  { id: 'combo_king', name: 'Combo King', desc: 'Reach x8 combo multiplier', icon: '🔥' },
  { id: 'distance_10k', name: 'Grid Explorer', desc: 'Travel 10,000 meters total', icon: '→', target: 10000 },
  { id: 'survivor', name: 'Survivor', desc: 'Survive 3 minutes in a single run', icon: '🛡' },
  { id: 'sector_5', name: 'Core Runner', desc: 'Reach Sector 5 in a single run', icon: '⬡' },
  { id: 'sector_10', name: 'Grid Legend', desc: 'Reach the Infinite Grid', icon: '∞' }
];
