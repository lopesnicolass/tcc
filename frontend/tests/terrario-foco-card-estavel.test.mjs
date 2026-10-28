import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('não mostra aviso da sessão encerrada ao voltar ao estado inicial', () => {
  assert.doesNotMatch(jsx, /Sessão encerrada\. Suas conquistas anteriores foram preservadas/);
  assert.match(jsx, /setNotice\(''\);/);
  assert.doesNotMatch(jsx, /: notice \? \(/);
  assert.match(jsx, /\(confirmCancel && active \|\| status === 'completed' \|\| status === 'paused'\)/);
});

test('cabeçalho, anel e controles ficam em faixas de tamanho estável', () => {
  assert.match(jsx, /className="terr-timer-heading"/);
  assert.match(css, /grid-template-rows:\s*auto minmax\(185px, 1fr\) 198px/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1\.93fr\) minmax\(330px, \.87fr\)/);
  assert.match(css, /\.terr-page\.is-focusing \.terr-layout/);
  assert.match(css, /\.terr-page:not\(\.is-decorating\) \.terr-focus-controls/);
  assert.match(css, /grid-row:\s*3/);
  assert.match(css, /width:\s*190px/);
});

test('preserva a lógica de duração e a confirmação de encerramento', () => {
  assert.match(jsx, /DURACOES_RAPIDAS\.map/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(duration \+ 1\)/);
  assert.match(jsx, /ajustarDuracaoEscolhida\(duration - 1\)/);
  assert.match(jsx, /sendAction\('pausar'\)/);
  assert.match(jsx, /sendAction\('continuar'\)/);
  assert.match(jsx, /sendAction\('cancelar'\)/);
});
