import { teclas } from './input.js';

// ── CANVAS ──
const canvas = document.getElementById('juego');
const ctx    = canvas.getContext('2d');
let ancho, alto;

const ROT_NAVE  = 0.065;
const EMP_NAVE  = 0.18;
const FRIC_NAVE = 0.988;
const VEL_MAX   = 8;
const RADIO_SEGURO = 120;
const TAM   = { grande: 38, mediano: 20, pequeno: 10 };
const PTS   = { grande: 20, mediano: 50, pequeno: 100 };
const VEL   = { grande: 0.8, mediano: 1.4, pequeno: 2.2 };
const LADOS = { grande: 10, mediano: 8, pequeno: 6 };

let nave;
let balas = [];
let estado = 'idle';
let asteroides = [];
let naveGolpeada = false;

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
    vida: 90,
  })

  if (teclas[' '] || teclas['Space']) {
    teclas[' '] = false;
    teclas['Space'] = false;
  }
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
  ctx.strokeStyle = naveGolpeada ? '#ff0000' : '#00ff88';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // fuegaso
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

  function dibujarBalas() {
    ctx.fillStyle = '#c875e9';

    balas.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

// ASTEROIDES

function crearAsteroide(x, y, tipo) {
  const radio    = TAM[tipo];
  const vel      = VEL[tipo] * (0.7 + Math.random() * 0.8);
  const angulo   = Math.random() * Math.PI * 2;
  const lados    = LADOS[tipo];
  const deformes = Array.from({ length: lados }, () => 0.7 + Math.random() * 0.5);

  return {
    x, y,
    vx: Math.cos(angulo) * vel,
    vy: Math.sin(angulo) * vel,
    angulo: Math.random() * Math.PI * 2,
    giro:   (Math.random() - 0.5) * 0.03,
    radio, tipo, lados, deformes,
  };
}

function spawnAsteroides(cantidad) {
  for (let i = 0; i < cantidad; i++) {
    let x, y;
    do {
      x = Math.random() * ancho;
      y = Math.random() * alto;
    } while (Math.hypot(x - ancho / 2, y - alto / 2) < RADIO_SEGURO);
    asteroides.push(crearAsteroide(x, y, 'grande'));
  }
}

function actualizarAsteroides() {
  for (const a of asteroides) {
    a.x      = envolver(a.x + a.vx, ancho);
    a.y      = envolver(a.y + a.vy, alto);
    a.angulo += a.giro;
  }
}

function dibujarAsteroide(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.angulo);
  ctx.beginPath();
  for (let i = 0; i < a.lados; i++) {
    const ang = (i / a.lados) * Math.PI * 2;
    const r   = a.radio * a.deformes[i];
    i === 0 ? ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r)
            : ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
  }
  ctx.closePath();
  ctx.strokeStyle = '#7799aa';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();
}

function verificarChoqueNaveAstd () {
  if (!nave || naveGolpeada) return false;

  for (const a of asteroides) {
    const dx = nave.x - a.x;
    const dy = nave.y - a.y;
    const distancia = Math.hypot(dx, dy);
    const radioNave = 15;

    if (distancia < a.radio + radioNave) {
      return a;
    }
  }
  return null;
}

// LOOP
function loop() {
  requestAnimationFrame(loop);
  if (estado !== 'jugando') return;

  if (teclas['p'] || teclas['P']) {
    teclas['p'] = false; teclas['P'] = false;
    pausar(); return;
  }

  if (teclas[' '] || teclas['Space']) {
    dispararNave();
    teclas[' '] = false;
    teclas['Space'] = false;
  }

  actualizarNave();
  actualizarAsteroides();

  const asteroideColisionado = verificarChoqueNaveAstd();
  if (asteroideColisionado) {
    naveGolpeada = true;
    estado = 'perdido';
    document.getElementById('dlg-fin').showModal();
  }

  balas = balas.filter(b => --b.vida > 0);
  balas.forEach(b => {
    b.x = envolver(b.x + b.vx, ancho);
    b.y = envolver(b.y + b.vy, alto);
  });

  ctx.clearRect(0, 0, ancho, alto);
  dibujarNave();
  dibujarBalas();
  for (const a of asteroides) dibujarAsteroide(a);
}

// ESTADO
function comenzar() {
  ajustarCanvas();
  crearNave();
  balas = [];
  asteroides = [];
  naveGolpeada = false;
  spawnAsteroides(6);
  estado = 'jugando';
  document.getElementById('dlg-inicio').close();

  const dlgFin = document.getElementById('dlg-fin');
  if (dlgFin.open) dlgFin.close();
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
document.getElementById('btn-reiniciar').addEventListener('click', comenzar);

window.addEventListener('keydown', e => {
  if ((e.key === 'p' || e.key === 'P') && estado === 'pausado') reanudar();
});

ajustarCanvas();
loop();
document.getElementById('dlg-inicio').showModal();