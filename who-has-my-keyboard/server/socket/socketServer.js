'use strict';

const { Server } = require('socket.io');

const gameManager = require('../game/gameManager');
const { MATCH } = require('../config/constants');

const connectionHandler = require('./handlers/connectionHandler');
const roomHandler = require('./handlers/roomHandler');
const movementHandler = require('./handlers/movementHandler');
const powerHandler = require('./handlers/powerHandler');
const gameHandler = require('./handlers/gameHandler');
const controllerHandler = require('./handlers/controllerHandler');

function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  const ctx = {
    broadcastRoom(room) {
      if (room) {
        io.to(room.roomId).emit('room:state', room.serialize());
      }
    },
    detachController(socket) {
      const room = gameManager.getRoom(socket.roomId);
      if (!room) {
        return;
      }
      const player = room.players.get(socket.playerId);
      if (player && player.controllerSocketId === socket.id) {
        player.controllerSocketId = null;
        player.input = { W: false, A: false, S: false, D: false, SPACE: false };
        if (player.socketId) {
          io.to(player.socketId).emit('controller:detached', { playerId: player.playerId });
        }
      }
      socket.isController = false;
      ctx.broadcastRoom(room);
    }
  };

  io.on('connection', function (socket) {
    connectionHandler(io, socket, ctx);
    roomHandler(io, socket, ctx);
    movementHandler(io, socket, ctx);
    powerHandler(io, socket, ctx);
    gameHandler(io, socket, ctx);
    controllerHandler(io, socket, ctx);
  });

  // Single authoritative loop for every room.
  let lastBroadcast = 0;
  setInterval(function () {
    const now = Date.now();
    const shouldBroadcast = now - lastBroadcast >= MATCH.broadcastMs;
    gameManager.rooms.forEach(function (room) {
      const previousState = room.state;
      room.tick();
      if (room.state !== previousState) {
        if (room.state === 'playing') {
          io.to(room.roomId).emit('game:started', { roomId: room.roomId });
        } else if (room.state === 'finished') {
          io.to(room.roomId).emit('game:over', { winner: room.winner, players: room.serialize().players });
        }
        ctx.broadcastRoom(room);
      } else if (shouldBroadcast && (room.state === 'playing' || room.state === 'countdown')) {
        ctx.broadcastRoom(room);
      }
    });
    if (shouldBroadcast) {
      lastBroadcast = now;
    }
  }, MATCH.tickMs);

  setInterval(gameManager.pruneEmptyRooms, 30000);

  return io;
}

module.exports = { initializeSocketServer };
