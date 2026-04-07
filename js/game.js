import { teclas } from './input.js';

// ── CANVAS ──
const canvas = document.getElementById('juego');
const ctx    = canvas.getContext('2d');
let ancho, alto;

// ── CONSTANTES ──
const ROT_NAVE     = 0.065;  
const EMP_NAVE     = 0.18;   
const FRIC_NAVE    = 0.988;  
const VEL_MAX      = 8;      
const VEL_BALA     = 11;     
const VIDA_BALA    = 55;     
const ENFR_DISPARO = 18;    
const RADIO_SEGURO = 120;    
const TAM   = { grande: 38, mediano: 20, pequeno: 10 };
const PTS   = { grande: 20, mediano: 50, pequeno: 100 };
const VEL   = { grande: 0.8, mediano: 1.4, pequeno: 2.2 };
const LADOS = { grande: 10, mediano: 8, pequeno: 6 };

// ESTADO GLOBAL
let nave, asteroides, balas, particulas, estrellas = [];
let puntaje, record, vidas, nivel;
let frame, enfriamiento, invencible;
let estado = 'idle';

const envolver = (v, max) => v < 0 ? v + max : v >= max ? v - max : v;

// RESIZE
function ajustarCanvas() {
  const cabecera = document.querySelector('header');
  ancho = window.innerWidth;
  alto  = window.innerHeight - cabecera.offsetHeight;
  canvas.width  = ancho;
  canvas.height = alto;
}
window.addEventListener('resize', () => { ajustarCanvas(); crearEstrellas(); });

// ESTRELLAS DE FONDO
function crearEstrellas() {
  estrellas = [];
  for (let i = 0; i < 140; i++)
    estrellas.push({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      r: Math.random() * 1.3,
      a: 0.15 + Math.random() * 0.6
    });
}

