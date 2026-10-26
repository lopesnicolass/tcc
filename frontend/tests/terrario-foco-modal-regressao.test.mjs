import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');
const backend = readFileSync(new URL('../../backend/models/terrarioModel.js', import.meta.url), 'utf8');

test('sessão ativa fecha o editor modal e devolve acesso ao cronômetro', () => {
  assert.match(jsx, /if \(!active\) return;\s*setDecorate\(false\);\s*setDrag\(null\);/);
  assert.match(jsx, /if \(active && !decorate\) return;/);
  assert.match(jsx, /if \(action === 'iniciar' \|\| action === 'continuar'\) setDecorate\(false\);/);
});

test('janela de decoração tem botão explícito para retornar ao foco', () => {
  assert.match(jsx, /terr-decor-header-actions/);
  assert.match(jsx, /terr-decor-to-focus/);
  assert.match(jsx, /Ir para o foco/);
  assert.match(css, /\.terr-decor-to-focus\s*\{/);
});

test('foco envia duração selecionada e matéria livre aceita pelo servidor', () => {
  assert.match(jsx, /materia\s*,\s*duracao:\s*duration/);
  assert.match(backend, /'Estudo livre'/);
  assert.match(jsx, /onClick=\{\(\) => \{ void sendAction\('iniciar'\); \}\}/);
  assert.match(jsx, /onClick=\{\(\) => \{ void sendAction\('pausar'\); \}\}/);
  assert.match(jsx, /onClick=\{\(\) => \{ void sendAction\('continuar'\); \}\}/);
});
