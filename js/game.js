import { teclas } from './input.js?v=20260421';
import * as Model from './model.js?v=20260421';
import * as View from './view.js?v=20260421';

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
  }

  // Actualizar modelo
  Model.actualizarNave(teclas, View.ancho, View.alto);
  Model.actualizarAsteroides(View.ancho, View.alto);
  Model.actualizarBalas(View.ancho, View.alto);

  // Colisiones
  const puntos = Model.verificarChoqueBalasAsteroides();
  if (puntos > 0) {
    View.actualizarHUD(Model.puntaje, Model.nivel, Model.record, Model.vidas);
    if (Model.asteroides.length === 0) {
      Model.siguienteNivel(View.ancho, View.alto);
    }
  }
  const golpeado = Model.verificarChoqueNaveAstd();
  if (golpeado) {
    Model.matarNave(View.ancho, View.alto);
    View.actualizarHUD(Model.puntaje, Model.nivel, Model.record, Model.vidas);
    if (Model.estado === 'fin') {
      View.mostrarDialogoFin(Model.puntaje);
    }
  }


  // Dibujar vista
  View.limpiar();
  View.dibujarNave(Model.nave, Model.naveGolpeada, Model.estadoNave.invencible);
  View.dibujarBalas(Model.balas);
  for (const a of Model.asteroides) View.dibujarAsteroide(a);
}

// ACCIONES 
function comenzar() {
  View.ajustarCanvas();
  Model.reiniciar(View.ancho, View.alto);
  View.actualizarHUD(Model.puntaje, Model.nivel, Model.record, Model.vidas);
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