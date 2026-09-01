'use strict';

angular.module('keyboardGame').controller('LeaderboardController', [
  '$scope',
  '$location',
  'apiService',
  function ($scope, $location, apiService) {
    $scope.rows = [];
    apiService.leaderboard().then(function (response) {
      $scope.rows = response.data.leaderboard;
    });
    $scope.back = function () {
      $location.path('/');
    };
  }
]);
