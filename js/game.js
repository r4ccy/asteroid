import { teclas } from './input.js';
import * as Model from './model.js';
import * as View  from './view.js';

// LOOP
function loop() {
  requestAnimationFrame(loop);
  if (Model.estado !== 'jugando') return;

  // Pausa
  if (teclas['p'] || teclas['P']) {
    teclas['p'] = false; teclas['P'] = false;
    pausar();
    return;
  }

  // Disparo
  if (teclas[' '] || teclas['Space']) {
    Model.dispararNave();
    teclas[' '] = false;
    teclas['Space'] = false;
  }

  // Actualizar modelo
  Model.actualizarNave(teclas, View.ancho, View.alto);
  Model.actualizarAsteroides(View.ancho, View.alto);
  Model.actualizarBalas(View.ancho, View.alto);

  // Colisiones
  const puntosNuevos = Model.verificarChoqueBalasAsteroides();
  if (puntosNuevos > 0) {
    View.actualizarPuntaje(Model.puntaje);
  }

  const golpeado = Model.verificarChoqueNaveAstd();
  if (golpeado) {
    Model.setNaveGolpeada(true);
    Model.setEstado('perdido');
    View.mostrarDialogoFin(Model.puntaje);
    return;
  }

  // Dibujar vista
  View.limpiar();
  View.dibujarNave(Model.nave, Model.naveGolpeada);
  View.dibujarBalas(Model.balas);
  for (const a of Model.asteroides) View.dibujarAsteroide(a);
}

// ACCIONES 
function comenzar() {
  View.ajustarCanvas();
  Model.reiniciar(View.ancho, View.alto);
  View.actualizarPuntaje(0);
  View.cerrarDialogoInicio();
  View.cerrarDialogoFin();
}

function pausar() {
  Model.setEstado('pausado');
  View.mostrarDialogoPausa();
}

function reanudar() {
  Model.setEstado('jugando');
  View.cerrarDialogoPausa();
}

// BOTONES
document.getElementById('btn-iniciar').addEventListener('click', comenzar);
document.getElementById('btn-continuar').addEventListener('click', reanudar);
document.getElementById('btn-reiniciar').addEventListener('click', comenzar);

window.addEventListener('keydown', e => {
  if ((e.key === 'p' || e.key === 'P') && Model.estado === 'pausado') reanudar();
});

window.addEventListener('resize', View.ajustarCanvas);

// INICIO 
View.ajustarCanvas();
loop();
document.getElementById('dlg-inicio').showModal();