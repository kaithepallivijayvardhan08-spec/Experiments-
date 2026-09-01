'use strict';

angular.module('keyboardGame').controller('ResultController', [
  '$scope',
  '$location',
  'gameService',
  'socketService',
  'apiService',
  function ($scope, $location, gameService, socketService, apiService) {
    const result = gameService.gameResult;

    if (!result) {
      $location.path('/lobby');
      return;
    }

    $scope.winner = result.winner;
    $scope.players = result.players;
    $scope.roomId = result.roomId;

    apiService.saveMatch({
      matchId: result.roomId + '-' + Date.now(),
      winner: result.winner,
      players: result.players.map(function (player) {
        return { name: player.name, stats: player.stats, xp: player.playerId === (result.winner && result.winner.playerId) ? 100 : 25 };
      }),
      map: 'arena01'
    });

    $scope.playAgain = function () {
      socketService.restartGame();
      $location.path('/room/' + result.roomId);
    };

    $scope.toLobby = function () {
      gameService.reset();
      $location.path('/lobby');
    };
  }
]);
