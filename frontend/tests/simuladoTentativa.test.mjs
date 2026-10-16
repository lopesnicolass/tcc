import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararTentativaPersistida } from '../src/utils/simuladoTentativa.js';

function armazenamento() {
  const dados = new Map();
  return {
    getItem: (key) => dados.get(key) ?? null,
    setItem: (key, valor) => dados.set(key, String(valor))
  };
}

test('reabrir e reenviar a mesma tentativa preservam seu identificador', () => {
  const local = armazenamento();
  let chamadas = 0;
  const gerar = () => `tentativa-${++chamadas}`;
  const inicial = prepararTentativaPersistida(local, 'usuario1_simulado8', false, gerar);
  assert.equal(prepararTentativaPersistida(local, 'usuario1_simulado8', false, gerar), inicial);
  assert.equal(chamadas, 1);
});

test('refazer simulado gera outra tentativa sem alterar outros simulados', () => {
  const local = armazenamento();
  let chamadas = 0;
  const gerar = () => `tentativa-${++chamadas}`;
  const anterior = prepararTentativaPersistida(local, 'usuario1_simulado8', false, gerar);
  const outro = prepararTentativaPersistida(local, 'usuario1_simulado9', false, gerar);
  const repeticao = prepararTentativaPersistida(local, 'usuario1_simulado8', true, gerar);
  assert.notEqual(anterior, repeticao);
  assert.equal(prepararTentativaPersistida(local, 'usuario1_simulado9', false, gerar), outro);
});
