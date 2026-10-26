import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { construirJornada } from '../src/terrario/jornada.js';
import { salasVisiveisNoMapa } from '../src/terrario/mapaSalas.js';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/terrario/Terrario.css', import.meta.url), 'utf8');

test('botoes permitem mudar entre todas as salas liberadas no modo foco', () => {
  assert.match(jsx, /const salasParaNavegacao = jornada\.salas\.filter\(\(sala\) => decorate \|\| sala\.conquistada\)/);
  assert.match(jsx, /salasParaNavegacao\.map\(\(sala\) =>/);
  assert.match(jsx, /salasDoMapa\.map\(\(sala\) =>/);
  assert.match(jsx, /salasVisiveisNoMapa\(jornada\.salas, decorate, selectedRoom\)/);
  assert.match(jsx, /onClick=\{\(\) => setSelectedRoom\(sala\.numero\)\}/);
});

test('foco nao oferece mapa horizontal e decoracao conserva a piramide', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 3, sessoesValidas: 10 });
  assert.deepEqual(salasVisiveisNoMapa(salas, false, 3).map(s => s.numero), [3]);
  assert.deepEqual(salasVisiveisNoMapa(salas, true, 3).map(s => s.numero), [1, 2, 3]);
  assert.match(css, /\.terr-world-viewport\.is-individual \{[^}]*overflow:hidden/);
  assert.match(css, /\.terr-world-board\.is-piramide \{ width:1280px; height:1040px/);
});
