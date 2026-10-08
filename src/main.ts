// model for each particle: current position, home position, velocity, and radius
type Particle = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
}

//set-up canvas
const canvas = document.querySelector(
  "#particle-canvas"
) as HTMLCanvasElement

const hero = document.querySelector(
  ".hero"
) as HTMLElement;

const context = canvas.getContext("2d")

if (!context) {
  throw new Error("Unable to create a 2D canvas context")
}

const ctx: CanvasRenderingContext2D = context;

const particles: Particle[] = [];

let width = 0;
let height = 0;
let dpr = 1;


// define physics
const settings = {
  spacing: 4,
  minRadius: 1.25,
  maxRadius: 1.9,

  influenceRadius: 50,

  pushStrength: 1.8,
  flowStrength: 0.1,

  springStrength: 0.012,
  damping: 0.9,

  color: "#1265ef"
}

// track pointer movement
const pointer = {
  x: -Infinity,
  y: -Infinity,
  previousX: -Infinity,
  previousY: -Infinity,
  active: false
}

hero.addEventListener("pointermove", (event) => {
  const rect = hero.getBoundingClientRect()

  pointer.previousX = pointer.x
  pointer.previousY = pointer.y

  pointer.x = event.clientX - rect.left
  pointer.y = event.clientY - rect.top

  if (!pointer.active) {
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y
  }

  pointer.active = true
})

hero.addEventListener("pointerleave", () => {
  pointer.active = false;
})

// resize and generate particles
function resize() {
  const rect = hero.getBoundingClientRect()

  width = rect.width;
  height = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

  createParticles()
}

function createParticles() {
  particles.length = 0

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
        vy: 0,
        radius:
          settings.minRadius +
          Math.random() *
            (settings.maxRadius - settings.minRadius)
      });
    }
  }
}

// calculate cursor velocity
function getPointerVelocity() {
  if (!pointer.active) {
    return { x: 0, y: 0 }
  }

  return {
    x: pointer.x - pointer.previousX,
    y: pointer.y - pointer.previousY
  }
}

// update the particles
function updateParticle(
  particle: Particle,
  pointerVelocity: { x: number; y: number }
) {
  const dx = particle.x - pointer.x;
  const dy = particle.y - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (
    pointer.active &&
    distance > 0 &&
    distance < settings.influenceRadius
  ) {
    const falloff =
      1 - distance / settings.influenceRadius;

    const radialForce =
      falloff * falloff * settings.pushStrength;

    const normalX = dx / distance;
    const normalY = dy / distance;

    // Push away from the pointer.
    particle.vx += normalX * radialForce;
    particle.vy += normalY * radialForce;

    // Carry particles slightly in the pointer's direction.
    particle.vx += pointerVelocity.x * falloff * settings.flowStrength;
    particle.vy += pointerVelocity.y * falloff * settings.flowStrength;
  }

  // Spring force: return to the original grid position.
  particle.vx +=
    (particle.homeX - particle.x) *
    settings.springStrength;

  particle.vy +=
    (particle.homeY - particle.y) *
    settings.springStrength;

  // Damping: remove energy gradually.
  particle.vx *= settings.damping;
  particle.vy *= settings.damping;

  particle.x += particle.vx;
  particle.y += particle.vy;
}

// draw the particles
function drawParticle(particle: Particle) {
  ctx.fillStyle = settings.color;

  ctx.beginPath();
  ctx.arc(
    particle.x,
    particle.y,
    particle.radius,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// create animation loop
function render() {
  ctx.clearRect(0, 0, width, height);

  const pointerVelocity = getPointerVelocity();

  for (const particle of particles) {
    updateParticle(particle, pointerVelocity);
    drawParticle(particle);
  }

  pointer.previousX = pointer.x;
  pointer.previousY = pointer.y;

  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);

resize();
render();