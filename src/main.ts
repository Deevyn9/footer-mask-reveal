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

const ctx = canvas.getContext("2d")

if (!ctx) {
  throw new Error("Unable to create a 2D canvas context")
}

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
  flowStrenght: 0.1,

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