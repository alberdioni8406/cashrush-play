/**
 * CASHRUSH — The Daily Grid
 * Date-seeded challenges, events, streaks. Fully offline.
 * Never blocks normal play.
 */

import { Storage } from './storage.js';

/** Deterministic hash from YYYY-MM-DD */
function daySeed(dateStr) {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHALLENGES = [
  { id: 'sat_rush', title: 'SAT RUSH', desc: 'Collect {n} sats in a single run.', type: 'sats_run', values: [300, 500, 750, 1000, 1500] },
  { id: 'sector_push', title: 'SECTOR PUSH', desc: 'Reach Sector {n}.', type: 'sector', values: [2, 3, 4, 5] },
  { id: 'distance_run', title: 'LONG HAUL', desc: 'Survive {n} meters in one run.', type: 'distance', values: [800, 1200, 2000, 3500, 5000] },
  { id: 'combo_hold', title: 'COMBO FOCUS', desc: 'Reach a x{n} combo.', type: 'combo', values: [4, 5, 6, 8] },
  { id: 'score_target', title: 'SCORE RUN', desc: 'Score {n} points in one run.', type: 'score', values: [2000, 4000, 7000, 10000] },
  { id: 'orb_hunt', title: 'ORB HUNT', desc: 'Collect {n} Token Orbs in one run.', type: 'orbs', values: [2, 3, 5] },
  { id: 'fee_clear', title: 'FEE CLEAR', desc: 'Clear {n} Fee Walls in one run.', type: 'fee_walls', values: [10, 20, 30, 40] },
  { id: 'survive_time', title: 'HOLD THE LINE', desc: 'Survive {n} seconds in one run.', type: 'time', values: [60, 90, 120, 180] }
];

const EVENTS = [
  { id: 'none', name: null, blurb: null, mods: {} },
  { id: 'hashrush_day', name: 'HASHRUSH', blurb: 'The Grid is moving faster today.', mods: { speedMult: 1.12 } },
  { id: 'sat_storm', name: 'SAT STORM', blurb: 'More sats are appearing across the Grid.', mods: { collectibleChance: 0.85 } },
  { id: 'fee_wall_day', name: 'FEE PRESSURE', blurb: 'Obstacles appear a little more often.', mods: { spawnRate: 0.88 } },
  { id: 'power_surge', name: 'POWER SURGE', blurb: 'Power-ups are more common.', mods: { powerupChance: 0.22 } },
  { id: 'quiet_grid', name: 'QUIET GRID', blurb: 'A calmer challenge — focus on distance.', mods: { speedMult: 0.92, spawnRate: 1.12 } }
];

const DISCOVERIES = [
  { id: 'journey', title: 'THE JOURNEY MATTERS', body: "You've returned to The Grid. Showing up is part of the run." },
  { id: 'moves', title: 'MONEY THAT MOVES', body: 'Sending a message across the world takes seconds. Sending money has not always felt that simple. Electronic cash is an attempt to make value move more like information.' },
  { id: 'responsibility', title: 'YOUR MONEY, YOUR RESPONSIBILITY', body: 'Having more control over your money sounds great. It also means learning how to protect it. Freedom and responsibility usually arrive together.' },
  { id: 'small', title: 'SMALL PAYMENTS MATTER', body: 'Not every transaction needs to be huge. Sometimes the ability to send a tiny amount quickly and cheaply can matter just as much.' },
  { id: 'direct', title: 'DIRECT CONNECTION', body: 'Imagine handing value to someone without asking a middle company to pass it along. That simple idea sits behind peer-to-peer electronic cash.' },
  { id: 'welcome', title: 'WELCOME BACK', body: 'The Grid remembers your path. Another day. Another run.' }
];

const STREAK_LINES = [
  'The Grid remembers your journey.',
  'Another day. Another run.',
  'Welcome back.',
  'The Grid is moving again.',
  'Your journey continues.',
  'Four walls, one path — keep going.'
];

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

function ensureDailyState() {
  const data = Storage.data || Storage.load();
  if (!data.daily) {
    data.daily = {
      lastVisit: null,
      streak: 0,
      longestStreak: 0,
      completedDates: {},
      dailyRunsCompleted: 0,
      lastChallengeId: null
    };
    Storage.save();
  }
  // migrate partial
  data.daily.completedDates = data.daily.completedDates || {};
  data.daily.streak = data.daily.streak || 0;
  data.daily.longestStreak = data.daily.longestStreak || 0;
  data.daily.dailyRunsCompleted = data.daily.dailyRunsCompleted || 0;
  return data.daily;
}

export const DailyGrid = {
  todayKey,

  /** Call on menu open — updates streak gently */
  recordVisit() {
    const daily = ensureDailyState();
    const today = todayKey();
    if (daily.lastVisit === today) {
      return this.getStatus();
    }
    const yest = yesterdayKey();
    if (daily.lastVisit === yest) {
      daily.streak = (daily.streak || 0) + 1;
    } else if (!daily.lastVisit) {
      daily.streak = 1;
    } else {
      // Missed day(s) — reset streak softly, keep longest
      daily.streak = 1;
    }
    daily.longestStreak = Math.max(daily.longestStreak || 0, daily.streak);
    daily.lastVisit = today;
    Storage.save();
    return this.getStatus();
  },

  getChallenge(dateStr = todayKey()) {
    const rng = mulberry32(daySeed(dateStr + ':ch'));
    const base = CHALLENGES[Math.floor(rng() * CHALLENGES.length)];
    const n = base.values[Math.floor(rng() * base.values.length)];
    return {
      id: base.id,
      title: base.title,
      type: base.type,
      target: n,
      desc: base.desc.replace('{n}', String(n)),
      date: dateStr
    };
  },

  getEvent(dateStr = todayKey()) {
    const rng = mulberry32(daySeed(dateStr + ':ev'));
    // ~60% chance of a real event
    if (rng() < 0.35) return EVENTS[0];
    const list = EVENTS.slice(1);
    return list[Math.floor(rng() * list.length)];
  },

  getDiscovery(dateStr = todayKey()) {
    const rng = mulberry32(daySeed(dateStr + ':disc'));
    return DISCOVERIES[Math.floor(rng() * DISCOVERIES.length)];
  },

  isCompleted(dateStr = todayKey()) {
    const daily = ensureDailyState();
    return !!daily.completedDates[dateStr];
  },

  getStatus() {
    const daily = ensureDailyState();
    const today = todayKey();
    const challenge = this.getChallenge(today);
    const event = this.getEvent(today);
    const discovery = this.getDiscovery(today);
    const completed = !!daily.completedDates[today];
    const line = STREAK_LINES[(daily.streak || 0) % STREAK_LINES.length];
    return {
      date: today,
      challenge,
      event,
      discovery,
      completed,
      streak: daily.streak || 0,
      longestStreak: daily.longestStreak || 0,
      dailyRunsCompleted: daily.dailyRunsCompleted || 0,
      streakLine: line
    };
  },

  /**
   * Evaluate a finished run against today's challenge.
   * stats: { sats, distance, score, combo, sector, orbs, feeWalls, runTimeSec }
   */
  evaluateRun(stats, wasDailyRun) {
    const today = todayKey();
    const daily = ensureDailyState();
    if (daily.completedDates[today]) {
      return { alreadyDone: true, completed: true };
    }
    const ch = this.getChallenge(today);
    let ok = false;
    switch (ch.type) {
      case 'sats_run': ok = (stats.sats || 0) >= ch.target; break;
      case 'sector': ok = (stats.sector || 0) >= ch.target; break;
      case 'distance': ok = (stats.distance || 0) >= ch.target; break;
      case 'combo': ok = (stats.combo || 0) >= ch.target; break;
      case 'score': ok = (stats.score || 0) >= ch.target; break;
      case 'orbs': ok = (stats.orbs || 0) >= ch.target; break;
      case 'fee_walls': ok = (stats.feeWalls || 0) >= ch.target; break;
      case 'time': ok = (stats.runTimeSec || 0) >= ch.target; break;
      default: ok = false;
    }
    if (ok) {
      daily.completedDates[today] = {
        at: Date.now(),
        challengeId: ch.id,
        target: ch.target,
        dailyRun: !!wasDailyRun
      };
      daily.dailyRunsCompleted = (daily.dailyRunsCompleted || 0) + 1;
      Storage.save();
      return { completed: true, challenge: ch, firstTime: true };
    }
    return { completed: false, challenge: ch, progress: this.progressFromStats(ch, stats) };
  },

  progressFromStats(ch, stats) {
    const map = {
      sats_run: stats.sats || 0,
      sector: stats.sector || 0,
      distance: Math.floor(stats.distance || 0),
      combo: stats.combo || 0,
      score: Math.floor(stats.score || 0),
      orbs: stats.orbs || 0,
      fee_walls: stats.feeWalls || 0,
      time: Math.floor(stats.runTimeSec || 0)
    };
    return map[ch.type] || 0;
  },

  /** Best progress seen today (stored lightly) */
  updateBestProgress(stats) {
    const today = todayKey();
    const daily = ensureDailyState();
    if (daily.completedDates[today]) return;
    const ch = this.getChallenge(today);
    const p = this.progressFromStats(ch, stats);
    daily.bestProgress = daily.bestProgress || {};
    const prev = daily.bestProgress[today] || 0;
    if (p > prev) {
      daily.bestProgress[today] = p;
      Storage.save();
    }
    return Math.max(p, prev);
  },

  getBestProgress() {
    const daily = ensureDailyState();
    const today = todayKey();
    if (daily.completedDates[today]) {
      const ch = this.getChallenge(today);
      return ch.target;
    }
    return (daily.bestProgress && daily.bestProgress[today]) || 0;
  }
};
