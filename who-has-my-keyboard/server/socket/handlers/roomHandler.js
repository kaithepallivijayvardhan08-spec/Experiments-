'use strict';

const gameManager = require('../../game/gameManager');
const { MATCH } = require('../../config/constants');

function randomPlayerId() {
  return 'p' + Math.random().toString(36).slice(2, 10);
}

module.exports = function roomHandler(io, socket, ctx) {
  socket.on('player:join', function (payload) {
    const data = payload || {};

    if (socket.isController) {
      socket.emit('room:error', { message: 'This socket is already a controller.' });
      return;
    }

    let room;
    if (data.mode === 'create') {
      room = gameManager.createRoom({ mapId: data.mapId });
    } else if (data.mode === 'quick') {
      room = gameManager.quickMatch();
    } else {
      room = gameManager.getRoom(data.roomId);
      if (!room) {
        socket.emit('room:error', { code: 'ROOM_NOT_FOUND', message: 'Room ' + (data.roomId || '') + ' was not found.' });
        return;
      }
    }

    const playerId = data.playerId || randomPlayerId();
    const existing = room.players.get(playerId);
    if (!existing && room.humanPlayers().length >= MATCH.maxPlayers) {
      socket.emit('room:error', { code: 'ROOM_FULL', message: 'That room is already full.' });
      return;
    }

    const player = room.addPlayer({
      playerId: playerId,
      name: (data.name || '').trim() || undefined,
      socketId: socket.id
    });
    if (!player) {
      socket.emit('room:error', { code: 'ROOM_FULL', message: 'That room is already full.' });
      return;
    }

    socket.join(room.roomId);
    socket.roomId = room.roomId;
    socket.playerId = playerId;
    socket.isController = false;

    socket.emit('player:joined', {
      roomId: room.roomId,
      playerId: playerId,
      player: {
        playerId: player.playerId,
        name: player.name,
        slot: player.slot,
        color: player.color,
        ring: player.ring
      }
    });
    ctx.broadcastRoom(room);
  });

  socket.on('player:ready', function (payload) {
    const room = gameManager.getRoom(socket.roomId);
    if (!room || socket.isController) {
      return;
    }
    const player = room.players.get(socket.playerId);
    if (!player) {
      return;
    }
    player.ready = payload && typeof payload.ready === 'boolean' ? payload.ready : !player.ready;
    if (room.state === 'lobby' && room.humanPlayers().length >= MATCH.minPlayers && room.everyoneReady()) {
      room.startCountdown();
    }
    ctx.broadcastRoom(room);
  });

  socket.on('player:leave', function () {
    const room = gameManager.getRoom(socket.roomId);
    if (!room) {
      return;
    }
    room.removePlayer(socket.playerId);
    socket.leave(room.roomId);
    socket.roomId = null;
    socket.playerId = null;
    ctx.broadcastRoom(room);
  });

  socket.on('room:list', function () {
    socket.emit('room:list', gameManager.listRooms());
  });
};
