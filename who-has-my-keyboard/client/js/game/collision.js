'use strict';

/** Client-side helpers used for aiming and proximity hints only. */
window.Collision = {
  distance: function (a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  },
  nearestPlayer: function (from, players) {
    let best = null;
    let bestDistance = Infinity;
    players.forEach(function (player) {
      if (player.playerId === from.playerId) {
        return;
      }
      const d = Math.hypot(player.x - from.x, player.y - from.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = player;
      }
    });
    return best;
  },
  pointInRect: function (x, y, rect) {
    return (
      x > rect.x - rect.width / 2 &&
      x < rect.x + rect.width / 2 &&
      y > rect.y - rect.height / 2 &&
      y < rect.y + rect.height / 2
    );
  }
};
