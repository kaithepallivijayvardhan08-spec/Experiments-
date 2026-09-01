'use strict';

angular.module('keyboardGame').controller('GameController', [
  '$scope',
  '$location',
  '$routeParams',
  '$timeout',
  'socketService',
  'gameService',
  function ($scope, $location, $routeParams, $timeout, socketService, gameService) {
    const roomId = $routeParams.roomId.toUpperCase();
    let engine = null;
    let input = null;

    $scope.roomId = roomId;
    $scope.finished = false;
    $scope.inventory = [];

    socketService.connect();

    // The canvas only exists once ngView has linked the template.
    $timeout(function () {
      const canvas = document.getElementById('arena');
      if (!canvas) {
        return;
      }
      engine = new GameEngine(canvas);
      engine.setLocalPlayerId(gameService.playerId);
      engine.start();

      input = new InputManager({
        onChange: function (state) {
          socketService.sendInput(state);
          engine.setLocalInput(state);
        },
        onPower: function (slotIndex) {
          $scope.usePower(slotIndex);
        },
        onToggleScoreboard: function (visible) {
          engine.showScoreboard = visible;
        }
      });
      input.attach();

      socketService.onRaw('room:state', onSnapshot);
      socketService.emit('game:sync');
    });

    function onSnapshot(snapshot) {
      if (!engine) {
        return;
      }
      engine.setSnapshot(snapshot);
      engine.ping = socketService.getPing();
      if (snapshot.state === 'finished' && !$scope.finished) {
        $scope.finished = true;
        gameService.gameResult = { winner: snapshot.winner, players: snapshot.players, roomId: roomId };
        $timeout(function () {
          $location.path('/result');
        }, 4500);
      }
    }

    $scope.usePower = function (index) {
      if (!engine) {
        return;
      }
      const me = engine.state.me();
      if (!me || !me.inventory[index]) {
        return;
      }
      const target = engine.currentTarget();
      socketService.sendPower(me.inventory[index], target ? target.playerId : null);
    };

    $scope.leave = function () {
      socketService.emit('player:leave');
      $location.path('/lobby');
    };

    $scope.$on('$destroy', function () {
      if (input) {
        input.releaseAll();
        input.detach();
      }
      if (engine) {
        engine.stop();
      }
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('room:state', onSnapshot);
      }
    });
  }
]);
