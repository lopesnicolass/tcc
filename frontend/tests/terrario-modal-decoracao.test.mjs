import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('modo decoração reúne cenário e catálogo na mesma janela modal', () => {
  assert.match(jsx, /terr-decor-backdrop/);
  assert.match(jsx, /decorate \? 'terr-decor-dialog' : 'terr-main-content'/);
  assert.match(jsx, /aria-modal=\{decorate \? 'true' : undefined\}/);
  assert.match(jsx, /terr-decor-dialog-title/);
  assert.match(jsx, /terr-decor-close/);
  assert.match(css, /\.terr-page \.terr-decor-dialog\s*\{/);
  assert.match(css, /\.terr-page \.terr-decor-dialog \.terr-layout\s*\{/);
  assert.match(css, /\.terr-page \.terr-decor-dialog \.terr-inventory\s*\{/);
});

test('editor funciona em telas estreitas e mantém ferramentas de teste acessíveis', () => {
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(jsx, /className="terr-decor-quick-actions"/);
  assert.match(jsx, /onClick=\{preencherSalaTeste\}/);
  assert.match(jsx, /onClick=\{limparSalaTeste\}/);
  assert.match(jsx, /event\.key === 'Escape'/);
});

test('a área externa da toca usa tons de terra também fora do editor', () => {
  assert.match(css, /\.terr-page \.terr-scene-shell\s*\{\s*background:\s*linear-gradient\([^;]*#dfb98e/);
  assert.match(css, /\.terr-page \.terr-world-viewport/);
});
