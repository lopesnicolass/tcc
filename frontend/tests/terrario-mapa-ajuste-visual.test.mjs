import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('decoracao adapta o mapa ao espaco horizontal em vez de cortar as salas', () => {
  assert.match(jsx, /zoomDecoracao/);
  assert.match(jsx, /larguraUtil\s*\/\s*mapaDimensoes\.largura/);
  assert.match(jsx, /ResizeObserver\(ajustarZoom\)/);
  assert.match(jsx, /transform:\s*`scale\(\$\{zoomDecoracao\}\)`/);
  assert.match(jsx, /height:\s*`\$\{mapaDimensoes\.altura\s*\*\s*zoomDecoracao\}px`/);
});

test('o mapa em decoracao nao oferece rolagem dupla nem rouba movimento dos moveis', () => {
  assert.match(jsx, /if \(decorate \|\| evt\.pointerType/);
  assert.match(jsx, /if \(decorate\) return;/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-world-viewport\.is-fitted\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.terr-page\.is-decorating \.terr-world-fit\s*\{/);
});

test('modo normal continua exibindo a sala individual num tamanho responsivo', () => {
  assert.match(css, /\.terr-page:not\(\.is-decorating\) \.terr-world-board\.is-individual\s*\{[^}]*70vh/);
  assert.match(css, /@media \(max-width:\s*560px\)/);
  assert.match(jsx, /!decorate && !previaLiberada && !jornada\.terceiraConquistada/);
});
