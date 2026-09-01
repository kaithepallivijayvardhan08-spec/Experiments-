'use strict';

angular
  .module('keyboardGame', ['ngRoute'])
  .config([
    '$routeProvider',
    '$locationProvider',
    function ($routeProvider, $locationProvider) {
      $locationProvider.hashPrefix('');
      $routeProvider
        .when('/', { templateUrl: 'views/home.html', controller: 'HomeController' })
        .when('/login', { templateUrl: 'views/auth.html', controller: 'AuthController' })
        .when('/register', { templateUrl: 'views/auth.html', controller: 'AuthController' })
        .when('/lobby', { templateUrl: 'views/lobby.html', controller: 'LobbyController' })
        .when('/room/:roomId', { templateUrl: 'views/room.html', controller: 'RoomController' })
        .when('/game/:roomId', { templateUrl: 'views/game.html', controller: 'GameController' })
        .when('/controller', { templateUrl: 'views/controller.html', controller: 'ControllerController' })
        .when('/result', { templateUrl: 'views/result.html', controller: 'ResultController' })
        .when('/leaderboard', { templateUrl: 'views/leaderboard.html', controller: 'LeaderboardController' })
        .otherwise({ redirectTo: '/' });
    }
  ])
  .constant('POWER_META', {
    STEAL_KEY: { label: 'STEAL KEY', icon: 'hand', color: '#b455ff' },
    SWAP_KEYS: { label: 'SWAP KEYS', icon: 'swap', color: '#37b6ff' },
    MIND_CONTROL: { label: 'MIND CONTROL', icon: 'brain', color: '#54e06a' },
    DANCE_CURSE: { label: 'DANCE CURSE', icon: 'dance', color: '#ff4fd0' },
    LOCK_KEY: { label: 'LOCK KEY', icon: 'lock', color: '#ffc21e' },
    SPEED_BOOST: { label: 'SPEED BOOST', icon: 'bolt', color: '#4aa8ff' }
  })
  .constant('POWER_ORDER', ['STEAL_KEY', 'SWAP_KEYS', 'MIND_CONTROL', 'DANCE_CURSE', 'LOCK_KEY', 'SPEED_BOOST']);
