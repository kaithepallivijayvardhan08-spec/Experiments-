'use strict';

angular.module('keyboardGame').factory('apiService', [
  '$http',
  function ($http) {
    return {
      register: function (username, password) {
        return $http.post('/api/auth/register', { username: username, password: password });
      },
      login: function (username, password) {
        return $http.post('/api/auth/login', { username: username, password: password });
      },
      leaderboard: function () {
        return $http.get('/api/leaderboard');
      },
      rooms: function () {
        return $http.get('/api/rooms');
      },
      saveMatch: function (match) {
        return $http.post('/api/matches', match);
      }
    };
  }
]);
