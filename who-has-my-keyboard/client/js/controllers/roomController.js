'use strict';

angular.module('keyboardGame').controller('RoomController', [
  '$scope',
  '$location',
  '$routeParams',
  'socketService',
  'gameService',
  function ($scope, $location, $routeParams, socketService, gameService) {
    const roomId = $routeParams.roomId.toUpperCase();

    $scope.roomId = roomId;
    $scope.players = [];
    $scope.state = 'lobby';
    $scope.countdown = 0;
    $scope.isHost = false;
    $scope.error = null;
    $scope.me = null;

    socketService.connect();
    gameService.setRoom(roomId);

    // Re-join on refresh / deep link.
    socketService.joinRoom({
      mode: 'join',
      roomId: roomId,
      playerId: gameService.playerId,
      name: gameService.playerName || 'PLAYER'
    });

    $scope.controllerUrl =
      window.location.origin + '/#/controller?room=' + roomId + '&player=' + gameService.playerId;

    socketService.on('room:state', function (snapshot) {
      $scope.players = snapshot.players;
      $scope.emptySlots = new Array(Math.max(0, 4 - snapshot.players.length));
      $scope.state = snapshot.state;
      $scope.countdown = Math.ceil(snapshot.countdownMsLeft / 1000);
      $scope.isHost = snapshot.hostId === gameService.playerId;
      $scope.me = snapshot.players.find(function (p) {
        return p.playerId === gameService.playerId;
      });
      if (snapshot.state === 'playing' || snapshot.state === 'countdown') {
        $location.path('/game/' + roomId);
      }
    });

    socketService.on('room:error', function (payload) {
      $scope.error = payload.message;
    });

    $scope.toggleReady = function () {
      socketService.setReady(!($scope.me && $scope.me.ready));
    };

    $scope.startWithBots = function () {
      socketService.startGame(true);
    };

    $scope.start = function () {
      socketService.startGame(false);
    };

    $scope.leave = function () {
      socketService.emit('player:leave');
      gameService.reset();
      $location.path('/lobby');
    };

    $scope.copyControllerUrl = function () {
      navigator.clipboard.writeText($scope.controllerUrl);
      $scope.copied = true;
    };

    $scope.$on('$destroy', function () {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('room:state');
        socket.off('room:error');
      }
    });
  }
]);
