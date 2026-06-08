// src/utils/confetti.js
// Shared canvas-confetti function used by BadgeToast and ExplanationCard.

const DEFAULT_COLORS = ['#FF3B30','#34C759','#0A84FF','#FF9500','#5856D6','#FFD60A','#FF2D55','#30D158'];

export function runConfetti(canvas, opts = {}) {
  const {
    colors = DEFAULT_COLORS,
    pieceCount = 200,
    xRange = null,        // [min, max] fraction of width, null = full width
    speedVx = 5,          // max horizontal speed
    speedVy = [2.5, 6],   // [min, max] initial vertical speed
    gravity = 0.14,
    drag = 0.994,
    rotVel = 5.5,         // max rotation velocity
    yStart = null,        // [min, max] starting y offset, null = [-20, -200]
    pieceW = [8, 12],     // [min, max] width
    pieceH = [4, 7],      // [min, max] height
  } = opts;

  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const cryptoRand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF;
  const rand = (min, max) => cryptoRand() * (max - min) + min;

  const [yMin, yMax] = yStart || [-20, -200];
  const [wMin, wMax] = pieceW;
  const [hMin, hMax] = pieceH;
  const [vyMin, vyMax] = speedVy;

  const pieces = Array.from({ length: pieceCount }, () => ({
    x: xRange ? rand(W * xRange[0], W * xRange[1]) : cryptoRand() * W,
    y: rand(yMin, yMax),
    vx: (cryptoRand() - 0.5) * speedVx * 2,
    vy: rand(vyMin, vyMax),
    color: colors[Math.floor(cryptoRand() * colors.length)],
    w: rand(wMin, wMax),
    h: rand(hMin, hMax),
    rotation: cryptoRand() * 360,
    rotVel: (cryptoRand() - 0.5) * rotVel * 2,
  }));

  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.vx *= drag;
      p.rotation += p.rotVel;
      if (p.y < H + 50) alive = true;
      const alpha = Math.max(0, Math.min(1, 1 - p.y / (H * 1.2)));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive) raf = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(raf);
}
