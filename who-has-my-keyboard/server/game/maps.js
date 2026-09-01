'use strict';

const { ARENA } = require('../config/constants');

/**
 * Obstacle kinds are purely cosmetic on the client, but every obstacle blocks
 * movement with an axis aligned box.
 */
const ARENA_01 = {
  id: 'arena01',
  name: 'Backyard Brawl',
  ground: '#c19a5b',
  obstacles: [
    { kind: 'stone', x: 470, y: 210, w: 120, h: 92 },
    { kind: 'stone', x: 800, y: 235, w: 100, h: 78 },
    { kind: 'stone', x: 430, y: 470, w: 130, h: 96 },
    { kind: 'bush', x: 790, y: 500, w: 120, h: 100 },
    { kind: 'crate', x: 620, y: 620, w: 76, h: 66 },
    { kind: 'barrel', x: 150, y: 560, w: 66, h: 74 },
    { kind: 'cone', x: 1120, y: 585, w: 46, h: 56 },
    { kind: 'crate', x: 1130, y: 150, w: 72, h: 64 }
  ],
  spawns: [
    { x: 200, y: 200 },
    { x: ARENA.width - 220, y: 200 },
    { x: 200, y: ARENA.height - 200 },
    { x: ARENA.width - 220, y: ARENA.height - 200 }
  ],
  duck: { x: ARENA.width / 2, y: ARENA.height / 2 },
  powerSpots: [
    { x: 300, y: 380 },
    { x: 640, y: 180 },
    { x: 980, y: 400 },
    { x: 640, y: 540 },
    { x: 1060, y: 250 },
    { x: 250, y: 620 }
  ]
};

const ARENA_02 = {
  id: 'arena02',
  name: 'Keyboard Battlefield',
  ground: '#b98f57',
  obstacles: [
    { kind: 'giantkey', label: 'W', x: 640, y: 180, w: 96, h: 96 },
    { kind: 'giantkey', label: 'A', x: 380, y: 400, w: 96, h: 96 },
    { kind: 'giantkey', label: 'S', x: 640, y: 400, w: 96, h: 96 },
    { kind: 'giantkey', label: 'D', x: 900, y: 400, w: 96, h: 96 },
    { kind: 'crate', x: 250, y: 200, w: 76, h: 66 },
    { kind: 'crate', x: 1040, y: 200, w: 76, h: 66 },
    { kind: 'bush', x: 250, y: 600, w: 110, h: 92 },
    { kind: 'bush', x: 1040, y: 600, w: 110, h: 92 }
  ],
  spawns: ARENA_01.spawns,
  duck: { x: ARENA.width / 2, y: ARENA.height - 190 },
  powerSpots: ARENA_01.powerSpots
};

const MAPS = { arena01: ARENA_01, arena02: ARENA_02 };

function loadMap(id) {
  return MAPS[id] || ARENA_01;
}

module.exports = { MAPS, loadMap };
