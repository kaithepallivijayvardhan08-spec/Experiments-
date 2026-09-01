'use strict';

const gameManager = require('../../game/gameManager');

module.exports = function powerHandler(io, socket, ctx) {
  socket.on('player:power', function (payload) {
    const data = payload || {};
    const room = gameManager.getRoom(socket.roomId);
    if (!room || room.state !== 'playing' || !socket.playerId) {
      return;
    }
    const player = room.players.get(socket.playerId);
    if (!player) {
      return;
    }
    const event = room.usePower(player, String(data.powerId || '').toUpperCase(), data.targetId || null);
    if (!event) {
      socket.emit('power:failed', { powerId: data.powerId });
      return;
    }
    io.to(room.roomId).emit('power:activated', event);
    ctx.broadcastRoom(room);
  });
};
