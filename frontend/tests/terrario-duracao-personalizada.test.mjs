import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('foco permite digitar ou ajustar minutos com mais e menos', () => {
  assert.match(jsx, /const DURACAO_MINIMA = 1/);
  assert.match(jsx, /const DURACAO_MAXIMA = 120/);
  assert.match(jsx, /aria-label="Diminuir um minuto"/);
  assert.match(jsx, /aria-label="Aumentar um minuto"/);
  assert.match(jsx, /aria-label="Minutos de foco"/);
  assert.match(jsx, /onBlur=\{confirmarDuracaoDigitada\}/);
  assert.doesNotMatch(jsx, /DURATIONS\.map/);
  assert.match(css, /\.terr-page \.terr-duration-picker/);
});

test('progresso no circulo cresce durante a sessão e pausa sem zerar', () => {
  assert.match(jsx, /const ringOffset = ANEL_CIRCUNFERENCIA \* \(1 - progress \/ 100\)/);
  assert.match(jsx, /strokeDasharray=\{ANEL_CIRCUNFERENCIA\}/);
  assert.match(jsx, /strokeDashoffset=\{ringOffset\}/);
  assert.match(jsx, /role="timer"/);
  assert.match(css, /\.terr-page \.terr-timer-clock\.is-paused \.terr-timer-ring-progress/);
});

test('controles de foco mantêm os estados, com botões aprimorados', () => {
  for (const action of ['iniciar', 'pausar', 'continuar', 'cancelar']) {
    assert.ok(jsx.includes(`sendAction('${action}')`));
  }
  assert.match(jsx, /disabled=\{busy \|\| loading \|\| !server \|\| !durationInputValida\}/);
  assert.match(css, /\.terr-page \.terr-timer-buttons \.terr-primary/);
});
