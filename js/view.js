const canvas = document.getElementById('juego');
const ctx = canvas.getContext('2d');
export let ancho = 0;
export let alto = 0;

// CANVAS 
export function ajustarCanvas() {
    const cabecera = document.querySelector('header');
    ancho = canvas.width = window.innerWidth;
    alto = canvas.height = window.innerHeight - cabecera.offsetHeight;
}

export function limpiar() {
    ctx.clearRect(0, 0, ancho, alto);
}

// NAVECITA
export function dibujarNave(nave, golpeada, invencible) {
    if (!nave || nave.muerta) return;
    if (invencible > 0 && Math.floor(invencible / 6) % 2 === 0) return;
    ctx.save();
    ctx.translate(nave.x, nave.y);
    ctx.rotate(nave.angulo);

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.strokeStyle = golpeada ? '#ff0000' : '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // fueguito
    if (nave.empujando && Math.random() > 0.3) {
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(-14, -4 - Math.random() * 4);
        ctx.lineTo(-22 - Math.random() * 8, 0);
        ctx.lineTo(-14, 4 + Math.random() * 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,140,0,0.8)';
        ctx.fill();
    }

    ctx.restore();
}

// VIDAS

export function actualizarHUD(puntaje, nivel, record, vidas) {
    document.getElementById('display-puntaje').textContent = puntaje;
    document.getElementById('display-nivel').textContent = nivel;
    document.getElementById('display-record').textContent = record;

    const cont = document.getElementById('vidas-hud');
    cont.innerHTML = '';
    for (let i = 0; i < vidas; i++) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '-14 -12 28 26');
        svg.setAttribute('width', '13');
        svg.setAttribute('height', '13');
        const poli = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poli.setAttribute('points', '10,0 -8,-8 -4,0 -8,8');
        poli.setAttribute('fill', 'none');
        poli.setAttribute('stroke', '#00ff88');
        poli.setAttribute('stroke-width', '1.5');
        svg.appendChild(poli);
        cont.appendChild(svg);
    }
}

// BALAS
export function dibujarBalas(balas) {
    ctx.fillStyle = '#c875e9';
    balas.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ASTEROIDES 
export function dibujarAsteroide(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angulo);
    ctx.beginPath();
    for (let i = 0; i < a.lados; i++) {
        const ang = (i / a.lados) * Math.PI * 2;
        const r = a.radio * a.deformes[i];
        i === 0
            ? ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r)
            : ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.strokeStyle = '#7799aa';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

// DOM 
export function actualizarPuntaje(pts) {
    document.getElementById('display-puntaje').textContent = pts;
}

export function mostrarDialogoFin(pts) {
    document.getElementById('puntaje-final').textContent = pts;
    document.getElementById('dlg-fin').showModal();
}

export function mostrarDialogoPausa() {
    document.getElementById('dlg-pausa').showModal();
}

export function cerrarDialogoPausa() {
    document.getElementById('dlg-pausa').close();
}

export function cerrarDialogoInicio() {
    document.getElementById('dlg-inicio').close();
}

export function cerrarDialogoFin() {
    const dlg = document.getElementById('dlg-fin');
    if (dlg.open) dlg.close();
}