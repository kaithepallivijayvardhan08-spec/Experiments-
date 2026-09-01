'use strict';

angular.module('keyboardGame').factory('socketService', [
  '$rootScope',
  function ($rootScope) {
    let socket = null;
    let ping = 0;
    let pingTimer = null;

    function connect() {
      if (socket && socket.connected) {
        return socket;
      }
      if (!socket) {
        socket = io({ transports: ['websocket', 'polling'] });
        socket.on('connect', function () {
          $rootScope.$applyAsync(function () {
            $rootScope.$broadcast('socket:connected', { id: socket.id });
          });
          startPing();
        });
        socket.on('disconnect', function () {
          $rootScope.$applyAsync(function () {
            $rootScope.$broadcast('socket:disconnected');
          });
        });
      }
      return socket;
    }

    function startPing() {
      if (pingTimer) {
        clearInterval(pingTimer);
      }
      pingTimer = setInterval(function () {
        const sent = Date.now();
        socket.emit('ping:check', { t: sent }, function () {
          ping = Date.now() - sent;
        });
      }, 3000);
    }

    function on(event, handler) {
      connect().on(event, function (payload) {
        $rootScope.$applyAsync(function () {
          handler(payload);
        });
      });
    }

    /** Listener that must not trigger a digest (called at 20Hz). */
    function onRaw(event, handler) {
      connect().on(event, handler);
    }

    function off(event, handler) {
      if (socket) {
        socket.off(event, handler);
      }
    }

    function emit(event, payload) {
      connect().emit(event, payload);
    }

    return {
      connect: connect,
      getSocket: function () {
        return socket;
      },
      getPing: function () {
        return ping;
      },
      on: on,
      onRaw: onRaw,
      off: off,
      emit: emit,
      joinRoom: function (options) {
        emit('player:join', options);
      },
      joinController: function (roomId, playerId) {
        emit('controller:join', { roomId: roomId, playerId: playerId });
      },
      setReady: function (ready) {
        emit('player:ready', { ready: ready });
      },
      startGame: function (fillWithBots) {
        emit('game:start', { fillWithBots: Boolean(fillWithBots) });
      },
      restartGame: function () {
        emit('game:restart');
      },
      sendInput: function (input) {
        emit('player:input', input);
      },
      sendMovement: function (key, pressed) {
        emit('player:move', { key: key, pressed: pressed });
      },
      sendPower: function (powerId, targetId) {
        emit('player:power', { powerId: powerId, targetId: targetId || null });
      },
      disconnect: function () {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }
      }
    };
  }
]);
