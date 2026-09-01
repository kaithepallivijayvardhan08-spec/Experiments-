'use strict';

/**
 * The phone screen. It NEVER emits player:join - one socket, one role.
 */
angular.module('keyboardGame').controller('ControllerController', [
  '$scope',
  '$location',
  'socketService',
  'POWER_META',
  function ($scope, $location, socketService, POWER_META) {
    const search = $location.search();

    $scope.roomId = (search.room || '').toUpperCase();
    $scope.playerId = search.player || '';
    $scope.connected = false;
    $scope.error = null;
    $scope.player = null;
    $scope.inventory = [];
    $scope.keyState = { W: { status: 'ok' }, A: { status: 'ok' }, S: { status: 'ok' }, D: { status: 'ok' } };
    $scope.powerMeta = POWER_META;

    socketService.connect();

    $scope.join = function () {
      $scope.error = null;
      socketService.joinController($scope.roomId.toUpperCase(), $scope.playerId);
    };

    if ($scope.roomId && $scope.playerId) {
      $scope.join();
    }

    socketService.on('controller:joined', function (payload) {
      $scope.connected = true;
      $scope.player = payload;
    });

    socketService.on('controller:error', function (payload) {
      $scope.error = payload.message;
    });

    socketService.on('socket:connected', function () {
      if ($scope.connected) {
        $scope.join();
      }
    });

    socketService.onRaw('room:state', function (snapshot) {
      const me = snapshot.players.find(function (p) {
        return p.playerId === $scope.playerId;
      });
      if (!me) {
        return;
      }
      $scope.$applyAsync(function () {
        $scope.keyState = me.keyState;
        $scope.inventory = me.inventory;
        $scope.matchState = snapshot.state;
        $scope.hasDuck = me.hasDuck;
      });
    });

    $scope.press = function (key, pressed, event) {
      if (event) {
        event.preventDefault();
      }
      socketService.sendMovement(key, pressed);
      if (navigator.vibrate && pressed) {
        navigator.vibrate(12);
      }
    };

    $scope.usePower = function (index) {
      if (!$scope.inventory[index]) {
        return;
      }
      socketService.sendPower($scope.inventory[index], null);
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    $scope.$on('$destroy', function () {
      socketService.emit('controller:leave');
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('room:state');
        socket.off('controller:joined');
        socket.off('controller:error');
      }
    });
  }
]);
