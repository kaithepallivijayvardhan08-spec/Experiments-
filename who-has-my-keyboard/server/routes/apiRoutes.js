'use strict';

const express = require('express');

const store = require('../store/memoryStore');
const gameManager = require('../game/gameManager');

const router = express.Router();

router.post('/auth/register', function (req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const user = store.createUser(String(username).trim(), String(password));
  if (!user) {
    return res.status(409).json({ error: 'That username is already taken' });
  }
  return res.status(201).json({ user: store.publicUser(user) });
});

router.post('/auth/login', function (req, res) {
  const { username, password } = req.body || {};
  const user = store.findUser(username);
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  return res.json({ user: store.publicUser(user) });
});

router.get('/users/:username', function (req, res) {
  const user = store.findUser(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user: store.publicUser(user) });
});

router.get('/leaderboard', function (req, res) {
  res.json({ leaderboard: store.leaderboard() });
});

router.get('/matches', function (req, res) {
  res.json({ matches: store.matches.slice(0, 20) });
});

router.post('/matches', function (req, res) {
  store.recordMatch(req.body || {});
  res.status(201).json({ ok: true });
});

router.get('/rooms', function (req, res) {
  res.json({ rooms: gameManager.listRooms() });
});

module.exports = router;
