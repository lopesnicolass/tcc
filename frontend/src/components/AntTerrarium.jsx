import { useEffect, useRef } from 'react';

// ============================================================
// CORES — tiradas direto da paleta do site (App.css :root)
// ============================================================
const COLORS = {
  glassTop: '#E3F2FD',
  glassBottom: '#BFE0FB',
  sandTop: '#E9D2A8',
  sandBottom: '#C79F6E',
  sandLine: '#D8B583',
  antBody: '#0D47A1',
  antBodyLight: '#2196F3',
  antLeg: '#0D47A1',
  hole: '#7A5230',
  holeRim: '#9C7248',
  food: '#FFC93C',
  foodRim: '#E0A800',
  popup: '#0D47A1',
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// ============================================================
// FORMIGA — pequena máquina de estados:
// wander (passeando) -> toFood (indo pra comida)
// -> carrying (voltando com comida) -> wander
// ============================================================
class Ant {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.x = rand(w * 0.15, w * 0.85);
    this.y = rand(h * 0.4, h * 0.85);
    this.angle = rand(0, Math.PI * 2);
    this.speed = rand(24, 40);
    this.state = 'wander';
    this.wanderTimer = rand(1, 3);
    this.walkPhase = rand(0, 10);
    this.scale = rand(0.85, 1.15);
    this.targetFood = null;
  }

  update(dt, foods, colony) {
    this.walkPhase += dt * this.speed * 0.15;

    if (this.state === 'wander') {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = rand(1, 3);
        this.angle += rand(-1.4, 1.4);

        // chance de notar uma comida livre
        const free = foods.filter((f) => !f.claimed);
        if (free.length > 0 && Math.random() < 0.5) {
          let closest = free[0];
          let bestDist = dist(this.x, this.y, closest.x, closest.y);
          for (const f of free) {
            const d = dist(this.x, this.y, f.x, f.y);
            if (d < bestDist) { bestDist = d; closest = f; }
          }
          closest.claimed = true;
          this.targetFood = closest;
          this.state = 'toFood';
        }
      }
      this.move(dt);
      this.bounce();
    }

    else if (this.state === 'toFood') {
      if (!this.targetFood || this.targetFood.eaten) {
        this.state = 'wander';
        this.targetFood = null;
        return;
      }
      this.steerTowards(this.targetFood.x, this.targetFood.y);
      this.move(dt);
      if (dist(this.x, this.y, this.targetFood.x, this.targetFood.y) < 10) {
        this.targetFood.eaten = true;
        this.hasFood = true;
        this.targetFood = null;
        this.state = 'carrying';
      }
    }

    else if (this.state === 'carrying') {
      this.steerTowards(colony.x, colony.y);
      this.move(dt);
      if (dist(this.x, this.y, colony.x, colony.y) < 16) {
        this.hasFood = false;
        this.state = 'wander';
        this.wanderTimer = rand(0.3, 1);
        this.angle = rand(0, Math.PI * 2);
        colony.onDeposit(this.x, this.y);
      }
    }
  }

  steerTowards(tx, ty) {
    const target = Math.atan2(ty - this.y, tx - this.x);
    let diff = target - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * 0.12;
  }

  move(dt) {
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
  }

  bounce() {
    const pad = 16;
    const topLimit = this.h * 0.32;
    if (this.x < pad) { this.x = pad; this.angle = 0; }
    if (this.x > this.w - pad) { this.x = this.w - pad; this.angle = Math.PI; }
    if (this.y < topLimit) { this.y = topLimit; this.angle = Math.PI / 2; }
    if (this.y > this.h - 12) { this.y = this.h - 12; this.angle = -Math.PI / 2; }
  }

  draw(ctx) {
    const wobble = Math.sin(this.walkPhase) * 2.2;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // sombra
    ctx.fillStyle = 'rgba(20,30,60,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 11, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // pernas (3 pares, com leve balanço de caminhada)
    ctx.strokeStyle = COLORS.antLeg;
    ctx.lineWidth = 1.3;
    const legs = [[-4, -3], [0, -3], [4, -3]];
    legs.forEach(([lx], i) => {
      const swing = Math.sin(this.walkPhase + i) * 3;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx - 2 + swing * 0.4, -6 + swing);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, 1.5);
      ctx.lineTo(lx - 2 - swing * 0.4, 6 - swing);
      ctx.stroke();
    });

    // antenas
    ctx.beginPath();
    ctx.moveTo(-8, -1.5);
    ctx.lineTo(-12, -6 + wobble * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 1.5);
    ctx.lineTo(-12, 5 - wobble * 0.3);
    ctx.stroke();

    // corpo: cabeça, tórax, abdômen
    ctx.fillStyle = COLORS.antBody;
    ctx.beginPath();
    ctx.ellipse(-7, 0, 3, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-1, 0, 3.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.antBodyLight;
    ctx.beginPath();
    ctx.ellipse(6, 0, 5.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // comida sendo carregada
    if (this.hasFood) {
      ctx.fillStyle = COLORS.food;
      ctx.beginPath();
      ctx.arc(11, -1, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================
// PARTÍCULA "+1" QUANDO A COMIDA CHEGA NA COLÔNIA
// ============================================================
class Popup {
  constructor(x, y) {
    this.x = x; this.y = y; this.life = 1;
  }
  update(dt) { this.y -= dt * 22; this.life -= dt * 0.9; }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(this.life, 0);
    ctx.fillStyle = COLORS.popup;
    ctx.font = 'bold 12px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+1', this.x, this.y);
    ctx.restore();
  }
}

export default function AntTerrarium({ level = 1 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({ ants: [], foods: [], popups: [], colony: null, w: 0, h: 0 });

  // recria as formigas quando o nível muda
  useEffect(() => {
    const s = stateRef.current;
    const count = Math.max(1, Math.min(level, 10));
    if (s.w && s.h) {
      s.ants = Array.from({ length: count }, () => new Ant(s.w, s.h));
    }
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      s.w = rect.width;
      s.h = rect.height;
      s.colony = { x: rect.width / 2, y: rect.height - 14, onDeposit: (x, y) => s.popups.push(new Popup(x, y - 10)) };

      const count = Math.max(1, Math.min(level, 10));
      if (s.ants.length === 0) {
        s.ants = Array.from({ length: count }, () => new Ant(s.w, s.h));
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function spawnFood() {
      if (s.foods.filter((f) => !f.eaten).length < 3) {
        s.foods.push({
          x: rand(s.w * 0.12, s.w * 0.88),
          y: rand(s.h * 0.4, s.h * 0.78),
          claimed: false,
          eaten: false,
        });
      }
    }
    const foodInterval = setInterval(spawnFood, 2600);
    spawnFood();

    let raf;
    let last = performance.now();

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      s.ants.forEach((a) => a.update(dt, s.foods, s.colony));
      s.foods = s.foods.filter((f) => !f.eaten);
      s.popups.forEach((p) => p.update(dt));
      s.popups = s.popups.filter((p) => p.life > 0);

      draw(ctx, s);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(foodInterval);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="terrario-canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ============================================================
// DESENHO DO CENÁRIO + ENTIDADES
// ============================================================
function draw(ctx, s) {
  const { w, h } = s;
  ctx.clearRect(0, 0, w, h);

  const groundY = h * 0.32;

  // "vidro" / céu do terrário
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, COLORS.glassTop);
  skyGrad.addColorStop(1, COLORS.glassBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, groundY);

  // areia/terra
  const sandGrad = ctx.createLinearGradient(0, groundY, 0, h);
  sandGrad.addColorStop(0, COLORS.sandTop);
  sandGrad.addColorStop(1, COLORS.sandBottom);
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, groundY, w, h - groundY);

  // linha divisória com leve textura
  ctx.strokeStyle = COLORS.sandLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  // entrada da colônia (buraquinho central embaixo)
  const cx = w / 2, cy = h - 14;
  ctx.fillStyle = COLORS.holeRim;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.hole;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 16, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // comidas
  s.foods.forEach((f) => {
    if (f.eaten) return;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.foodRim;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // formigas
  s.ants.forEach((a) => a.draw(ctx));

  // popups "+1"
  s.popups.forEach((p) => p.draw(ctx));
}