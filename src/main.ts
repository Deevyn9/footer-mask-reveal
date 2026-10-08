type Particle = {
  x: number;
  y: number;

  homeX: number;
  homeY: number;

  vx: number;
  vy: number;
};

type RevealStamp = {
  x: number;
  y: number;
  radius: number;
  strength: number;
};

const canvasElement = document.querySelector(
  "#particle-canvas"
);

const heroElement = document.querySelector(".hero");

if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error("Could not find #particle-canvas");
}

if (!(heroElement instanceof HTMLElement)) {
  throw new Error("Could not find .hero");
}

const canvas = canvasElement;
const hero = heroElement;

const context = canvas.getContext("2d");

if (!context) {
  throw new Error("Unable to create a 2D canvas context");
}

const ctx: CanvasRenderingContext2D = context;

const particles: Particle[] = [];
const revealStamps: RevealStamp[] = [];

let width = 0;
let height = 0;
let dpr = 1;

const settings = {
  // Use fewer structural particles for better performance.
  spacing: 12,

  // Cursor influence.
  influenceRadius: 50,

  // Strength of particle displacement.
  pushStrength: 5,

  // Cursor movement carried into the field.
  flowStrength: 0.2,

  // Slow return creates a liquid feel.
  springStrength: 0.004,

  // Higher value preserves movement longer.
  damping: 0.94,

  // Size of the transparent reveal.
  revealRadius: 34,

  // Blue mask color.
  maskColor: "#1265ef"
};

const pointer = {
  x: -Infinity,
  y: -Infinity,

  previousX: -Infinity,
  previousY: -Infinity,

  velocityX: 0,
  velocityY: 0,

  active: false
};

function updatePointer(event: PointerEvent) {
  const rect = hero.getBoundingClientRect();

  const nextX = event.clientX - rect.left;
  const nextY = event.clientY - rect.top;

  if (!pointer.active) {
    pointer.x = nextX;
    pointer.y = nextY;
    pointer.previousX = nextX;
    pointer.previousY = nextY;
    pointer.velocityX = 0;
    pointer.velocityY = 0;
    pointer.active = true;

    return;
  }

  pointer.previousX = pointer.x;
  pointer.previousY = pointer.y;

  pointer.x = nextX;
  pointer.y = nextY;

  pointer.velocityX = pointer.x - pointer.previousX;
  pointer.velocityY = pointer.y - pointer.previousY;
}

hero.addEventListener("pointermove", updatePointer);

hero.addEventListener("pointerleave", () => {
  pointer.active = false;
  pointer.velocityX = 0;
  pointer.velocityY = 0;
});

function resize() {
  const rect = hero.getBoundingClientRect();

  width = rect.width;
  height = rect.height;

  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createParticles();
}

function createParticles() {
  particles.length = 0;

  for (
    let y = settings.spacing / 2;
    y < height;
    y += settings.spacing
  ) {
    for (
      let x = settings.spacing / 2;
      x < width;
      x += settings.spacing
    ) {
      particles.push({
        x,
        y,
        homeX: x,
        homeY: y,
        vx: 0,
        vy: 0
      });
    }
  }
}

function updateParticle(particle: Particle) {
  const dx = particle.x - pointer.x;
  const dy = particle.y - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (
    pointer.active &&
    distance < settings.influenceRadius
  ) {
    const safeDistance = Math.max(distance, 0.001);

    const normalizedDistance =
      1 - distance / settings.influenceRadius;

    const falloff =
      normalizedDistance *
      normalizedDistance *
      (3 - 2 * normalizedDistance);

    const radialForce =
      falloff * settings.pushStrength;

    particle.vx +=
      (dx / safeDistance) * radialForce;

    particle.vy +=
      (dy / safeDistance) * radialForce;

    particle.vx +=
      pointer.velocityX *
      falloff *
      settings.flowStrength;

    particle.vy +=
      pointer.velocityY *
      falloff *
      settings.flowStrength;
  }

  particle.vx +=
    (particle.homeX - particle.x) *
    settings.springStrength;

  particle.vy +=
    (particle.homeY - particle.y) *
    settings.springStrength;

  particle.vx *= settings.damping;
  particle.vy *= settings.damping;

  particle.x += particle.vx;
  particle.y += particle.vy;
}

function addRevealStamp(particle: Particle) {
  const displacement = Math.hypot(
    particle.x - particle.homeX,
    particle.y - particle.homeY
  );

  if (displacement < 1) {
    return;
  }

  revealStamps.push({
    x: particle.x,
    y: particle.y,
    radius:
      settings.revealRadius +
      displacement * 0.35,
    strength: Math.min(displacement / 25, 1)
  });
}

function drawSolidMask() {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = settings.maskColor;
  ctx.fillRect(0, 0, width, height);
}

function eraseRevealStamp(stamp: RevealStamp) {
  const gradient = ctx.createRadialGradient(
    stamp.x,
    stamp.y,
    0,
    stamp.x,
    stamp.y,
    stamp.radius
  );

  gradient.addColorStop(
    0,
    `rgba(0, 0, 0, ${stamp.strength})`
  );

  gradient.addColorStop(
    0.55,
    `rgba(0, 0, 0, ${stamp.strength * 0.65})`
  );

  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;

  ctx.beginPath();

  ctx.arc(
    stamp.x,
    stamp.y,
    stamp.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawMask() {
  drawSolidMask();

  if (revealStamps.length === 0) {
    return;
  }

  ctx.globalCompositeOperation = "destination-out";

  for (const stamp of revealStamps) {
    eraseRevealStamp(stamp);
  }

  ctx.globalCompositeOperation = "source-over";
}

function render() {
  revealStamps.length = 0;

  for (const particle of particles) {
    updateParticle(particle);
    addRevealStamp(particle);
  }

  drawMask();

  pointer.velocityX *= 0.82;
  pointer.velocityY *= 0.82;

  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);

resize();
render();