'use strict';

/**
 * Holds the last authoritative snapshot plus the interpolation buffer used by
 * the renderer, so drawing never blocks on the network.
 */
window.GameState = (function () {
  function GameState() {
    this.snapshot = null;
    this.previous = null;
    this.receivedAt = 0;
    this.previousAt = 0;
    this.localPlayerId = null;
    this.floatingTexts = [];
    this.activeEffects = [];
    this.seenEffects = {};
  }

  GameState.prototype.apply = function (snapshot) {
    this.previous = this.snapshot;
    this.previousAt = this.receivedAt;
    this.snapshot = snapshot;
    this.receivedAt = performance.now();
    this.trackEffects(snapshot.effects || []);
  };

  GameState.prototype.trackEffects = function (effects) {
    const self = this;
    effects.forEach(function (effect) {
      const key = effect.type + ':' + effect.startedAt + ':' + (effect.fromId || '') + ':' + (effect.toId || '');
      if (self.seenEffects[key]) {
        return;
      }
      self.seenEffects[key] = true;
      self.activeEffects.push(Object.assign({ localStart: performance.now() }, effect));
    });
    const now = performance.now();
    this.activeEffects = this.activeEffects.filter(function (effect) {
      return now - effect.localStart < (effect.durationMs || 1200);
    });
  };

  GameState.prototype.players = function () {
    return (this.snapshot && this.snapshot.players) || [];
  };

  GameState.prototype.me = function () {
    const self = this;
    return this.players().find(function (player) {
      return player.playerId === self.localPlayerId;
    });
  };

  /** Position of a player interpolated between the two last snapshots. */
  GameState.prototype.lerpPlayer = function (player) {
    if (!this.previous) {
      return { x: player.x, y: player.y };
    }
    const previous = this.previous.players.find(function (p) {
      return p.playerId === player.playerId;
    });
    if (!previous) {
      return { x: player.x, y: player.y };
    }
    const span = Math.max(this.receivedAt - this.previousAt, 1);
    const t = Math.min((performance.now() - this.receivedAt) / span, 1.4);
    return {
      x: previous.x + (player.x - previous.x) * t,
      y: previous.y + (player.y - previous.y) * t
    };
  };

  GameState.prototype.addFloatingText = function (text, x, y, color) {
    this.floatingTexts.push({ text: text, x: x, y: y, color: color || '#fff', born: performance.now() });
  };

  return GameState;
})();
