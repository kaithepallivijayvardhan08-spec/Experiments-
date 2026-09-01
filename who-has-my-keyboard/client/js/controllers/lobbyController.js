'use strict';

angular.module('keyboardGame').controller('LobbyController', [
  '$scope',
  '$location',
  'socketService',
  'gameService',
  'apiService',
  function ($scope, $location, socketService, gameService, apiService) {
    $scope.playerName = gameService.playerName || 'PLAYER';
    $scope.joinCode = '';
    $scope.error = null;
    $scope.rooms = [];

    socketService.connect();

    apiService.rooms().then(function (response) {
      $scope.rooms = response.data.rooms;
    });

    function join(mode, roomId) {
      gameService.playerName = ($scope.playerName || 'PLAYER').trim();
      gameService.save();
      socketService.joinRoom({
        mode: mode,
        roomId: roomId ? roomId.toUpperCase() : undefined,
        playerId: gameService.playerId,
        name: gameService.playerName
      });
    }

    $scope.quickMatch = function () {
      join('quick');
    };
    $scope.createRoom = function () {
      join('create');
    };
    $scope.joinRoom = function (roomId) {
      const code = roomId || $scope.joinCode;
      if (!code) {
        $scope.error = 'Enter a room code first.';
        return;
      }
      join('join', code);
    };

    socketService.on('player:joined', function (payload) {
      gameService.setRoom(payload.roomId);
      gameService.currentPlayer = payload.player;
      $location.path('/room/' + payload.roomId);
    });

    socketService.on('room:error', function (payload) {
      $scope.error = payload.message;
    });

    $scope.$on('$destroy', function () {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('player:joined');
        socket.off('room:error');
      }
    });
  }
]);
