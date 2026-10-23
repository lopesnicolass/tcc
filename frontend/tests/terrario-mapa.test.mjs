import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirJornada } from '../src/terrario/jornada.js';
import { salasVisiveisNoMapa, formatoMapa } from '../src/terrario/mapaSalas.js';

test('no modo foco aparece apenas a sala inicial quando nenhuma outra foi liberada', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 0 });
  assert.deepEqual(salasVisiveisNoMapa(salas, false).map(sala => sala.numero), [1]);
  assert.equal(formatoMapa(salasVisiveisNoMapa(salas, false)), 'individual');
});

test('no modo decorar, a pirâmide mostra as três salas e mantém duas bloqueadas', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 1 });
  const visiveis = salasVisiveisNoMapa(salas, true);
  assert.deepEqual(visiveis.map(sala => sala.numero), [1, 2, 3]);
  assert.deepEqual(visiveis.filter(sala => !sala.conquistada).map(sala => sala.numero), [2, 3]);
  assert.equal(formatoMapa(visiveis), 'piramide');
});

test('ao conquistar a sala 2, as duas salas ficam visíveis no modo foco', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 2, sessoesValidas: 5 });
  const visiveis = salasVisiveisNoMapa(salas, false);
  assert.deepEqual(visiveis.map(sala => sala.numero), [1, 2]);
  assert.equal(formatoMapa(visiveis), 'base');
});

test('a sala 3 não surge antes de existir o desbloqueio real no servidor', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 6, sessoesValidas: 100 });
  assert.deepEqual(salasVisiveisNoMapa(salas, false).map(sala => sala.numero), [1, 2]);
});
