'use strict';

window.DuckEntity = {
  draw: function (ctx, duck, time) {
    if (duck.carriedBy) {
      return;
    }
    Sprites.drawPedestal(ctx, duck.x, duck.y);
    Sprites.drawDuck(ctx, duck.x, duck.y, { time: time, scale: 1 });
  }
};
