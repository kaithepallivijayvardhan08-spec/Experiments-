'use strict';

angular.module('keyboardGame').factory('gameService', function () {
  const STORAGE_KEY = 'whmk.identity';

  function loadIdentity() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  const identity = loadIdentity();

  const service = {
    playerId: identity.playerId || 'p' + Math.random().toString(36).slice(2, 10),
    playerName: identity.playerName || '',
    currentRoom: null,
    currentPlayer: null,
    gameResult: null,
    save: function () {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ playerId: service.playerId, playerName: service.playerName })
      );
    },
    setRoom: function (roomId) {
      service.currentRoom = roomId;
    },
    reset: function () {
      service.currentRoom = null;
      service.currentPlayer = null;
      service.gameResult = null;
    }
  };

  service.save();
  return service;
});
