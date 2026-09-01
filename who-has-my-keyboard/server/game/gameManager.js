'use strict';

const GameRoom = require('./gameRoom');
const { MATCH } = require('../config/constants');

const rooms = new Map();

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomId() {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 5; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
  } while (rooms.has(code));
  return code;
}

function createRoom(options) {
  const roomId = (options && options.roomId) || generateRoomId();
  const room = new GameRoom(roomId, options);
  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  if (!roomId) {
    return null;
  }
  return rooms.get(String(roomId).toUpperCase()) || null;
}

function getOrCreateRoom(roomId, options) {
  return getRoom(roomId) || createRoom(Object.assign({}, options, { roomId: String(roomId).toUpperCase() }));
}

/** Finds a joinable public room, otherwise creates one. */
function quickMatch() {
  let found = null;
  rooms.forEach(function (room) {
    if (found) {
      return;
    }
    if (room.state === 'lobby' && room.humanPlayers().length < MATCH.maxPlayers) {
      found = room;
    }
  });
  return found || createRoom({});
}

function removeRoom(roomId) {
  rooms.delete(roomId);
}

function pruneEmptyRooms() {
  const now = Date.now();
  rooms.forEach(function (room, roomId) {
    if (room.humanPlayers().length === 0 && now - room.createdAt > 60000) {
      rooms.delete(roomId);
    }
  });
}

function listRooms() {
  const list = [];
  rooms.forEach(function (room) {
    list.push({
      roomId: room.roomId,
      state: room.state,
      players: room.humanPlayers().length,
      maxPlayers: MATCH.maxPlayers,
      map: room.map.name
    });
  });
  return list;
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  getOrCreateRoom,
  quickMatch,
  removeRoom,
  pruneEmptyRooms,
  listRooms,
  generateRoomId
};
