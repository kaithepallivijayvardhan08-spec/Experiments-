'use strict';

angular.module('keyboardGame').controller('AuthController', [
  '$scope',
  '$location',
  'authService',
  'gameService',
  function ($scope, $location, authService, gameService) {
    $scope.mode = $location.path() === '/register' ? 'register' : 'login';
    $scope.form = { username: gameService.playerName, password: '' };
    $scope.error = null;

    $scope.switchMode = function (mode) {
      $scope.mode = mode;
      $location.path('/' + mode);
    };

    $scope.submit = function () {
      $scope.error = null;
      const action = $scope.mode === 'register' ? authService.register : authService.login;
      action($scope.form.username, $scope.form.password)
        .then(function () {
          $location.path('/lobby');
        })
        .catch(function (response) {
          $scope.error = (response.data && response.data.error) || 'Something went wrong';
        });
    };

    $scope.continueAsGuest = function () {
      authService.playAsGuest(($scope.form.username || 'PLAYER').trim());
      $location.path('/lobby');
    };
  }
]);
