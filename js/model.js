    const ROT_NAVE = 0.065;
    const EMP_NAVE = 0.18;
    const FRIC_NAVE = 0.988;
    const VEL_MAX = 8;

    export const RADIO_SEGURO = 120;
    export const TAM = { grande: 38, mediano: 20, pequeno: 10 };
    export const VEL = { grande: 0.8, mediano: 1.4, pequeno: 2.2 };
    export const LADOS = { grande: 10, mediano: 8, pequeno: 6 };
    export const PTS = { grande: 20, mediano: 50, pequeno: 100 };
    export let vidas      = 3;
    export let nivel      = 1;
    export let record     = 0;
    export const estadoNave = { invencible: 0 };
    export let particulas = [];

    export const envolver = (v, max) => v < 0 ? v + max : v >= max ? v - max : v;
    const cooldownDisparo = 220;
    const maxBalas = 4;
    let ultimoDisparo = 0;

    // ESTADO 
    export let nave = null;
    export let balas = [];
    export let asteroides = [];
    export let estado = 'idle';
    export let puntaje = 0;
    export let naveGolpeada = false;

    export function setEstado(e) { estado = e; }
    export function setNaveGolpeada(v) { naveGolpeada = v; }
    export function setBalas(arr) { balas = arr; }
    export function setInvencible(v) { estadoNave.invencible = v; }
    
    // NAVE
    export function crearNave(ancho, alto) {
        nave = {
            x: ancho / 2, y: alto / 2,
            vx: 0, vy: 0,
            angulo: -Math.PI / 2,
            empujando: false,
            muerta: false,
        };
        estadoNave.invencible = 180;
    }

    export function dispararNave() {
        if (!nave) return;
        if (balas.length >= maxBalas) return;

        const ahora = Date.now();
        if (ahora - ultimoDisparo < cooldownDisparo) return;

        ultimoDisparo = ahora;
        balas.push({
            x: nave.x,
            y: nave.y,
            vx: Math.cos(nave.angulo) * 10,
            vy: Math.sin(nave.angulo) * 10,
            vida: 90,
        });
    }

    export function actualizarNave(teclas, ancho, alto) {
        if (!nave) return;

        if (teclas['ArrowLeft'] || teclas['a']) nave.angulo -= ROT_NAVE;
        if (teclas['ArrowRight'] || teclas['d']) nave.angulo += ROT_NAVE;

        nave.empujando = !!(teclas['ArrowUp'] || teclas['w']);
        if (nave.empujando) {
            nave.vx += Math.cos(nave.angulo) * EMP_NAVE;
            nave.vy += Math.sin(nave.angulo) * EMP_NAVE;
        }

        const v = Math.hypot(nave.vx, nave.vy);
        if (v > VEL_MAX) {
            nave.vx = (nave.vx / v) * VEL_MAX;
            nave.vy = (nave.vy / v) * VEL_MAX;
        }

        nave.vx *= FRIC_NAVE;
        nave.vy *= FRIC_NAVE;
        nave.x = envolver(nave.x + nave.vx, ancho);
        nave.y = envolver(nave.y + nave.vy, alto);

        if (estadoNave.invencible > 0) estadoNave.invencible--;
    }

    export function matarNave(ancho, alto) {
        nave.muerta = true;
        vidas--;
        if (vidas <= 0) {
            estado = 'fin';
            if (puntaje > record) {
                record = puntaje;
                localStorage.setItem('ast_record', record);
            }
        } else {
            setTimeout(() => crearNave(ancho, alto), 1200);
        }
    }

    export function siguienteNivel(ancho, alto) {
        nivel++;
        puntaje += nivel * 100;
        setTimeout(() => spawnAsteroides(nivel + 3, ancho, alto), 1000);
    }

    // BALAS
    export function actualizarBalas(ancho, alto) {
        balas = balas.filter(b => --b.vida > 0);
        balas.forEach(b => {
            b.x = envolver(b.x + b.vx, ancho);
            b.y = envolver(b.y + b.vy, alto);
        });
    }

    // ASTEROIDES 
    export function crearAsteroide(x, y, tipo) {
        const radio = TAM[tipo];
        const vel = VEL[tipo] * (0.7 + Math.random() * 0.9);
        const angulo = Math.random() * Math.PI * 2;
        const lados = LADOS[tipo];
        const deformes = Array.from({ length: lados }, () => 0.7 + Math.random() * 0.5);

        return {
            x, y,
            vx: Math.cos(angulo) * vel,
            vy: Math.sin(angulo) * vel,
            angulo: Math.random() * Math.PI * 2,
            giro: (Math.random() - 0.5) * 0.03,
            radio, tipo, lados, deformes,
        };
    }

    export function spawnAsteroides(cantidad, ancho, alto) {
        for (let i = 0; i < cantidad; i++) {
            let x, y;
            do {
                x = Math.random() * ancho;
                y = Math.random() * alto;
            } while (Math.hypot(x - nave.x, y - nave.y) < RADIO_SEGURO);
            asteroides.push(crearAsteroide(x, y, 'grande'));
        }
    }

    export function actualizarAsteroides(ancho, alto) {
        for (const a of asteroides) {
            a.x = envolver(a.x + a.vx, ancho);
            a.y = envolver(a.y + a.vy, alto);
            a.angulo += a.giro;
        }
    }

    // COLISIONES
    export function verificarChoqueNaveAstd() {
        if (!nave || nave.muerta || estadoNave.invencible > 0) return null;

        for (const a of asteroides) {
            if (Math.hypot(nave.x - a.x, nave.y - a.y) < a.radio + 15) return a;
        }
        return null;
    }

    export function verificarChoqueBalasAsteroides() {
        let puntosGanados = 0;

        for (let i = balas.length - 1; i >= 0; i--) {
            const bala = balas[i];
            for (let j = asteroides.length - 1; j >= 0; j--) {
                const ast = asteroides[j];
                if (Math.hypot(bala.x - ast.x, bala.y - ast.y) < ast.radio + 2) {
                    puntosGanados += PTS[ast.tipo];
                    balas.splice(i, 1);
                    asteroides.splice(j, 1);
                    break;
                }
            }
        }

        puntaje += puntosGanados;
        return puntosGanados;
    }

    // REINICIAR
    export function reiniciar(ancho, alto) {
        balas = [];
        asteroides = [];
        particulas = [];
        naveGolpeada = false;
        puntaje = 0;
        vidas = 3;
        nivel = 1;
        nave = null;
        estadoNave.invencible = 0;
        ultimoDisparo = 0;
        record = parseInt(localStorage.getItem('ast_record') || '0');
        crearNave(ancho, alto);
        spawnAsteroides(nivel + 3, ancho, alto);
        estado = 'jugando';
    }