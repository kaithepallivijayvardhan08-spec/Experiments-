'use strict';

const gameManager = require('../../game/gameManager');

/**
 * A phone acts as the physical keyboard of an already existing PC player.
 * Rule: ONE SOCKET -> ONE ROLE. A controller socket never emits player:join.
 */
module.exports = function controllerHandler(io, socket, ctx) {
  socket.on('controller:join', function (payload) {
    const data = payload || {};
    const room = gameManager.getRoom(data.roomId);
    if (!room) {
      socket.emit('controller:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
      return;
    }
    const player = room.players.get(data.playerId);
    if (!player) {
      socket.emit('controller:error', { code: 'PLAYER_NOT_FOUND', message: 'That player is not in the room.' });
      return;
    }

    socket.join(room.roomId);
    socket.roomId = room.roomId;
    socket.playerId = player.playerId;
    socket.isController = true;
    player.controllerSocketId = socket.id;

    socket.emit('controller:joined', {
      roomId: room.roomId,
      playerId: player.playerId,
      name: player.name,
      slot: player.slot,
      color: player.color,
      ring: player.ring
    });
    if (player.socketId) {
      io.to(player.socketId).emit('controller:attached', { playerId: player.playerId });
    }
    ctx.broadcastRoom(room);
  });

  socket.on('controller:leave', function () {
    ctx.detachController(socket);
  });
};
