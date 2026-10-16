import test from 'node:test';
import assert from 'node:assert/strict';
import { lerPrazoSalvo, pausarPrazo, retomarPrazo, lerSegundosSalvos } from '../src/utils/simuladoCronometro.js';

function storage(conteudo = {}) { return { getItem: (chave) => Object.hasOwn(conteudo, chave) ? conteudo[chave] : null }; }

test('prazo ausente não significa simulado com tempo esgotado', () => {
    assert.ok(Number.isNaN(lerPrazoSalvo(storage({}), 'simulado-42')));
    assert.ok(Number.isNaN(lerPrazoSalvo(storage({ 'simulado-42': '' }), 'simulado-42')));
});
test('prazo salvo preservado na retomada de simulado', () => {
    assert.equal(lerPrazoSalvo(storage({ prazo: '1800000000000' }), 'prazo'), 1800000000000);
    assert.equal(lerPrazoSalvo(storage({ prazo: '0' }), 'prazo'), 0);
});
test('prazo inválido não gera tempo negativo ou infinito', () => {
    for (const prazo of ['abc', '-30', 'Infinity']) assert.ok(Number.isNaN(lerPrazoSalvo(storage({ prazo }), 'prazo')));
});


function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
}

test('tempo fica congelado ao sair do simulado, mesmo horas depois', () => {
  const store = memoryStorage();
  const inicio = 1_800_000_000_000;
  assert.equal(retomarPrazo(store, 'prazo', 'saldo', 600, inicio), 600);
  assert.equal(pausarPrazo(store, 'prazo', 'saldo', inicio + 120_000), 480);
  assert.equal(store.getItem('prazo'), null);
  assert.equal(lerSegundosSalvos(store, 'saldo'), 480);
  assert.equal(retomarPrazo(store, 'prazo', 'saldo', 600, inicio + 5 * 3600_000), 480);
  assert.equal(store.getItem('saldo'), null);
  assert.equal(pausarPrazo(store, 'prazo', 'saldo', inicio + 5 * 3600_000 + 20_000), 460);
});

test('sair duas vezes nao altera o saldo; simulado terminado nao herda pausa', () => {
  const store = memoryStorage();
  retomarPrazo(store, 'prazo', 'saldo', 300, 100_000);
  pausarPrazo(store, 'prazo', 'saldo', 160_000);
  assert.equal(pausarPrazo(store, 'prazo', 'saldo', 999_000), 240);
  store.removeItem('saldo');
  store.removeItem('prazo');
  assert.equal(retomarPrazo(store, 'prazo', 'saldo', 300, 999_000), 300);
});

test('cronometro zerado permanece zerado ao retomar (nao reinicia)', () => {
  const store = memoryStorage();
  retomarPrazo(store, 'prazo', 'saldo', 60, 100_000);
  assert.equal(pausarPrazo(store, 'prazo', 'saldo', 180_000), 0);
  assert.equal(retomarPrazo(store, 'prazo', 'saldo', 60, 200_000), 0);
});
