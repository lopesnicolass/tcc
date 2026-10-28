import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');
test('15, 25 e 45 minutos disponíveis e ajustáveis com + e -', () => {
  assert.match(jsx, /DURACOES_RAPIDAS = \[15, 25, 45\]/);
  assert.match(jsx, /DURACOES_RAPIDAS\.map/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(minutes\)/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(duration - 1\)/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(duration \+ 1\)/);
  assert.match(jsx, /disabled=\{!podeEditarDuracao\}/);
  assert.match(jsx, /aria-pressed=\{currentDuration === minutes\}/);
});
test('status e aviso ocupam apenas uma região com confirmação compacta', () => {
  assert.match(jsx, /className="terr-focus-status-slot" aria-live="polite"/);
  assert.match(jsx, /confirmCancel && active \? \(/);
  assert.match(jsx, /Encerrar agora\? Esta sessão não receberá recompensas\./);
  assert.match(jsx, /status === 'completed' \? \(/);
  assert.match(jsx, /className="terr-focus-one-status"/);
  assert.doesNotMatch(jsx, /className="terr-inline-notice"/);
  assert.match(css, /\.terr-page \.terr-focus-controls \.terr-timer-buttons/);
  assert.match(css, /\.terr-page \.terr-focus-status-slot/);
});
test('preserva animação de progresso e integração com servidor', () => {
  assert.match(jsx, /strokeDashoffset=\{ringOffset\}/);
  assert.match(jsx, /setNotice\(action === 'cancelar'/);
  assert.match(jsx, /duracao: duration/);
  assert.match(jsx, /sendAction\('continuar'\)/);
  assert.match(jsx, /sendAction\('pausar'\)/);
});
