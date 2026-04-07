export const teclas = {};

window.addEventListener('keydown', e => {
  teclas[e.key] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
    e.preventDefault();
});

window.addEventListener('keyup', e => {
  teclas[e.key] = false;
});