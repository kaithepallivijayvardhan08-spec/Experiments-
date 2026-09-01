'use strict';

window.PlayerEntity = {
  draw: function (ctx, player, pos, time, isLocal) {
    let mood = 'normal';
    if (player.effects.mindControlledBy) {
      mood = 'mind';
    } else if (player.dancing) {
      mood = 'dance';
    } else if (player.runningInPlace) {
      mood = 'panic';
    }

    Sprites.drawCharacter(ctx, pos.x, pos.y, {
      color: player.color,
      time: time,
      moving: player.moving,
      runningInPlace: player.runningInPlace,
      dancing: player.dancing,
      boosted: player.effects.boostMsLeft > 0,
      mood: mood
    });

    if (player.hasDuck) {
      Sprites.drawDuck(ctx, pos.x, pos.y - 62, { time: time, scale: 0.72, carried: true });
    }

    Sprites.drawFloatingKeyboard(ctx, pos.x, pos.y - (player.hasDuck ? 128 : 92), player);

    // name tag
    ctx.save();
    ctx.font = '700 13px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    const label = player.name.toUpperCase() + (isLocal ? ' (YOU)' : '');
    const width = ctx.measureText(label).width + 16;
    Sprites.roundRect(ctx, pos.x - width / 2, pos.y + 62, width, 20, 8);
    ctx.fillStyle = 'rgba(10,14,20,0.72)';
    ctx.fill();
    ctx.strokeStyle = player.ring;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pos.x, pos.y + 73);
    ctx.restore();

    if (player.runningInPlace) {
      Animations.speechBubble(ctx, pos.x + 60, pos.y - 40, "I CAN'T MOVE!", '#fff');
    }
  }
};
