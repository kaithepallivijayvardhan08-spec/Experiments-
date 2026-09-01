'use strict';

const ARENA = {
  width: 1280,
  height: 720,
  wall: 48
};

const PLAYER = {
  radius: 22,
  speed: 210,
  boostMultiplier: 1.9
};

const DUCK = {
  radius: 20,
  pickupRange: 44
};

const EXIT = {
  x: ARENA.width - 190,
  y: ARENA.wall + 44,
  width: 132,
  height: 76
};

const MATCH = {
  durationMs: 5 * 60 * 1000,
  countdownMs: 5000,
  tickMs: 1000 / 30,
  broadcastMs: 1000 / 20,
  minPlayers: 2,
  maxPlayers: 4,
  powerSpawnMs: 7000,
  maxPowerUpsOnMap: 4
};

const POWERS = {
  STEAL_KEY: {
    id: 'STEAL_KEY',
    label: 'STEAL KEY',
    icon: 'hand',
    color: '#b455ff',
    durationMs: 10000,
    range: 520,
    needsTarget: true
  },
  SWAP_KEYS: {
    id: 'SWAP_KEYS',
    label: 'SWAP KEYS',
    icon: 'swap',
    color: '#37b6ff',
    durationMs: 10000,
    range: 620,
    needsTarget: true
  },
  MIND_CONTROL: {
    id: 'MIND_CONTROL',
    label: 'MIND CONTROL',
    icon: 'brain',
    color: '#54e06a',
    durationMs: 5000,
    range: 640,
    needsTarget: true
  },
  DANCE_CURSE: {
    id: 'DANCE_CURSE',
    label: 'DANCE CURSE',
    icon: 'dance',
    color: '#ff4fd0',
    durationMs: 4000,
    range: 560,
    needsTarget: true
  },
  LOCK_KEY: {
    id: 'LOCK_KEY',
    label: 'LOCK KEY',
    icon: 'lock',
    color: '#ffc21e',
    durationMs: 9000,
    range: 620,
    needsTarget: true
  },
  SPEED_BOOST: {
    id: 'SPEED_BOOST',
    label: 'SPEED BOOST',
    icon: 'bolt',
    color: '#4aa8ff',
    durationMs: 5000,
    range: 0,
    needsTarget: false
  }
};

const POWER_ORDER = [
  'STEAL_KEY',
  'SWAP_KEYS',
  'MIND_CONTROL',
  'DANCE_CURSE',
  'LOCK_KEY',
  'SPEED_BOOST'
];

const PLAYER_COLORS = [
  { id: 'blue', ring: '#3d9dff', panel: '#1b3d63', hair: '#2f6fd0' },
  { id: 'red', ring: '#ff4f4f', panel: '#5c1f1f', hair: '#c93a25' },
  { id: 'green', ring: '#57d94a', panel: '#1f4a1c', hair: '#4fb53f' },
  { id: 'yellow', ring: '#ffd23f', panel: '#5a4712', hair: '#f2c53d' }
];

module.exports = {
  ARENA,
  PLAYER,
  DUCK,
  EXIT,
  MATCH,
  POWERS,
  POWER_ORDER,
  PLAYER_COLORS
};
