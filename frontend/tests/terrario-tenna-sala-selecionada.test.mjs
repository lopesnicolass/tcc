import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('A Tenna aparece somente na sala selecionada nas três opções', () => {
  const tennaPorSala = /\{selectedRoom === sala\.numero && \(\s*<div className="terr-character" style=\{\{ zIndex: 68 \}\}><TennaAnt animar=\{animarTenna\} \/><\/div>\s*\)\}/g;
  assert.equal([...jsx.matchAll(tennaPorSala)].length, 3);
  assert.equal((jsx.match(/<TennaAnt animar=\{animarTenna\} \/>/g) ?? []).length, 3);
  assert.match(jsx, /salasDoMapa\.map\(\(sala\) =>/);
});

test('Tenna possui a mesma largura nas três salas e no mobile', () => {
  assert.match(css, /\.terr-character\s*\{[^}]*width:\s*29%/);
  assert.doesNotMatch(css, /\.terr-world-room-[123] \.terr-character\s*\{[^}]*width\s*:/);
  const mediasComTenna = [...css.matchAll(/@media[^{}]*\{[^{}]*\.terr-character\s*\{[^}]*width\s*:/g)];
  assert.equal(mediasComTenna.length, 0);
});

test('Selecionar salas não altera o modo de foco ou a decoração', () => {
  assert.match(jsx, /onClick=\{\(\) => setSelectedRoom\(sala\.numero\)\}/);
  assert.match(jsx, /const animarTenna = deveAnimarTenna\(status, decorate, remaining\)/);
  assert.match(jsx, /\{decorate && \(\s*<section className="terr-inventory"/);
});
