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
  {
    id: 'first_rush',
    name: 'FIRST RUSH',
    icon: '▶',
    desc: 'Your first run is complete. Welcome to the Grid.',
    requirement: 'Complete the first game run',
    secret: false,
    type: 'runs',
    target: 1,
    discovery: {
      title: 'What is CASHRUSH?',
      body: 'CASHRUSH is a browser game inspired by Bitcoin Cash. You run, collect, survive and discover.\n\nIt is designed to be playable without a wallet, account, or any cryptocurrency knowledge. Just hit PLAY.'
    }
  },
  {
    id: 'sat_runner',
    name: 'SAT RUNNER',
    icon: '₿',
    desc: "You've collected 1,000 sats.",
    requirement: 'Collect 1,000 in-game sats (lifetime)',
    secret: false,
    type: 'sats',
    target: 1000,
    discovery: {
      title: 'What are sats?',
      body: 'A sat (satoshi) is a small unit of Bitcoin and Bitcoin Cash.\n\n1 BCH = 100,000,000 sats.\n\nSats let networks represent very small amounts of value.\n\nImportant: sats collected in CASHRUSH are gameplay points only. They have no monetary value and are not real BCH.'
    }
  },
  {
    id: 'stacking_up',
    name: 'STACKING UP',
    icon: '◆',
    desc: '10,000 sats collected.',
    requirement: 'Collect 10,000 in-game sats (lifetime)',
    secret: false,
    type: 'sats',
    target: 10000,
    discovery: {
      title: 'Why use small units?',
      body: 'Digital cash works better when you can send tiny amounts as easily as large ones.\n\nSmall units make micropayments practical — tips, content, or machine-to-machine value — without rounding everything to whole coins.'
    }
  },
  {
    id: 'block_builder',
    name: 'BLOCK BUILDER',
    icon: '▣',
    desc: "You've reached Sector 3.",
    requirement: 'Reach Sector 3 in a single run',
    secret: false,
    type: 'sector',
    target: 3,
    discovery: {
      title: 'What is a blockchain?',
      body: 'Transactions are grouped into blocks. Blocks are linked into a shared history that the network maintains together.\n\nThink of it as a public notebook where each page is sealed to the last — hard to rewrite, easy to verify.'
    }
  },
  {
    id: 'network_runner',
    name: 'NETWORK RUNNER',
    icon: '⬡',
    desc: "You've reached Sector 5.",
    requirement: 'Reach Sector 5 in a single run',
    secret: false,
    type: 'sector',
    target: 5,
    discovery: {
      title: 'How does a blockchain network work?',
      body: 'Many independent computers (nodes) help maintain and verify the network.\n\nThere is not simply one company or one server in charge. Agreement emerges from participants following shared rules.'
    }
  },
  {
    id: 'decentralized',
    name: 'DECENTRALIZED',
    icon: '◎',
    desc: '5,000 meters survived.',
    requirement: 'Survive 5,000 meters in a single run',
    secret: false,
    type: 'distance_run',
    target: 5000,
    discovery: {
      title: 'Why decentralization?',
      body: 'Decentralized networks avoid depending on a single authority or central point of control.\n\nIn CASHRUSH you already met the CENTRALIZER obstacle — a reminder of what concentrated control can feel like. Real networks aim to keep power spread out.'
    }
  },
  {
    id: 'cash_is_king',
    name: 'CASH IS KING',
    icon: '♛',
    desc: "You've stacked 25,000 sats.",
    requirement: 'Collect 25,000 in-game sats (lifetime)',
    secret: false,
    type: 'sats',
    target: 25000,
    discovery: {
      title: 'What is Bitcoin Cash?',
      body: 'Bitcoin Cash (BCH) is a decentralized peer-to-peer electronic cash network. People can send value directly to one another.\n\nBCH focuses on making digital payments practical, fast, and inexpensive.'
    }
  },
  {
    id: 'your_keys',
    name: 'YOUR KEYS',
    icon: '🔑',
    desc: "You've completed 10 runs.",
    requirement: 'Complete 10 game runs',
    secret: false,
    type: 'runs',
    target: 10,
    discovery: {
      title: 'What is self-custody?',
      body: 'Self-custody means you control your own cryptocurrency instead of relying entirely on a centralized service.\n\nThis is an educational concept only. CASHRUSH never asks you to create a wallet or move funds.'
    }
  },
  {
    id: 'cash_wallet',
    name: 'CASH WALLET',
    icon: '▣',
    desc: "You've reached Sector 7.",
    requirement: 'Reach Sector 7 in a single run',
    secret: false,
    type: 'sector',
    target: 7,
    discovery: {
      title: 'What is a BCH wallet?',
      body: 'A BCH wallet is software or hardware that lets people receive and send Bitcoin Cash.\n\nYou do not need a BCH wallet to play CASHRUSH. This is educational information only.',
      links: [
        { label: 'Learn more about BCH', url: 'https://bitcoincash.org' }
      ]
    }
  },
  {
    id: 'token_discovery',
    name: 'TOKEN DISCOVERY',
    icon: '✦',
    desc: "You've discovered something new in the Grid.",
    requirement: 'Collect a Legendary Token Orb',
    secret: false,
    type: 'legendary_orb',
    target: 1,
    discovery: {
      title: 'What are CashTokens?',
      body: 'CashTokens are token features built into the Bitcoin Cash ecosystem. They can represent digital assets, collectibles, and other tokenized uses.\n\nCASHRUSH in-game orbs are NOT CashTokens and are not on-chain assets. They are virtual collectibles only.'
    }
  },
  {
    id: 'grid_master',
    name: 'GRID MASTER',
    icon: '∞',
    desc: "You've reached the Infinite Grid.",
    requirement: 'Reach Sector 10 — Infinite Grid',
    secret: false,
    type: 'sector',
    target: 10,
    discovery: {
      title: 'What does peer-to-peer mean?',
      body: 'Peer-to-peer means people can interact or transact directly with each other without a central intermediary.\n\nThat idea sits at the heart of Bitcoin Cash: value moving from person to person across an open network.'
    }
  },
  {
    id: 'cashrush_legend',
    name: 'CASHRUSH LEGEND',
    icon: '★',
    desc: "You've explored the Grid.",
    requirement: 'Unlock at least 10 of the other main achievements',
    secret: false,
    type: 'legend',
    target: 10,
    discovery: {
      title: 'Explore the BCH ecosystem',
      body: 'CASHRUSH is one small project in a much larger Bitcoin Cash ecosystem.\n\nIf you want to look further, these are optional doorways — not requirements.',
      links: [
        { label: 'Bitcoin Cash', url: 'https://bitcoincash.org' },
        { label: 'CashTokens', url: 'https://cashtokens.org' },
        { label: 'BCH developer resources', url: 'https://documentation.cash' }
      ]
    }
  },
  // Secret achievements — conditions hidden until unlocked
  {
    id: 'fee_wall_survivor',
    name: 'FEE WALL SURVIVOR',
    icon: '🛡',
    desc: 'Cleared 50 Fee Walls in a single run.',
    requirement: 'SECRET',
    secret: true,
    type: 'fee_walls_run',
    target: 50
  },
  {
    id: 'perfect_run',
    name: 'PERFECT RUN',
    icon: '◇',
    desc: 'Finished a run of 800m+ without taking damage.',
    requirement: 'SECRET',
    secret: true,
    type: 'perfect_run',
    target: 800
  },
  {
    id: 'grid_hunter',
    name: 'GRID HUNTER',
    icon: '⚡',
    desc: 'Activated HashRush 3 times in one run.',
    requirement: 'SECRET',
    secret: true,
    type: 'hashrush_run',
    target: 3
  }
];
