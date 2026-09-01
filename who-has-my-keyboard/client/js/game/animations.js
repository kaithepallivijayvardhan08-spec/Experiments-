'use strict';

/** Every power attack is drawn on top of the arena so the chaos is visible. */
window.Animations = (function () {
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function speechBubble(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = '800 14px "Baloo 2", sans-serif';
    const width = ctx.measureText(text).width + 22;
    const height = 30;
    Sprites.roundRect(ctx, x - width / 2, y - height, width, height, 10);
    ctx.fillStyle = '#fdfdf6';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#20140c';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 2, y + 10);
    ctx.lineTo(x + 6, y);
    ctx.closePath();
    ctx.fillStyle = '#fdfdf6';
    ctx.fill();
    ctx.strokeStyle = '#20140c';
    ctx.stroke();
    ctx.fillStyle = color === '#fff' ? '#20140c' : color || '#20140c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - height / 2);
    ctx.restore();
  }

  function stealHand(ctx, from, to, progress) {
    const t = easeOut(progress);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t - 40;
    ctx.save();
    ctx.strokeStyle = 'rgba(180,85,255,0.75)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y - 30);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(to.y - from.y, to.x - from.x));
    ctx.scale(2.1, 2.1);
    Sprites.drawPowerIcon(ctx, 0, 0, 26, 'hand', '#d79bff');
    ctx.restore();
    if (progress > 0.75) {
      floatingKey(ctx, x, y - 26, 'W', 1 - (progress - 0.75) / 0.25);
    }
  }

  function floatingKey(ctx, x, y, label, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    Sprites.drawKeyCap(ctx, x, y, 26, label, 'ok', true);
    ctx.restore();
  }

  function mindBeam(ctx, from, to, progress, time) {
    ctx.save();
    ctx.strokeStyle = '#b06bff';
    ctx.shadowColor = '#b06bff';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y - 26 + (to.y - 26 - (from.y - 26)) * t + Math.sin(t * 10 + time / 90) * 12;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(from.x + 18, from.y - 6);
    Sprites.roundRect(ctx, -14, -8, 28, 16, 5);
    Sprites.outlined(ctx, '#3c3c46', 2);
    ctx.fillStyle = '#ff5c5c';
    ctx.fillRect(-8, -4, 5, 5);
    ctx.fillStyle = '#6cc5ff';
    ctx.fillRect(3, -4, 5, 5);
    ctx.restore();
    speechBubble(ctx, to.x, to.y - 96, 'CONTROLLED!', '#7a3bd6');
  }

  function swapWire(ctx, a, b, progress, time) {
    ctx.save();
    ctx.strokeStyle = '#37b6ff';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -time / 20;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 30);
    ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 150, b.x, b.y - 30);
    ctx.stroke();
    ctx.restore();

    const t = easeOut(Math.min(progress * 1.4, 1));
    const ax = a.x + (b.x - a.x) * t;
    const ay = a.y - 110 + (b.y - a.y) * t;
    const bx = b.x + (a.x - b.x) * t;
    const by = b.y - 110 + (a.y - b.y) * t;
    miniKeyboard(ctx, ax, ay, '#37b6ff');
    miniKeyboard(ctx, bx, by, '#37b6ff');
  }

  function miniKeyboard(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(x / 40) * 0.3);
    Sprites.roundRect(ctx, -26, -14, 52, 28, 6);
    Sprites.outlined(ctx, '#e9e5da', 2.5);
    ctx.fillStyle = color;
    for (let r = 0; r < 2; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        ctx.fillRect(-22 + c * 11, -9 + r * 11, 8, 8);
      }
    }
    ctx.restore();
  }

  function lockDrop(ctx, target, progress) {
    const t = easeOut(Math.min(progress * 2, 1));
    const y = target.y - 220 + t * 130;
    ctx.save();
    ctx.translate(target.x, y);
    ctx.scale(1.6, 1.6);
    Sprites.drawLock(ctx, 0, 0, 44);
    ctx.restore();
    if (progress > 0.4) {
      speechBubble(ctx, target.x + 10, target.y - 108, 'W KEY LOCKED!', '#c9931a');
    }
  }

  function danceNotes(ctx, target, time) {
    ctx.save();
    ctx.fillStyle = '#ff4fd0';
    ctx.font = '800 22px "Baloo 2", sans-serif';
    for (let i = 0; i < 5; i += 1) {
      const a = time / 320 + (i * Math.PI * 2) / 5;
      const r = 48 + Math.sin(time / 220 + i) * 10;
      ctx.globalAlpha = 0.55 + Math.sin(time / 160 + i) * 0.35;
      ctx.fillText(i % 2 ? '\u266A' : '\u266B', target.x + Math.cos(a) * r, target.y - 30 + Math.sin(a) * r * 0.6);
    }
    ctx.restore();
    speechBubble(ctx, target.x, target.y - 100, 'DANCE CURSE!', '#ff4fd0');
  }

  function boostTrail(ctx, target, time) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#4aa8ff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const offset = ((time / 4 + i * 30) % 70);
      ctx.beginPath();
      ctx.moveTo(target.x - 40 - offset, target.y + i * 12 - 6);
      ctx.lineTo(target.x - 10 - offset, target.y + i * 12 - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function duckBurst(ctx, target, progress) {
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = '#ffe680';
    ctx.lineWidth = 5;
    for (let i = 0; i < 10; i += 1) {
      const a = (i * Math.PI * 2) / 10;
      const r1 = 20 + progress * 50;
      const r2 = r1 + 14;
      ctx.beginPath();
      ctx.moveTo(target.x + Math.cos(a) * r1, target.y + Math.sin(a) * r1);
      ctx.lineTo(target.x + Math.cos(a) * r2, target.y + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Renders one live effect entry from the state buffer. */
  function render(ctx, effect, positions, time) {
    const progress = Math.min((performance.now() - effect.localStart) / (effect.durationMs || 1200), 1);
    const from = positions[effect.fromId];
    const to = positions[effect.toId];

    switch (effect.type) {
      case 'STEAL_KEY':
        if (from && to) {
          stealHand(ctx, from, to, Math.min(progress * 2.2, 1));
        }
        break;
      case 'MIND_CONTROL':
        if (from && to) {
          mindBeam(ctx, from, to, progress, time);
        }
        break;
      case 'SWAP_KEYS':
        if (from && to) {
          swapWire(ctx, from, to, progress, time);
        }
        break;
      case 'LOCK_KEY':
        if (to) {
          lockDrop(ctx, to, progress);
        }
        break;
      case 'DANCE_CURSE':
        if (to) {
          danceNotes(ctx, to, time);
        }
        break;
      case 'SPEED_BOOST':
        if (from) {
          boostTrail(ctx, from, time);
        }
        break;
      case 'DUCK_TAKEN':
      case 'DUCK_DROPPED':
        if (from) {
          duckBurst(ctx, from, progress);
        }
        break;
      default:
        break;
    }
  }

  return {
    render: render,
    speechBubble: speechBubble,
    danceNotes: danceNotes,
    boostTrail: boostTrail,
    miniKeyboard: miniKeyboard
  };
})();
