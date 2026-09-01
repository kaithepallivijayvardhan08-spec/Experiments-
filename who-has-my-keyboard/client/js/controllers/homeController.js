'use strict';

angular.module('keyboardGame').controller('HomeController', [
  '$scope',
  '$location',
  'gameService',
  'authService',
  function ($scope, $location, gameService, authService) {
    $scope.playerName = gameService.playerName;
    $scope.user = authService.user;
    $scope.showHowTo = false;

    $scope.play = function () {
      gameService.playerName = ($scope.playerName || '').trim() || 'PLAYER';
      gameService.save();
      $location.path('/lobby');
    };

    $scope.goto = function (path) {
      $location.path(path);
    };
  }
]);
