import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('mantém o cabeçalho azul ao iniciar o foco', () => {
  assert.match(jsx, /<header className="terr-header">/);
  assert.match(css, /\.terr-page\.is-focusing \.terr-header\s*\{\s*display:\s*flex/);
  assert.doesNotMatch(css, /\.terr-page\.is-focusing \.terr-header\s*,/);
});
test('não há segundo cronômetro sobre a Tenna', () => {
  assert.doesNotMatch(jsx, /className="terr-inroom-timer"/);
  assert.match(jsx, /className="terr-timer-ring-progress"/);
  assert.match(jsx, /strokeDashoffset=\{ringOffset\}/);
});
test('presets e ajuste livre aparecem só antes da sessão, duração ativa é apenas informativa', () => {
  assert.match(jsx, /!active && status !== 'completed' \? \(/);
  assert.match(jsx, /className="terr-duration-setup"/);
  assert.match(jsx, /className="terr-duration-session"/);
  assert.match(jsx, /DURACOES_RAPIDAS\.map/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(duration \+ 1\)/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(duration - 1\)/);
});
test('confirmação substitui ações sem abrir painel adicional', () => {
  assert.match(jsx, /className="terr-timer-buttons terr-confirm-actions"/);
  assert.match(jsx, /Voltar ao foco/);
  assert.match(jsx, /Sim, encerrar/);
  assert.match(jsx, /className="terr-focus-one-status is-warning"/);
  assert.doesNotMatch(jsx, /className="terr-confirm-cancel"/);
});
