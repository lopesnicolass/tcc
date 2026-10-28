import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('seletor de salas está dentro do viewport do ninho e não acima do cenário', () => {
  const inicioShell = jsx.indexOf('<div className="terr-scene-shell">');
  const inicioViewport = jsx.indexOf('terr-world-viewport is-', inicioShell);
  const inicioMenu = jsx.indexOf('<nav className="terr-world-toolbar"', inicioShell);
  const inicioMapa = jsx.indexOf('terr-world-board is-', inicioShell);
  assert.ok(inicioShell !== -1 && inicioViewport > inicioShell);
  assert.ok(inicioMenu > inicioViewport && inicioMenu < inicioMapa);
  assert.match(jsx, /aria-label={`Sala \${sala\.numero}: \${sala\.nome}/);
  assert.match(jsx, /aria-pressed={selectedRoom === sala\.numero}/);
});

test('seletor compacto destaca sala ativa e preserva três destinos', () => {
  assert.match(jsx, /sala\.numero === 1 \? 'Ninho' : sala\.numero === 2 \? 'Estudos' : 'Prova'/);
  assert.match(css, /\.terr-page \.terr-world-room-buttons button\.active\s*\{/);
  assert.match(css, /\.terr-page \.terr-world-toolbar,[\s\S]*?position:\s*absolute/);
  assert.match(css, /@media \(max-width: 410px\)/);
});

test('faixa marrom externa e viewport usam o mesmo fundo e sem bordas extras', () => {
  const trecho = css.slice(css.indexOf('/* Navegação integrada ao cenário:'));
  assert.match(trecho, /\.terr-page \.terr-scene-shell,[\s\S]*?background:\s*#b47d54/);
  assert.match(trecho, /\.terr-page \.terr-world-viewport,[\s\S]*?border:\s*0;[\s\S]*?background:\s*#b47d54/);
});
