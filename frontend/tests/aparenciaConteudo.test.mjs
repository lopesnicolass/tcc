import test from 'node:test';
import assert from 'node:assert/strict';
import { APARENCIA_PADRAO, normalizarAparencia, obterPaleta, TEMAS_CONTEUDO } from '../src/utils/aparenciaConteudo.js';

test('páginas existentes usam layout padrão', () => {
  assert.deepEqual(normalizarAparencia('{}'), APARENCIA_PADRAO);
  assert.deepEqual(normalizarAparencia('not-json'), APARENCIA_PADRAO);
});

test('paleta é restrita às quatro escolhas do administrador', () => {
  assert.equal(TEMAS_CONTEUDO.length, 4);
  assert.equal(normalizarAparencia({ tema: 'custom-css' }).tema, 'azul');
  assert.equal(obterPaleta({ tema: 'verde' }).id, 'verde');
});

test('página personalizada recupera formato e índice', () => {
  const p = normalizarAparencia(JSON.stringify({ tema: 'coral', formato: 'cartoes', minutos: 15, mostrarIndice: false, mensagem: 'Revisar!' }));
  assert.equal(p.formato, 'cartoes');
  assert.equal(p.tema, 'coral');
  assert.equal(p.minutos, 15);
  assert.equal(p.mostrarIndice, false);
});
