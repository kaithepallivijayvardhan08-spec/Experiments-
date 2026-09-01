'use strict';

window.PowerUpEntity = {
  META: {
    STEAL_KEY: { icon: 'hand', color: '#b455ff' },
    SWAP_KEYS: { icon: 'swap', color: '#37b6ff' },
    MIND_CONTROL: { icon: 'brain', color: '#54e06a' },
    DANCE_CURSE: { icon: 'dance', color: '#ff4fd0' },
    LOCK_KEY: { icon: 'lock', color: '#ffc21e' },
    SPEED_BOOST: { icon: 'bolt', color: '#4aa8ff' }
  },

  draw: function (ctx, powerUp, time) {
    const meta = this.META[powerUp.type] || this.META.STEAL_KEY;
    const float = Math.sin(time / 300 + powerUp.x) * 5;
    ctx.save();
    ctx.translate(powerUp.x, powerUp.y + float);

    ctx.save();
    ctx.scale(1, 0.4);
    ctx.beginPath();
    ctx.arc(0, (28 - float) / 0.4, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fill();
    ctx.restore();

    ctx.shadowColor = meta.color;
    ctx.shadowBlur = 18;
    Sprites.roundRect(ctx, -20, -20, 40, 40, 11);
    ctx.fillStyle = 'rgba(16,20,28,0.92)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = meta.color;
    ctx.stroke();
    Sprites.drawPowerIcon(ctx, 0, 0, 24, meta.icon, meta.color);
    ctx.restore();
  }
};
