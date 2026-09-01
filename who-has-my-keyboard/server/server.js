'use strict';

const path = require('path');
const http = require('http');
const express = require('express');

const apiRoutes = require('./routes/apiRoutes');
const { initializeSocketServer } = require('./socket/socketServer');

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', 'client');

const app = express();
app.use(express.json());
app.use(express.static(CLIENT_DIR));
app.use('/vendor/angular', express.static(path.join(__dirname, '..', 'node_modules', 'angular')));
app.use('/vendor/angular-route', express.static(path.join(__dirname, '..', 'node_modules', 'angular-route')));
app.use('/api', apiRoutes);

app.get('/health', function (req, res) {
  res.json({ ok: true, uptime: process.uptime() });
});

// AngularJS uses hash based routing, so everything else falls back to the shell.
app.get('*', function (req, res) {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

const httpServer = http.createServer(app);
initializeSocketServer(httpServer);

httpServer.listen(PORT, '0.0.0.0', function () {
  // eslint-disable-next-line no-console
  console.log('WHO HAS MY KEYBOARD? listening on http://localhost:' + PORT);
});

module.exports = { app, httpServer };
