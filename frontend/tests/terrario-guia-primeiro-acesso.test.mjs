import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const guia = readFileSync(new URL('../src/terrario/GuiaTerrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('guia tem quatro passos com foco, sementes, decoracao e desbloqueio', () => {
  assert.match(guia, /Estude com a Tenna/);
  assert.match(guia, /Ganhe sementes/);
  assert.match(guia, /Monte seu cantinho/);
  assert.match(guia, /Descubra novas salas/);
  assert.match(guia, /5 sessões válidas/);
  assert.match(guia, /10 para liberar Prova/);
  assert.match(guia, /pelo menos 15 minutos/);
});

test('guia aparece na primeira visita, registra conclusao e pode reabrir', () => {
  assert.match(jsx, /import GuiaTerrario, \{ chaveGuiaTerrario \}/);
  assert.match(guia, /tenna_terrario_guia_v1_/);
  assert.match(jsx, /if \(loading \|\| !snapshot \|\| verificouPrimeiraVisitaRef\.current\) return/);
  assert.match(jsx, /localStorage\.getItem\(chaveGuia\)/);
  assert.match(jsx, /localStorage\.setItem\(chaveGuia, '1'\)/);
  assert.match(jsx, /className="terr-guide-trigger" onClick=\{abrirGuia\}/);
  assert.match(jsx, /guiaAberto && <GuiaTerrario/);
});

test('guia nao interrompe sessoes em andamento ou pausadas', () => {
  assert.match(jsx, /if \(status === 'running' \|\| status === 'paused'\) return/);
  assert.match(jsx, /disabled=\{status === 'running'\}/);
});

test('guia e acessivel por teclado e nao mexe na logica do terrario', () => {
  assert.match(guia, /role="dialog" aria-modal="true"/);
  assert.match(guia, /if \(evento\.key === 'Escape'\)/);
  assert.match(guia, /evento\.key !== 'Tab'/);
  assert.match(guia, /Pular guia/);
  assert.match(guia, /Próximo/);
  assert.match(guia, /Voltar/);
  assert.match(guia, /Entendi!/);
  assert.match(css, /\.terr-guide-backdrop/);
  assert.match(css, /@media \(max-width: 570px\)/);
});
