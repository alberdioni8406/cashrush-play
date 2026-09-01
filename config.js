/**
 * CASHRUSH — Global configuration
 * All tunable gameplay values live here for easy balancing.
 */

export const CONFIG = {
  // Canvas & rendering
  TARGET_FPS: 60,
  PIXEL_SCALE: 2,           // internal resolution multiplier for crisp pixels
  GROUND_Y_RATIO: 0.78,     // ground line as fraction of canvas height

  // Player physics
  GRAVITY: 0.55,
  JUMP_FORCE: -11.5,
  DUCK_HEIGHT_RATIO: 0.55,
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 48,
  PLAYER_X_RATIO: 0.18,     // fixed X position as fraction of width

  // Speed & difficulty
  BASE_SPEED: 5.5,
  MAX_SPEED: 16,
  SPEED_ACCEL: 0.00035,     // per frame
  SPEED_ACCEL_LATE: 0.00018,

  // Obstacles
  OBSTACLE_SPAWN_BASE: 95,  // frames between spawns (decreases)
  OBSTACLE_SPAWN_MIN: 38,
  OBSTACLE_TYPES: ['feeWall', 'mempoolMonster', 'centralizer', 'brokenBlock', 'redTape'],

  // Collectibles
  SAT_VALUE: 10,
  CASH_DROP_VALUE: 250,
  CASH_DROP_MULTIPLIER: 2.5,
  CASH_DROP_DURATION: 400,  // frames
  TOKEN_ORB_VALUES: { common: 50, uncommon: 150, rare: 400, legendary: 1200 },
  COLLECTIBLE_SPAWN_CHANCE: 0.55,

  // Power-ups
  MAGNET_DURATION: 300,
  SHIELD_DURATION: 1,       // hits
  SPEED_BOOST_DURATION: 200,
  SPEED_BOOST_MULT: 1.45,
  HASHRUSH_DURATION: 360,
  HASHRUSH_MULT: 3,
  POWERUP_SPAWN_CHANCE: 0.12,

  // Combo
  COMBO_WINDOW: 90,         // frames without collection before decay
  COMBO_MAX: 10,

  // Score
  DISTANCE_SCORE_RATE: 0.08,

  // Background parallax speeds (multipliers of game speed)
  PARALLAX: [0.15, 0.35, 0.55, 0.8],

  // Colors (Bitcoin Cash inspired palette)
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

  // Storage keys
  STORAGE_KEY: 'cashrush_v1'
};

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
  { id: 'survivor', name: 'Survivor', desc: 'Survive 3 minutes in a single run', icon: '🛡' }
];
