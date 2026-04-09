import { teclas } from './input.js';

// ── CANVAS ──
const canvas = document.getElementById('juego');
const ctx    = canvas.getContext('2d');
let ancho, alto;

const ROT_NAVE  = 0.065;
const EMP_NAVE  = 0.18;
const FRIC_NAVE = 0.988;
const VEL_MAX   = 8;

let nave;
let balas = [];
let estado = 'idle';

const envolver = (v, max) => v < 0 ? v + max : v >= max ? v - max : v;

// CANVAS
function ajustarCanvas() {
  const cabecera = document.querySelector('header');
  ancho = canvas.width  = window.innerWidth;
  alto  = canvas.height = window.innerHeight - cabecera.offsetHeight;
}
window.addEventListener('resize', () => { ajustarCanvas() });

// NAVE
function crearNave() {
  nave = {
    x: ancho / 2, y: alto / 2,
    vx: 0, vy: 0,
    angulo: -Math.PI / 2,
    empujando: false,
  };
}

function dispararNave() {
  if (!nave) return;
  balas.push({
    x: nave.x,
    y: nave.y,
    vx: Math.cos(nave.angulo) * 10,
    vy: Math.sin(nave.angulo) * 10,
    vida: 60,
  })
}

function actualizarNave() {
  if (!nave) return;

  if (teclas['ArrowLeft']  || teclas['a']) nave.angulo -= ROT_NAVE;
  if (teclas['ArrowRight'] || teclas['d']) nave.angulo += ROT_NAVE;

  nave.empujando = !!(teclas['ArrowUp'] || teclas['w']);
  if (nave.empujando) {
    nave.vx += Math.cos(nave.angulo) * EMP_NAVE;
    nave.vy += Math.sin(nave.angulo) * EMP_NAVE;
  }

  const v = Math.hypot(nave.vx, nave.vy);
  if (v > VEL_MAX) { nave.vx = (nave.vx / v) * VEL_MAX; nave.vy = (nave.vy / v) * VEL_MAX; }

  nave.vx *= FRIC_NAVE;
  nave.vy *= FRIC_NAVE;
  nave.x   = envolver(nave.x + nave.vx, ancho);
  nave.y   = envolver(nave.y + nave.vy, alto);
}

function dibujarNave() {
  if (!nave) return;
  ctx.save();
  ctx.translate(nave.x, nave.y);
  ctx.rotate(nave.angulo);

  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Llama del motor
  if (nave.empujando && Math.random() > 0.3) {
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-14, -4 - Math.random() * 4);
    ctx.lineTo(-22 - Math.random() * 8, 0);
    ctx.lineTo(-14,  4 + Math.random() * 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,140,0,0.8)';
    ctx.fill();
  }

  ctx.restore();
}

// LOOP
function loop() {
  requestAnimationFrame(loop);
  if (estado !== 'jugando') return;

  if (teclas['p'] || teclas['P']) {
    teclas['p'] = false; teclas['P'] = false;
    pausar(); return;
  }

  actualizarNave();

  ctx.clearRect(0, 0, ancho, alto);
  dibujarNave();
}

// ESTADO
function comenzar() {
  ajustarCanvas();
  crearNave();
  estado = 'jugando';
  document.getElementById('dlg-inicio').close();
}

function pausar() {
  estado = 'pausado';
  document.getElementById('dlg-pausa').showModal();
}

function reanudar() {
  estado = 'jugando';
  document.getElementById('dlg-pausa').close();
}

// BOTONES
document.getElementById('btn-iniciar').addEventListener('click', comenzar);
document.getElementById('btn-continuar').addEventListener('click', reanudar);

window.addEventListener('keydown', e => {
  if ((e.key === 'p' || e.key === 'P') && estado === 'pausado') reanudar();
});

ajustarCanvas();
loop();
document.getElementById('dlg-inicio').showModal();