function dibujarEstrellas() {
  for (const s of estrellas) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// HUD 
function actualizarHUD() {
  document.getElementById('display-puntaje').textContent = puntaje;
  document.getElementById('display-nivel').textContent   = nivel;
  document.getElementById('display-record').textContent  = record;

  const cont = document.getElementById('vidas-hud');
  cont.innerHTML = '';
  for (let i = 0; i < vidas; i++) {
    const svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-14 -12 28 26');
    svg.setAttribute('width',  '13');
    svg.setAttribute('height', '13');
    const poli = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poli.setAttribute('points',       '10,0 -8,-8 -4,0 -8,8');
    poli.setAttribute('fill',         'none');
    poli.setAttribute('stroke',       '#00ff88');
    poli.setAttribute('stroke-width', '1.5');
    svg.appendChild(poli);
    cont.appendChild(svg);
  }
}

// INICIO DE JUEGO 
function iniciarJuego() {
  ajustarCanvas();
  puntaje      = 0;
  vidas        = 3;
  nivel        = 1;
  frame        = 0;
  enfriamiento = 0;
  asteroides   = [];
  balas        = [];
  particulas   = [];
  crearNave();
  spawnAsteroides(nivel + 3);
  actualizarHUD();
}

// NAVE 
function crearNave() {
  nave = {
    x: ancho / 2, y: alto / 2,
    vx: 0, vy: 0,
    angulo: -Math.PI / 2,
    radio: 12,
    empujando: false,
    muerta: false,
  };
  invencible = 180;
}

function actualizarNave() {
  if (nave.muerta) return;

  const izquierda = teclas['ArrowLeft']  || teclas['a'] || teclas['A'];
  const derecha   = teclas['ArrowRight'] || teclas['d'] || teclas['D'];
  const empuje    = teclas['ArrowUp']    || teclas['w'] || teclas['W'];

  if (izquierda) nave.angulo -= ROT_NAVE;
  if (derecha)   nave.angulo += ROT_NAVE;

  nave.empujando = empuje;
  if (empuje) {
    nave.vx += Math.cos(nave.angulo) * EMP_NAVE;
    nave.vy += Math.sin(nave.angulo) * EMP_NAVE;
  }

  const vel = Math.hypot(nave.vx, nave.vy);
  if (vel > VEL_MAX) {
    nave.vx = (nave.vx / vel) * VEL_MAX;
    nave.vy = (nave.vy / vel) * VEL_MAX;
  }

  nave.vx *= FRIC_NAVE;
  nave.vy *= FRIC_NAVE;
  nave.x   = envolver(nave.x + nave.vx, ancho);
  nave.y   = envolver(nave.y + nave.vy, alto);

  if (invencible > 0) invencible--;
}

function dibujarNave() {
  if (nave.muerta) return;
  if (invencible > 0 && Math.floor(invencible / 6) % 2 === 0) return;

  ctx.save();
  ctx.translate(nave.x, nave.y);
  ctx.rotate(nave.angulo);
  ctx.beginPath();
  ctx.moveTo( 18,   0);
  ctx.lineTo(-12, -10);
  ctx.lineTo( -7,   0);
  ctx.lineTo(-12,  10);
  ctx.closePath();
  ctx.strokeStyle = '#e8f4ff';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

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

// BALAS 
function disparar() {
  if (enfriamiento > 0 || nave.muerta) return;
  balas.push({
    x:    nave.x + Math.cos(nave.angulo) * 20,
    y:    nave.y + Math.sin(nave.angulo) * 20,
    vx:   nave.vx + Math.cos(nave.angulo) * VEL_BALA,
    vy:   nave.vy + Math.sin(nave.angulo) * VEL_BALA,
    vida: VIDA_BALA,
  });
  enfriamiento = ENFR_DISPARO;
}

function actualizarBalas() {
  for (const b of balas) {
    b.x    = envolver(b.x + b.vx, ancho);
    b.y    = envolver(b.y + b.vy, alto);
    b.vida--;
  }
  balas = balas.filter(b => b.vida > 0);
}

function dibujarBalas() {
  ctx.fillStyle = '#00ffcc';
  for (const b of balas) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

//  PARTICULAS 
function explotar(x, y, cantidad, color) {
  for (let i = 0; i < cantidad; i++) {
    const ang = Math.random() * Math.PI * 2;
    const vel = 1 + Math.random() * 3.5;
    particulas.push({
      x, y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      vida:    30 + Math.random() * 30,
      vidaMax: 60,
      color,
    });
  }
}

function actualizarParticulas() {
  for (const p of particulas) {
    p.x  += p.vx;  p.y  += p.vy;
    p.vx *= 0.97;  p.vy *= 0.97;
    p.vida--;
  }
  particulas = particulas.filter(p => p.vida > 0);
}

function dibujarParticulas() {
  for (const p of particulas) {
    ctx.globalAlpha = p.vida / p.vidaMax;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// COLISIONES
const colisionCirculos = (ax,ay,ar,bx,by,br) => Math.hypot(ax-bx, ay-by) < ar+br;

function verificarColisiones() {
  // Balas 
  for (let bi = balas.length - 1; bi >= 0; bi--) {
    const b = balas[bi];
    for (let ai = asteroides.length - 1; ai >= 0; ai--) {
      const a = asteroides[ai];
      if (colisionCirculos(b.x, b.y, 2, a.x, a.y, a.radio)) {
        balas.splice(bi, 1);
        partirAsteroide(a, ai);
        break;
      }
    }
  }

  // Nave contra asteroides
  if (!nave.muerta && invencible <= 0) {
    for (const a of asteroides) {
      if (colisionCirculos(nave.x, nave.y, nave.radio - 4, a.x, a.y, a.radio - 4)) {
        matarNave(); break;
      }
    }
  }
}

function partirAsteroide(a, indice) {
  puntaje += PTS[a.tipo];
  if (puntaje > record) {
    record = puntaje;
    localStorage.setItem('ast_record', record);
  }
  actualizarHUD();

  const cantidad = a.tipo === 'grande' ? 12 : a.tipo === 'mediano' ? 8 : 5;
  explotar(a.x, a.y, cantidad, '#7799aa');
  asteroides.splice(indice, 1);

  if (a.tipo === 'grande') {
    asteroides.push(crearAsteroide(a.x, a.y, 'mediano'));
    asteroides.push(crearAsteroide(a.x, a.y, 'mediano'));
  } else if (a.tipo === 'mediano') {
    asteroides.push(crearAsteroide(a.x, a.y, 'pequeno'));
    asteroides.push(crearAsteroide(a.x, a.y, 'pequeno'));
  }

  if (asteroides.length === 0) siguienteNivel();
}

function matarNave() {
  explotar(nave.x, nave.y, 20, '#ff6b35');
  nave.muerta = true;
  vidas--;
  actualizarHUD();
  setTimeout(() => { if (vidas <= 0) finJuego(); else crearNave(); }, 1200);
}

function siguienteNivel() {
  nivel++;
  puntaje += nivel * 100;
  actualizarHUD();
  setTimeout(() => spawnAsteroides(nivel + 3), 1000);
}

// GAME LOOP 
function loop() {
  requestAnimationFrame(loop);
  if (estado !== 'jugando') return;

  frame++;

  // Disparo con espacio
  if (teclas[' '] || teclas['Spacebar']) disparar();
  if (enfriamiento > 0) enfriamiento--;

  // Pausa con P
  if (teclas['p'] || teclas['P']) {
    teclas['p'] = false; teclas['P'] = false;
    pausar(); return;
  }

  actualizarNave();
  actualizarAsteroides();
  actualizarBalas();
  actualizarParticulas();
  verificarColisiones();

  // Dibujar todo
  ctx.clearRect(0, 0, ancho, alto);
  dibujarEstrellas();
  for (const a of asteroides) dibujarAsteroide(a);
  dibujarBalas();
  dibujarParticulas();
  dibujarNave();
}

// CONTROL DE ESTADO 
function comenzar() {
  record = parseInt(localStorage.getItem('ast_record') || '0');
  iniciarJuego();
  estado = 'jugando';
  document.getElementById('dlg-inicio').close();
}

function pausar() {
  if (estado !== 'jugando') return;
  estado = 'pausado';
  document.getElementById('dlg-pausa').showModal();
}

function reanudar() {
  estado = 'jugando';
  document.getElementById('dlg-pausa').close();
}

function finJuego() {
  estado = 'fin';
  localStorage.setItem('ast_record', record);
  document.getElementById('puntaje-final').textContent = puntaje;
  document.getElementById('dlg-fin').showModal();
}

function reiniciar() {
  document.getElementById('dlg-fin').close();
  comenzar();
}

// BOTONES
document.getElementById('btn-iniciar').addEventListener('click', comenzar);
document.getElementById('btn-continuar').addEventListener('click', reanudar);
document.getElementById('btn-reiniciar').addEventListener('click', reiniciar);

window.addEventListener('keydown', e => {
  if ((e.key === 'p' || e.key === 'P') && estado === 'pausado') reanudar();
});

ajustarCanvas();
crearEstrellas();
record = parseInt(localStorage.getItem('ast_record') || '0');
document.getElementById('display-record').textContent = record;
loop();
document.getElementById('dlg-inicio').showModal();