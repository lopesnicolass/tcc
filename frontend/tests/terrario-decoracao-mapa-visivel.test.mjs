import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('modo decoração utiliza as mesmas proporções dos cards do modo normal', () => {
  assert.match(css, /\.terr-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.93fr\)\s+minmax\(330px,\s*\.87fr\)/);
  assert.match(css, /@media \(min-width:\s*1021px\)\s*\{\s*\.terr-page\.is-decorating \.terr-layout\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1\.93fr\)\s+minmax\(330px,\s*\.87fr\)/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-inventory\s*\{\s*align-self:\s*stretch;\s*max-height:\s*730px;\s*height:\s*100%/);
});

test('pirâmide ocupa a largura do card sem ficar minúscula por limite de altura', () => {
  assert.match(jsx, /const larguraUtil = Math.max\(0, viewport.clientWidth - 20\)/);
  assert.match(jsx, /Math.min\(1, larguraUtil \/ mapaDimensoes\.largura\)/);
  assert.doesNotMatch(jsx, /const escalaAltura|const alturaMapa|Math.min\(560, window.innerHeight/);
  assert.match(jsx, /observer\.observe\(viewport\)/);
  assert.match(jsx, /height: `\$\{Math.ceil\(mapaDimensoes.altura \* zoomDecoracao\) \+ 8\}px`/);
  assert.match(jsx, /transform: `scale\(\$\{zoomDecoracao\}\)`/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-world-viewport\.is-fitted\s*\{\s*overflow:\s*hidden;/);
});

test('foco e editor continuam exclusivos e responsivos', () => {
  assert.match(jsx, /\{!decorate && <aside className="terr-sidebar">/);
  assert.match(jsx, /\{decorate && \(\s*<section className="terr-inventory"/);
  assert.match(css, /@media \(min-width: 821px\) and \(max-width: 1020px\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\);/);
});

test('cabecalho azul fica visivel ao decorar e mapa nao encolhe a 440px', () => {
  assert.match(css, /\.terr-page\.is-decorating \.terr-header\s*\{\s*display:\s*flex;/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-header h1/);
  assert.doesNotMatch(jsx, /Math\.min\(440, alturaDisponivel\)/);
  assert.match(jsx, /larguraUtil \/ mapaDimensoes\.largura/);
});
