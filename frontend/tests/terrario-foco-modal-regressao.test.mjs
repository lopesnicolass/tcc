import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');
const backend = readFileSync(new URL('../../backend/models/terrarioModel.js', import.meta.url), 'utf8');

test('sessão ativa impede decoração e mantém cronômetro acessível', () => {
  assert.match(jsx, /if \(!active\) return;\s*setDecorate\(false\);\s*setDrag\(null\);/);
  assert.match(jsx, /if \(active && !decorate\) return;/);
  assert.match(jsx, /if \(action === 'iniciar' \|\| action === 'continuar'\) setDecorate\(false\);/);
  assert.match(jsx, /!decorate && <aside className="terr-sidebar">/);
});

test('alternar decoração troca cronômetro pelo catálogo, mantendo botão de retorno', () => {
  assert.match(jsx, /\{decorate && \(\s*<section className="terr-inventory"/);
  assert.match(jsx, /✓ Concluir decoração/);
  assert.match(jsx, /onClick=\{alternarDecoracao\}/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-layout\s*\{/);
});

test('foco envia duração selecionada e matéria livre aceita pelo servidor', () => {
  assert.match(jsx, /materia\s*,\s*duracao:\s*duration/);
  assert.match(backend, /'Estudo livre'/);
  assert.match(jsx, /onClick=\{\(\) => \{ void sendAction\('iniciar'\); \}\}/);
  assert.match(jsx, /onClick=\{\(\) => \{ void sendAction\('pausar'\); \}\}/);
  assert.match(jsx, /onClick=\{\(\) => \{ void sendAction\('continuar'\); \}\}/);
});
