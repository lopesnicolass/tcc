import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('decoração integra catálogo como coluna da página sem janela modal', () => {
  assert.doesNotMatch(jsx, /terr-decor-backdrop|terr-decor-dialog|aria-modal|document\.body\.style\.overflow/);
  assert.match(jsx, /<div className="terr-layout">/);
  const inicio = jsx.indexOf('<div className="terr-layout">');
  const fim = jsx.indexOf('</main>', inicio);
  const conteudo = jsx.slice(inicio, fim);
  assert.match(conteudo, /!decorate && <aside className="terr-sidebar">/);
  assert.match(conteudo, /\{decorate && \(\s*<section className="terr-inventory"/);
  assert.ok(conteudo.indexOf('terr-sidebar') < conteudo.indexOf('terr-inventory'));
  assert.match(css, /\.terr-page\.is-decorating \.terr-layout\s*\{/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-inventory\s*\{/);
  assert.doesNotMatch(css, /\.terr-decor-dialog|\.terr-decor-backdrop/);
});

test('em decoração continuam os móveis, a navegação entre salas e controles de tamanho', () => {
  assert.match(jsx, /className="terr-decor-quick-actions"/);
  assert.match(jsx, /onClick=\{preencherSalaTeste\}/);
  assert.match(jsx, /onClick=\{limparSalaTeste\}/);
  assert.match(jsx, /terr-size-toolbar/);
  assert.match(jsx, /terr-world-room-buttons/);
  assert.match(jsx, /✓ Concluir decoração/);
  assert.match(css, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
});

test('editor remove conteúdo redundante sem alterar o fundo terra', () => {
  assert.match(css, /\.terr-page\.is-decorating \.terr-header\s*\{\s*display:\s*none/);
  assert.doesNotMatch(jsx, /terr-overview-grid|terr-focus-ritual|terr-inventory-foot|terr-world-footnote/);
  assert.match(css, /\.terr-page \.terr-scene-shell\s*\{\s*background:\s*linear-gradient\([^;]*#dfb98e/);
});
