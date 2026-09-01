'use strict';

window.MapRenderer = (function () {
  function drawGround(ctx, arena, map) {
    const gradient = ctx.createRadialGradient(
      arena.width / 2,
      arena.height / 2,
      80,
      arena.width / 2,
      arena.height / 2,
      arena.width * 0.75
    );
    gradient.addColorStop(0, '#cda56a');
    gradient.addColorStop(1, '#a67c46');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, arena.width, arena.height);

    // dirt speckles
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 220; i += 1) {
      const x = (i * 97) % arena.width;
      const y = (i * 173) % arena.height;
      ctx.fillStyle = i % 3 === 0 ? '#6f4f26' : '#e2c18b';
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawWalls(ctx, arena);
  }

  function drawWalls(ctx, arena) {
    const w = arena.wall;
    const blocks = [
      { x: 0, y: 0, width: arena.width, height: w },
      { x: 0, y: arena.height - w, width: arena.width, height: w },
      { x: 0, y: 0, width: w, height: arena.height },
      { x: arena.width - w, y: 0, width: w, height: arena.height }
    ];
    blocks.forEach(function (block) {
      ctx.fillStyle = '#5f5f5f';
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
    // stone bricks
    ctx.save();
    ctx.strokeStyle = 'rgba(20,20,20,0.55)';
    ctx.lineWidth = 2;
    for (let x = 0; x < arena.width; x += 46) {
      for (let y = 0; y < arena.height; y += 24) {
        const inWall = x < w || x > arena.width - w - 46 || y < w || y > arena.height - w - 24;
        if (!inWall) {
          continue;
        }
        const offset = (y / 24) % 2 === 0 ? 0 : 12;
        ctx.fillStyle = (x + y) % 3 === 0 ? '#6d6d6d' : '#585858';
        ctx.fillRect(x + offset, y, 44, 22);
        ctx.strokeRect(x + offset, y, 44, 22);
      }
    }
    ctx.restore();

    // green hedge lining the walls
    ctx.save();
    ctx.globalAlpha = 0.9;
    for (let x = 6; x < arena.width; x += 34) {
      leaf(ctx, x, 12);
      leaf(ctx, x, arena.height - 12);
    }
    for (let y = 6; y < arena.height; y += 34) {
      leaf(ctx, 12, y);
      leaf(ctx, arena.width - 12, y);
    }
    ctx.restore();
  }

  function leaf(ctx, x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y, 16, 11, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#3f7c33';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 4, y - 3, 9, 6, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#57a344';
    ctx.fill();
  }

  function drawObstacles(ctx, map) {
    map.obstacles.forEach(function (obstacle) {
      const x = obstacle.x;
      const y = obstacle.y;
      const w = obstacle.w;
      const h = obstacle.h;
      ctx.save();
      ctx.translate(x, y);

      ctx.save();
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, (h / 2 + 10) / 0.35, w * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
      ctx.restore();

      switch (obstacle.kind) {
        case 'crate':
          Sprites.roundRect(ctx, -w / 2, -h / 2, w, h, 6);
          Sprites.outlined(ctx, '#b9813f', 3);
          ctx.beginPath();
          ctx.moveTo(-w / 2, -h / 2);
          ctx.lineTo(w / 2, h / 2);
          ctx.moveTo(w / 2, -h / 2);
          ctx.lineTo(-w / 2, h / 2);
          ctx.strokeStyle = '#8a5c26';
          ctx.lineWidth = 5;
          ctx.stroke();
          break;
        case 'barrel':
          Sprites.roundRect(ctx, -w / 2, -h / 2, w, h, 12);
          Sprites.outlined(ctx, '#3f6ea8', 3);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(-w / 2 + 4, -h / 6, w - 8, 8);
          break;
        case 'cone':
          ctx.beginPath();
          ctx.moveTo(0, -h / 2);
          ctx.lineTo(w / 2, h / 2);
          ctx.lineTo(-w / 2, h / 2);
          ctx.closePath();
          Sprites.outlined(ctx, '#f06a26', 3);
          ctx.fillStyle = '#f5f0e8';
          ctx.fillRect(-w / 2.6, -2, w / 1.3, 8);
          break;
        case 'bush':
          [[-w * 0.22, 0, w * 0.36], [w * 0.22, 2, w * 0.34], [0, -h * 0.22, w * 0.38]].forEach(function (blob) {
            ctx.beginPath();
            ctx.arc(blob[0], blob[1], blob[2], 0, Math.PI * 2);
            Sprites.outlined(ctx, '#3f8b33', 3);
          });
          ctx.beginPath();
          ctx.arc(-w * 0.1, -h * 0.2, w * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = '#5cb84a';
          ctx.fill();
          break;
        case 'giantkey':
          Sprites.drawKeyCap(ctx, 0, 0, Math.min(w, h), obstacle.label, 'ok', false);
          break;
        case 'stone':
        default:
          Sprites.roundRect(ctx, -w / 2, -h / 2, w, h, 10);
          Sprites.outlined(ctx, '#9a9a9a', 3);
          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          ctx.lineTo(w / 2, 0);
          ctx.moveTo(0, -h / 2);
          ctx.lineTo(0, 0);
          ctx.strokeStyle = 'rgba(40,40,40,0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
          break;
      }
      ctx.restore();
    });
  }

  function drawExit(ctx, exit, time) {
    ctx.save();
    ctx.translate(exit.x, exit.y);

    const glow = 0.45 + Math.sin(time / 260) * 0.2;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#5cff8a';
    ctx.fillRect(-exit.width / 2 + 8, -exit.height / 2 + 6, exit.width - 16, exit.height - 6);
    ctx.restore();

    ctx.beginPath();
    Sprites.roundRect(ctx, -exit.width / 2, -exit.height / 2 - 34, exit.width, 30, 6);
    Sprites.outlined(ctx, '#2f7a3d', 3);
    ctx.fillStyle = '#eafbe9';
    ctx.font = '800 22px "Luckiest Guy", "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', 0, -exit.height / 2 - 18);

    ctx.strokeStyle = '#20140c';
    ctx.lineWidth = 4;
    ctx.strokeRect(-exit.width / 2, -exit.height / 2, exit.width, exit.height);
    ctx.restore();
  }

  return { drawGround: drawGround, drawObstacles: drawObstacles, drawExit: drawExit };
})();
