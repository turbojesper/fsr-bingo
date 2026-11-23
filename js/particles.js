// Grober Pixel-Partikel-Effekt (Schnee) auf einem Canvas im Hintergrund.
// Art und Anzahl kommen aus dem Theme (particles.type, count, color).
export function startParticles(cfg) {
  if (!cfg || cfg.type !== 'snow') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'particles';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const PIXEL = 4; // Auflösung runter = Pixel-Look
  let w, h, flakes;

  function resize() {
    w = canvas.width = Math.ceil(innerWidth / PIXEL);
    h = canvas.height = Math.ceil(innerHeight / PIXEL);
    flakes = Array.from({ length: cfg.count || 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      v: 0.15 + Math.random() * 0.35,
      s: Math.random() < 0.25 ? 2 : 1,
      d: Math.random() * Math.PI * 2,
    }));
  }
  resize();
  addEventListener('resize', resize);

  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = cfg.color || '#fff';
    for (const f of flakes) {
      f.y += f.v;
      f.d += 0.02;
      f.x += Math.sin(f.d) * 0.15;
      if (f.y > h) { f.y = -2; f.x = Math.random() * w; }
      ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
    }
    requestAnimationFrame(tick);
  }
  tick();
}
