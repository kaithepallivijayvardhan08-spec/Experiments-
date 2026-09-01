'use strict';

angular.module('keyboardGame').factory('authService', [
  'apiService',
  'gameService',
  function (apiService, gameService) {
    const STORAGE_KEY = 'whmk.user';

    function readUser() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
      } catch (error) {
        return null;
      }
    }

    const service = {
      user: readUser(),
      isLoggedIn: function () {
        return Boolean(service.user);
      },
      setUser: function (user) {
        service.user = user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        gameService.playerName = user.username;
        gameService.save();
      },
      login: function (username, password) {
        return apiService.login(username, password).then(function (response) {
          service.setUser(response.data.user);
          return response.data.user;
        });
      },
      register: function (username, password) {
        return apiService.register(username, password).then(function (response) {
          service.setUser(response.data.user);
          return response.data.user;
        });
      },
      playAsGuest: function (name) {
        gameService.playerName = name;
        gameService.save();
      },
      logout: function () {
        service.user = null;
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    if (service.user) {
      gameService.playerName = service.user.username;
      gameService.save();
    }

    return service;
  }
]);
