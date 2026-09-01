'use strict';

const gameManager = require('../../game/gameManager');

module.exports = function connectionHandler(io, socket, ctx) {
  socket.emit('server:hello', { socketId: socket.id, serverTime: Date.now() });

  socket.on('ping:check', function (payload, ack) {
    if (typeof ack === 'function') {
      ack({ clientTime: payload && payload.t, serverTime: Date.now() });
    }
  });

  socket.on('disconnect', function () {
    const room = gameManager.getRoom(socket.roomId);
    if (!room) {
      return;
    }
    if (socket.isController) {
      ctx.detachController(socket);
      return;
    }
    const player = room.players.get(socket.playerId);
    if (player && player.socketId === socket.id) {
      player.connected = false;
      player.input = { W: false, A: false, S: false, D: false, SPACE: false };
      if (room.state === 'lobby') {
        room.removePlayer(socket.playerId);
      }
    }
    ctx.broadcastRoom(room);
  });
};
