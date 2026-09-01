'use strict';

/**
 * The whole HUD is drawn on the canvas so it always matches the arena scale:
 * four corner player panels with their live WASD keyboard, the objective
 * banner + timer on top, the power bar at the bottom, ping and scoreboard.
 */
window.HUD = (function () {
  const POWER_META = window.PowerUpEntity.META;
  const POWER_LABEL = {
    STEAL_KEY: 'STEAL KEY',
    SWAP_KEYS: 'SWAP KEYS',
    MIND_CONTROL: 'MIND CONTROL',
    DANCE_CURSE: 'DANCE CURSE',
    LOCK_KEY: 'LOCK KEY',
    SPEED_BOOST: 'SPEED BOOST'
  };

  const PANEL_BG = 'rgba(14,18,26,0.88)';

  function panelAnchor(index, arena) {
    const margin = 18;
    switch (index) {
      case 0:
        return { x: margin, y: margin, align: 'left' };
      case 1:
        return { x: arena.width - margin - 214, y: margin, align: 'right' };
      case 2:
        return { x: margin, y: arena.height * 0.6, align: 'left' };
      default:
        return { x: arena.width - margin - 214, y: arena.height * 0.6, align: 'right' };
    }
  }

  function drawPlayerPanel(ctx, player, index, arena, isLocal) {
    const anchor = panelAnchor(index, arena);
    const width = 214;
    const statusList = statusChips(player);
    const height = 96 + statusList.length * 30;

    ctx.save();
    ctx.translate(anchor.x, anchor.y);

    // name bar
    Sprites.roundRect(ctx, 0, 0, width, 32, 9);
    ctx.fillStyle = PANEL_BG;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = player.ring;
    ctx.stroke();

    // slot badge
    ctx.beginPath();
    ctx.arc(20, 16, 15, 0, Math.PI * 2);
    ctx.fillStyle = player.ring;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#10141c';
    ctx.stroke();
    ctx.fillStyle = '#101821';
    ctx.font = '800 16px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(player.slot), 20, 17);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px "Baloo 2", sans-serif';
    const label = player.name.toUpperCase() + (isLocal ? ' (YOU)' : '');
    ctx.fillText(label.slice(0, 16), 42, 17);
    if (player.hasDuck) {
      Sprites.drawDuck(ctx, width - 20, 16, { scale: 0.34, carried: true, time: 0 });
    }

    // keyboard box
    Sprites.roundRect(ctx, 0, 36, width, 78, 10);
    ctx.fillStyle = 'rgba(28,22,16,0.86)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = player.ring;
    ctx.stroke();

    const size = 30;
    const gap = 7;
    const centerX = width / 2;
    Sprites.drawKeyCap(ctx, centerX, 56, size, 'W', player.keyState.W.status, player.pressed && player.pressed.W);
    ['A', 'S', 'D'].forEach(function (key, i) {
      Sprites.drawKeyCap(ctx, centerX + (i - 1) * (size + gap), 56 + size + gap, size, key, player.keyState[key].status, player.pressed && player.pressed[key]);
    });

    // status chips
    let y = 120;
    statusList.forEach(function (chip) {
      Sprites.roundRect(ctx, 0, y, width, 26, 8);
      ctx.fillStyle = 'rgba(18,14,26,0.92)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = chip.color;
      ctx.stroke();
      Sprites.drawPowerIcon(ctx, 18, y + 13, 17, chip.icon, chip.color);
      ctx.fillStyle = '#fff';
      ctx.font = '800 12px "Baloo 2", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(chip.text, 34, y + 14);
      ctx.fillStyle = chip.color;
      ctx.textAlign = 'right';
      ctx.fillText(chip.timer, width - 12, y + 14);
      y += 30;
    });

    ctx.restore();
    return height;
  }

  function statusChips(player) {
    const chips = [];
    ['W', 'A', 'S', 'D'].forEach(function (key) {
      const state = player.keyState[key];
      if (state.status === 'locked') {
        chips.push({
          icon: 'lock',
          color: '#ffc21e',
          text: key + ' KEY LOCKED!',
          timer: Math.ceil(Math.max(0, state.untilTs - Date.now()) / 1000) + 's'
        });
      } else if (state.status === 'stolen') {
        chips.push({
          icon: 'hand',
          color: '#b455ff',
          text: key + ' KEY STOLEN!',
          timer: Math.ceil(Math.max(0, state.untilTs - Date.now()) / 1000) + 's'
        });
      }
    });
    if (player.effects.boostMsLeft > 0) {
      chips.push({ icon: 'bolt', color: '#4aa8ff', text: 'SPEED BOOST', timer: Math.ceil(player.effects.boostMsLeft / 1000) + 's' });
    }
    if (player.effects.mindControlledBy) {
      chips.push({ icon: 'brain', color: '#54e06a', text: 'MIND CONTROL', timer: Math.ceil(player.effects.mindControlMsLeft / 1000) + 's' });
    }
    if (player.effects.danceMsLeft > 0) {
      chips.push({ icon: 'dance', color: '#ff4fd0', text: 'DANCE CURSE', timer: Math.ceil(player.effects.danceMsLeft / 1000) + 's' });
    }
    if (player.effects.swapWith) {
      chips.push({ icon: 'swap', color: '#37b6ff', text: 'CONTROLS SWAPPED', timer: Math.ceil(player.effects.swapMsLeft / 1000) + 's' });
    }
    return chips.slice(0, 3);
  }

  function drawBanner(ctx, snapshot, arena) {
    const text = (snapshot.announcement && snapshot.announcement.text) || 'STEAL THE GOLDEN DUCK!';
    ctx.save();
    ctx.font = '800 26px "Luckiest Guy", "Baloo 2", sans-serif';
    const width = Math.max(ctx.measureText(text).width + 56, 380);
    const x = arena.width / 2 - width / 2;

    Sprites.roundRect(ctx, x, 8, width, 44, 14);
    ctx.fillStyle = 'rgba(10,12,18,0.92)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, arena.width / 2, 31);

    // timer pill
    const seconds = Math.max(0, Math.floor(snapshot.timeLeftMs / 1000));
    const clock = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    Sprites.roundRect(ctx, arena.width / 2 - 78, 52, 156, 38, 12);
    ctx.fillStyle = 'rgba(10,12,18,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
    drawClockIcon(ctx, arena.width / 2 - 44, 71);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Baloo 2", sans-serif';
    ctx.fillText(clock, arena.width / 2 + 14, 72);
    ctx.restore();
  }

  function drawClockIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -6);
    ctx.moveTo(0, 0);
    ctx.lineTo(5, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.lineTo(3, -12);
    ctx.stroke();
    ctx.restore();
  }

  function drawPowerBar(ctx, me, arena, order) {
    const slots = order;
    const slotWidth = 108;
    const barWidth = slots.length * slotWidth + 24;
    const x = arena.width / 2 - barWidth / 2;
    const y = arena.height - 96;

    ctx.save();
    Sprites.roundRect(ctx, x, y, barWidth, 82, 14);
    ctx.fillStyle = 'rgba(12,16,24,0.9)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();

    slots.forEach(function (powerId, i) {
      const meta = POWER_META[powerId];
      const count = me ? me.inventory.filter(function (p) { return p === powerId; }).length : 0;
      const cx = x + 12 + i * slotWidth + slotWidth / 2;
      const owned = count > 0;

      ctx.save();
      ctx.globalAlpha = owned ? 1 : 0.34;
      Sprites.roundRect(ctx, cx - 30, y + 8, 60, 44, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = meta.color;
      ctx.stroke();
      Sprites.drawPowerIcon(ctx, cx, y + 30, 28, meta.icon, meta.color);

      // hotkey / count badge
      Sprites.roundRect(ctx, cx + 14, y + 4, 20, 18, 5);
      ctx.fillStyle = '#10141c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '800 12px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(count), cx + 24, y + 14);

      ctx.fillStyle = owned ? '#ffffff' : 'rgba(255,255,255,0.7)';
      ctx.font = '800 11px "Baloo 2", sans-serif';
      ctx.fillText(POWER_LABEL[powerId], cx, y + 66);
      ctx.restore();
    });
    ctx.restore();
  }

  function drawPing(ctx, ping, arena) {
    ctx.save();
    ctx.translate(24, arena.height - 34);
    const color = ping < 80 ? '#4de07a' : ping < 160 ? '#ffc21e' : '#ff5c5c';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 6, 5 + i * 6, Math.PI * 1.25, Math.PI * 1.75);
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 6, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '800 16px "Baloo 2", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ping + 'ms', 26, 4);
    ctx.restore();
  }

  function drawScoreboardHint(ctx, arena) {
    ctx.save();
    const x = arena.width - 150;
    const y = arena.height - 68;
    Sprites.roundRect(ctx, x, y, 126, 52, 10);
    ctx.fillStyle = 'rgba(12,16,24,0.9)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '800 17px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAB', x + 63, y + 17);
    ctx.font = '800 13px "Baloo 2", sans-serif';
    ctx.fillText('SCOREBOARD', x + 63, y + 37);
    ctx.restore();
  }

  function drawScoreboard(ctx, snapshot, arena) {
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,12,0.72)';
    ctx.fillRect(0, 0, arena.width, arena.height);
    const width = 620;
    const height = 120 + snapshot.players.length * 54;
    const x = arena.width / 2 - width / 2;
    const y = arena.height / 2 - height / 2;
    Sprites.roundRect(ctx, x, y, width, height, 18);
    ctx.fillStyle = 'rgba(16,20,30,0.97)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffc21e';
    ctx.stroke();

    ctx.fillStyle = '#ffc21e';
    ctx.font = '800 30px "Luckiest Guy", "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCOREBOARD', arena.width / 2, y + 40);

    ctx.font = '700 14px "Baloo 2", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('PLAYER', x + 80, y + 78);
    ctx.fillText('DUCKS', x + 300, y + 78);
    ctx.fillText('KEYS STOLEN', x + 390, y + 78);
    ctx.fillText('DANCES', x + 520, y + 78);

    snapshot.players.forEach(function (player, i) {
      const rowY = y + 104 + i * 54;
      Sprites.roundRect(ctx, x + 24, rowY, width - 48, 44, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = player.ring;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + 52, rowY + 22, 14, 0, Math.PI * 2);
      ctx.fillStyle = player.ring;
      ctx.fill();
      ctx.fillStyle = '#10141c';
      ctx.font = '800 15px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(player.slot), x + 52, rowY + 23);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(player.name.toUpperCase(), x + 80, rowY + 23);
      ctx.fillText(String(player.stats.ducksCaptured), x + 312, rowY + 23);
      ctx.fillText(String(player.stats.keysStolen), x + 424, rowY + 23);
      ctx.fillText(String(player.stats.danceCursesUsed), x + 542, rowY + 23);
    });
    ctx.restore();
  }

  function drawCountdown(ctx, snapshot, arena) {
    const seconds = Math.ceil(snapshot.countdownMsLeft / 1000);
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,12,0.55)';
    ctx.fillRect(0, 0, arena.width, arena.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffc21e';
    ctx.font = '800 46px "Luckiest Guy", "Baloo 2", sans-serif';
    ctx.fillText('LET THE CHAOS BEGIN!', arena.width / 2, arena.height / 2 - 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 140px "Luckiest Guy", "Baloo 2", sans-serif';
    ctx.fillText(String(seconds), arena.width / 2, arena.height / 2 + 30);
    ctx.restore();
  }

  function drawWinner(ctx, snapshot, arena) {
    const winner = snapshot.winner;
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,12,0.78)';
    ctx.fillRect(0, 0, arena.width, arena.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffc21e';
    ctx.font = '800 56px "Luckiest Guy", "Baloo 2", sans-serif';
    ctx.fillText(winner ? 'WINNER' : "TIME'S UP!", arena.width / 2, arena.height / 2 - 120);
    if (winner) {
      Sprites.drawCharacter(ctx, arena.width / 2, arena.height / 2 - 10, { color: winner.color, time: performance.now() });
      Sprites.drawDuck(ctx, arena.width / 2, arena.height / 2 - 80, { scale: 0.9, carried: true, time: performance.now() });
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 34px "Baloo 2", sans-serif';
      ctx.fillText(winner.name.toUpperCase(), arena.width / 2, arena.height / 2 + 90);
      ctx.fillStyle = '#8de08a';
      ctx.font = '800 22px "Baloo 2", sans-serif';
      ctx.fillText('+100 XP   +1 WIN   +50 COINS', arena.width / 2, arena.height / 2 + 128);
    }
    ctx.restore();
  }

  function draw(ctx, snapshot, options) {
    const arena = snapshot.arena;
    const opts = options || {};
    drawBanner(ctx, snapshot, arena);
    snapshot.players.forEach(function (player, i) {
      drawPlayerPanel(ctx, player, player.index !== undefined ? player.index : i, arena, player.playerId === opts.localPlayerId);
    });
    drawPowerBar(ctx, opts.me, arena, opts.powerOrder);
    drawPing(ctx, opts.ping || 0, arena);
    drawScoreboardHint(ctx, arena);
    if (opts.showScoreboard) {
      drawScoreboard(ctx, snapshot, arena);
    }
    if (snapshot.state === 'countdown') {
      drawCountdown(ctx, snapshot, arena);
    }
    if (snapshot.state === 'finished') {
      drawWinner(ctx, snapshot, arena);
    }
  }

  return { draw: draw };
})();
