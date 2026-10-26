import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirJornada } from '../src/terrario/jornada.js';
import { salasVisiveisNoMapa, formatoMapa } from '../src/terrario/mapaSalas.js';

const numeros = (salas) => salas.map((sala) => sala.numero);

test('modo foco mostra somente o Ninho Inicial antes dos desbloqueios', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 0 });
  const visiveis = salasVisiveisNoMapa(salas, false, 1);
  assert.deepEqual(numeros(visiveis), [1]);
  assert.equal(formatoMapa(visiveis), 'individual');
});

test('modo foco mostra uma sala por vez depois que todas foram liberadas', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 3, sessoesValidas: 10 });
  for (const numero of [1, 2, 3]) {
    const visiveis = salasVisiveisNoMapa(salas, false, numero);
    assert.deepEqual(numeros(visiveis), [numero]);
    assert.equal(formatoMapa(visiveis), 'individual');
  }
});

test('modo foco nao renderiza sala bloqueada selecionada na decoracao', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 1 });
  assert.deepEqual(numeros(salasVisiveisNoMapa(salas, false, 3)), [1]);
});

test('modo decorar exibe as tres salas em piramide, incluindo bloqueadas', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 1 });
  const visiveis = salasVisiveisNoMapa(salas, true, 1);
  assert.deepEqual(numeros(visiveis), [1, 2, 3]);
  assert.deepEqual(numeros(visiveis.filter((sala) => !sala.conquistada)), [2, 3]);
  assert.equal(formatoMapa(visiveis), 'piramide');
});

test('sair da decoracao deixa apenas a sala 2 escolhida em foco', () => {
  const { salas } = construirJornada({ salaDesbloqueada: 3, sessoesValidas: 10 });
  assert.equal(formatoMapa(salasVisiveisNoMapa(salas, true, 2)), 'piramide');
  assert.deepEqual(numeros(salasVisiveisNoMapa(salas, false, 2)), [2]);
});
