'use strict';

/**
 * Every sprite is drawn procedurally so the game ships without asset files
 * while still matching the cartoon concept art: chunky outlines, saturated
 * colours and a top-down 3/4 view.
 */
window.Sprites = (function () {
  const PALETTE = {
    blue: { hair: '#2f6fd0', hairDark: '#1d4b95', shirt: '#2f7ad6', shirtDark: '#1d5199', ring: '#3d9dff' },
    red: { hair: '#d4462a', hairDark: '#9b2d18', shirt: '#c93a35', shirtDark: '#8d2320', ring: '#ff4f4f' },
    green: { hair: '#4fb53f', hairDark: '#33812a', shirt: '#4a9c3c', shirtDark: '#2f6b26', ring: '#57d94a' },
    yellow: { hair: '#f2c53d', hairDark: '#c99a1c', shirt: '#e0b62f', shirtDark: '#a8811a', ring: '#ffd23f' }
  };

  const SKIN = '#f3c69a';
  const OUTLINE = '#20140c';

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function outlined(ctx, fill, width) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = width || 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  /* -------------------------------------------------------------- */
  /* character                                                       */
  /* -------------------------------------------------------------- */

  function drawCharacter(ctx, x, y, options) {
    const opts = options || {};
    const palette = PALETTE[opts.color] || PALETTE.blue;
    const t = opts.time || 0;
    const bob = opts.moving || opts.runningInPlace ? Math.sin(t / 90) * 3 : Math.sin(t / 420) * 1.2;
    const danceTilt = opts.dancing ? Math.sin(t / 110) * 0.35 : 0;

    ctx.save();
    ctx.translate(x, y);

    // shadow + team ring
    ctx.save();
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 58, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 58, 30, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = palette.ring;
    ctx.stroke();
    ctx.restore();

    if (opts.boosted) {
      drawSpeedLines(ctx, palette.ring, t);
    }

    ctx.rotate(danceTilt);
    ctx.translate(0, bob);

    // legs
    const stride = opts.moving || opts.runningInPlace || opts.dancing ? Math.sin(t / 80) * 9 : 0;
    drawLimb(ctx, -10 + stride * 0.4, 26, 12, 26, '#2b2b33');
    drawLimb(ctx, 10 - stride * 0.4, 26, 12, 26, '#2b2b33');

    // shoes
    ctx.beginPath();
    roundRect(ctx, -18 + stride * 0.4, 48, 18, 10, 5);
    outlined(ctx, '#3a2417', 2.5);
    ctx.beginPath();
    roundRect(ctx, 2 - stride * 0.4, 48, 18, 10, 5);
    outlined(ctx, '#3a2417', 2.5);

    // body
    ctx.beginPath();
    roundRect(ctx, -19, -4, 38, 34, 12);
    outlined(ctx, palette.shirt, 3);
    ctx.beginPath();
    roundRect(ctx, -19, 18, 38, 12, 8);
    ctx.fillStyle = palette.shirtDark;
    ctx.fill();

    // arms
    const armSwing = opts.dancing ? Math.sin(t / 100) * 22 : stride * 0.8;
    drawArm(ctx, -22, 2, -14 - Math.abs(armSwing) * 0.2, 14 - armSwing, palette.shirt);
    drawArm(ctx, 22, 2, 14 + Math.abs(armSwing) * 0.2, 14 + armSwing, palette.shirt);

    // head
    ctx.beginPath();
    ctx.arc(0, -22, 20, 0, Math.PI * 2);
    outlined(ctx, SKIN, 3);

    // hair
    drawHair(ctx, palette, opts.color);

    // face
    drawFace(ctx, opts, t);

    ctx.restore();
  }

  function drawLimb(ctx, x, y, w, h, color) {
    ctx.beginPath();
    roundRect(ctx, x - w / 2, y, w, h, 6);
    outlined(ctx, color, 2.5);
  }

  function drawArm(ctx, sx, sy, ex, ey, color) {
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = OUTLINE;
    ctx.moveTo(sx * 0.6, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    outlined(ctx, SKIN, 2);
  }

  function drawHair(ctx, palette, colorId) {
    ctx.save();
    if (colorId === 'yellow') {
      // ponytail
      ctx.beginPath();
      ctx.ellipse(24, -20, 10, 18, -0.4, 0, Math.PI * 2);
      outlined(ctx, palette.hair, 2.5);
    }
    ctx.beginPath();
    ctx.moveTo(-20, -26);
    for (let i = 0; i < 5; i += 1) {
      const x = -20 + i * 10;
      ctx.lineTo(x + 4, -46 - (i % 2 === 0 ? 8 : 2));
      ctx.lineTo(x + 10, -30);
    }
    ctx.lineTo(20, -24);
    ctx.quadraticCurveTo(0, -48, -20, -26);
    ctx.closePath();
    outlined(ctx, palette.hair, 3);
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.quadraticCurveTo(-4, -42, 8, -32);
    ctx.strokeStyle = palette.hairDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawFace(ctx, opts, t) {
    const mood = opts.mood || 'normal';
    ctx.save();
    ctx.translate(0, -20);

    if (mood === 'mind') {
      // spinning spiral eyes
      [-7, 7].forEach(function (ex) {
        ctx.save();
        ctx.translate(ex, 0);
        ctx.rotate(t / 200);
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.2) {
          const r = a * 0.9;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.strokeStyle = '#7a3bd6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
    } else if (mood === 'panic') {
      [-7, 7].forEach(function (ex) {
        ctx.beginPath();
        ctx.arc(ex, 0, 5.5, 0, Math.PI * 2);
        outlined(ctx, '#fff', 1.5);
        ctx.beginPath();
        ctx.arc(ex, 1, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = OUTLINE;
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(0, 10, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#7a2b2b';
      ctx.fill();
    } else if (mood === 'dance') {
      [-7, 7].forEach(function (ex) {
        ctx.beginPath();
        ctx.moveTo(ex - 4, 1);
        ctx.quadraticCurveTo(ex, -5, ex + 4, 1);
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(0, 8, 5, 0, Math.PI);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      [-7, 7].forEach(function (ex) {
        ctx.beginPath();
        ctx.ellipse(ex, 0, 3, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = OUTLINE;
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(-5, 9);
      ctx.quadraticCurveTo(0, 13, 5, 9);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpeedLines(ctx, color, t) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 4; i += 1) {
      const offset = ((t / 6 + i * 24) % 90) - 45;
      ctx.beginPath();
      ctx.moveTo(-46 - offset * 0.4, 6 + i * 9);
      ctx.lineTo(-14 - offset * 0.4, 6 + i * 9);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------- */
  /* duck                                                            */
  /* -------------------------------------------------------------- */

  function drawDuck(ctx, x, y, options) {
    const opts = options || {};
    const t = opts.time || 0;
    const scale = opts.scale || 1;
    ctx.save();
    ctx.translate(x, y + (opts.carried ? 0 : Math.sin(t / 320) * 4));
    ctx.scale(scale, scale);

    if (!opts.carried) {
      // sparkle halo
      ctx.save();
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < 8; i += 1) {
        const a = (t / 700) + (i * Math.PI) / 4;
        const r = 34 + Math.sin(t / 200 + i) * 4;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.5 + 8, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe680';
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.ellipse(4, 6, 24, 18, 0, 0, Math.PI * 2);
    outlined(ctx, '#f4c724', 3);
    ctx.beginPath();
    ctx.ellipse(-4, -12, 15, 14, 0, 0, Math.PI * 2);
    outlined(ctx, '#ffd83d', 3);
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(-30, -7);
    ctx.lineTo(-16, -3);
    ctx.closePath();
    outlined(ctx, '#ff9d21', 2.5);
    ctx.beginPath();
    ctx.arc(-8, -15, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 6, 12, 9, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#e8b615';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPedestal(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y + 26);
    ctx.beginPath();
    ctx.ellipse(0, 8, 56, 22, 0, 0, Math.PI * 2);
    outlined(ctx, '#8b8b8b', 3);
    ctx.beginPath();
    ctx.ellipse(0, 2, 44, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a5a5a5';
    ctx.fill();
    ctx.restore();
  }

  /* -------------------------------------------------------------- */
  /* keycaps                                                         */
  /* -------------------------------------------------------------- */

  function drawKeyCap(ctx, x, y, size, label, state, glow) {
    ctx.save();
    ctx.translate(x, y);
    const stolen = state === 'stolen';
    const locked = state === 'locked';

    if (stolen) {
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size / 2 + 4, -size / 2 + 4);
      ctx.lineTo(size / 2 - 4, size / 2 - 4);
      ctx.moveTo(size / 2 - 4, -size / 2 + 4);
      ctx.lineTo(-size / 2 + 4, size / 2 - 4);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (glow) {
      ctx.shadowColor = '#fff59b';
      ctx.shadowBlur = 16;
    }
    ctx.beginPath();
    roundRect(ctx, -size / 2, -size / 2, size, size, size * 0.22);
    ctx.fillStyle = glow ? '#fff6c4' : '#f4f0e6';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2b2b2b';
    ctx.stroke();
    ctx.beginPath();
    roundRect(ctx, -size / 2 + 3, -size / 2 + 3, size - 6, size - 8, size * 0.16);
    ctx.fillStyle = glow ? '#fffbe2' : '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#1d1d1d';
    ctx.font = '700 ' + Math.round(size * 0.55) + 'px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);

    if (locked) {
      drawLock(ctx, 0, 0, size * 0.8);
    }
    ctx.restore();
  }

  function drawLock(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    const w = size * 0.72;
    const h = size * 0.58;
    ctx.beginPath();
    ctx.arc(0, -h * 0.45, w * 0.32, Math.PI, 0);
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = '#c9931a';
    ctx.stroke();
    ctx.beginPath();
    roundRect(ctx, -w / 2, -h * 0.3, w, h, 4);
    outlined(ctx, '#ffc21e', 2.5);
    ctx.beginPath();
    ctx.arc(0, h * 0.02, size * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = '#7a5709';
    ctx.fill();
    ctx.restore();
  }

  /** The floating WASD panel that follows a character in the arena. */
  function drawFloatingKeyboard(ctx, x, y, player) {
    const size = 22;
    const gap = 4;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    roundRect(ctx, -(size * 1.5 + gap * 1.5), -(size + gap) - 6, size * 3 + gap * 3, size * 2 + gap * 3, 8);
    ctx.fillStyle = 'rgba(12,16,22,0.55)';
    ctx.fill();
    ctx.strokeStyle = player.ring;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const rowY = -(size / 2 + gap / 2) - 4;
    drawKeyCap(ctx, 0, rowY, size, 'W', player.keyState.W.status, player.pressed && player.pressed.W);
    ['A', 'S', 'D'].forEach(function (key, i) {
      drawKeyCap(ctx, (i - 1) * (size + gap), rowY + size + gap, size, key, player.keyState[key].status, player.pressed && player.pressed[key]);
    });
    ctx.restore();
  }

  /* -------------------------------------------------------------- */
  /* power icons                                                     */
  /* -------------------------------------------------------------- */

  function drawPowerIcon(ctx, x, y, size, icon, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    const s = size / 2;
    switch (icon) {
      case 'hand':
        ctx.beginPath();
        roundRect(ctx, -s * 0.55, -s * 0.2, s * 1.1, s * 1.1, s * 0.3);
        ctx.fillStyle = color;
        ctx.fill();
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          roundRect(ctx, -s * 0.55 + i * (s * 0.3), -s * 0.9 + (i === 0 ? s * 0.15 : 0), s * 0.22, s * 0.8, s * 0.11);
          ctx.fillStyle = color;
          ctx.fill();
        }
        break;
      case 'swap':
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 0.14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.35);
        ctx.lineTo(s * 0.5, -s * 0.35);
        ctx.moveTo(s * 0.2, -s * 0.7);
        ctx.lineTo(s * 0.6, -s * 0.35);
        ctx.lineTo(s * 0.2, 0);
        ctx.moveTo(s * 0.7, s * 0.35);
        ctx.lineTo(-s * 0.5, s * 0.35);
        ctx.moveTo(-s * 0.2, 0);
        ctx.lineTo(-s * 0.6, s * 0.35);
        ctx.lineTo(-s * 0.2, s * 0.7);
        ctx.stroke();
        break;
      case 'brain':
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, 0, s * 0.55, s * 0.7, 0, 0, Math.PI * 2);
        ctx.ellipse(s * 0.3, 0, s * 0.55, s * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.6);
        ctx.lineTo(0, s * 0.6);
        ctx.stroke();
        break;
      case 'dance':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, -s * 0.55, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 0.13;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.3);
        ctx.lineTo(0, s * 0.2);
        ctx.moveTo(0, -s * 0.15);
        ctx.lineTo(-s * 0.6, -s * 0.45);
        ctx.moveTo(0, -s * 0.15);
        ctx.lineTo(s * 0.6, -s * 0.5);
        ctx.moveTo(0, s * 0.2);
        ctx.lineTo(-s * 0.45, s * 0.7);
        ctx.moveTo(0, s * 0.2);
        ctx.lineTo(s * 0.5, s * 0.6);
        ctx.stroke();
        break;
      case 'lock':
        drawLock(ctx, 0, 0, size * 1.1);
        break;
      case 'bolt':
        ctx.beginPath();
        ctx.moveTo(s * 0.25, -s * 0.85);
        ctx.lineTo(-s * 0.55, s * 0.12);
        ctx.lineTo(-s * 0.05, s * 0.12);
        ctx.lineTo(-s * 0.3, s * 0.85);
        ctx.lineTo(s * 0.6, -s * 0.15);
        ctx.lineTo(s * 0.05, -s * 0.15);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.stroke();
        break;
      default:
        break;
    }
    ctx.restore();
  }

  return {
    PALETTE: PALETTE,
    roundRect: roundRect,
    outlined: outlined,
    drawCharacter: drawCharacter,
    drawDuck: drawDuck,
    drawPedestal: drawPedestal,
    drawKeyCap: drawKeyCap,
    drawLock: drawLock,
    drawFloatingKeyboard: drawFloatingKeyboard,
    drawPowerIcon: drawPowerIcon
  };
})();
