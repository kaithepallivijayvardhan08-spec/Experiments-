'use strict';

window.GameEngine = (function () {
  const POWER_ORDER = ['STEAL_KEY', 'SWAP_KEYS', 'MIND_CONTROL', 'DANCE_CURSE', 'LOCK_KEY', 'SPEED_BOOST'];

  function GameEngine(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = new GameState();
    this.running = false;
    this.ping = 0;
    this.showScoreboard = false;
    this.localInput = { W: false, A: false, S: false, D: false, SPACE: false };
    this.frame = null;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
  }

  GameEngine.prototype.start = function () {
    this.running = true;
    window.addEventListener('resize', this.resize);
    this.resize();
    this.frame = requestAnimationFrame(this.loop);
  };

  GameEngine.prototype.stop = function () {
    this.running = false;
    window.removeEventListener('resize', this.resize);
    if (this.frame) {
      cancelAnimationFrame(this.frame);
    }
  };

  GameEngine.prototype.resize = function () {
    const snapshot = this.state.snapshot;
    const arena = (snapshot && snapshot.arena) || { width: 1280, height: 720 };
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = arena.width * ratio;
    this.canvas.height = arena.height * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  GameEngine.prototype.setSnapshot = function (snapshot) {
    const first = !this.state.snapshot;
    this.state.apply(snapshot);
    if (first) {
      this.resize();
    }
  };

  GameEngine.prototype.setLocalPlayerId = function (playerId) {
    this.state.localPlayerId = playerId;
  };

  GameEngine.prototype.setLocalInput = function (input) {
    this.localInput = angular.extend({}, input);
  };

  GameEngine.prototype.currentTarget = function () {
    const me = this.state.me();
    if (!me) {
      return null;
    }
    const others = this.state.players().filter(function (p) {
      return p.playerId !== me.playerId;
    });
    const carrier = others.find(function (p) {
      return p.hasDuck;
    });
    return carrier || Collision.nearestPlayer(me, others);
  };

  GameEngine.prototype.loop = function () {
    if (!this.running) {
      return;
    }
    this.render();
    this.frame = requestAnimationFrame(this.loop);
  };

  GameEngine.prototype.render = function () {
    const ctx = this.ctx;
    const snapshot = this.state.snapshot;
    const time = performance.now();

    if (!snapshot) {
      ctx.fillStyle = '#12161f';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const arena = snapshot.arena;
    MapRenderer.drawGround(ctx, arena, snapshot.map);
    MapRenderer.drawExit(ctx, snapshot.exit, time);
    MapRenderer.drawObstacles(ctx, snapshot.map);

    snapshot.powerUps.forEach(function (powerUp) {
      PowerUpEntity.draw(ctx, powerUp, time);
    });

    DuckEntity.draw(ctx, snapshot.duck, time);

    const positions = {};
    const self = this;
    const ordered = snapshot.players.slice().sort(function (a, b) {
      return a.y - b.y;
    });

    ordered.forEach(function (player) {
      const pos = self.state.lerpPlayer(player);
      positions[player.playerId] = pos;
      if (player.playerId === self.state.localPlayerId) {
        player.pressed = self.localInput;
      }
      PlayerEntity.draw(ctx, player, pos, time, player.playerId === self.state.localPlayerId);
    });

    // target reticle
    const target = this.currentTarget();
    if (target && snapshot.state === 'playing' && positions[target.playerId]) {
      const pos = positions[target.playerId];
      ctx.save();
      ctx.strokeStyle = 'rgba(255,90,90,0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y + 20, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.state.activeEffects.forEach(function (effect) {
      Animations.render(ctx, effect, positions, time);
    });

    HUD.draw(ctx, snapshot, {
      ping: this.ping,
      me: this.state.me(),
      localPlayerId: this.state.localPlayerId,
      showScoreboard: this.showScoreboard,
      powerOrder: POWER_ORDER
    });
  };

  GameEngine.POWER_ORDER = POWER_ORDER;
  return GameEngine;
})();
