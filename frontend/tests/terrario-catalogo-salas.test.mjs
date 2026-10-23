import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distribuirMoveis, ehMovelDeEstudoAntigo, MOVEIS_ESTUDO_ANTIGOS } from '../src/terrario/catalogoSalas.js';

const antigos = ['vasinho', 'mesa', 'banquinho', 'luminaria', 'cama', 'prateleira', 'quadro', 'estante', 'lampiao', 'bau', 'tapete', 'mesa_redonda', 'almofada', 'banquinho_tronco'].map(id => ({ id }));
const novos = ['s2_mesa', 's2_cadeira', 's2_estante', 's2_mural', 's2_calendario', 's2_globo', 's2_puff', 's2_planta', 's2_luzes', 's2_caixa','s2_tapete_redondo','s2_vaso','s2_livros','s2_avisos'].map(id => ({ id }));

test('sala 1 vende apenas 9 itens de descanso a usuários novos, sala 2 tem 14 de estudo', () => {
  const result = distribuirMoveis(antigos, novos, [], true);
  assert.equal(result.sala1.length, 9);
  assert.equal(result.sala2.length, 14);
  assert.equal(result.sala1.some(({ id }) => ehMovelDeEstudoAntigo(id)), false);
  assert.ok(result.sala1.some(({ id }) => id === 'cama'));
  assert.ok(result.sala2.some(({ id }) => id === 's2_mesa'));
  assert.equal(new Set([...result.sala1, ...result.sala2].map(item => item.id)).size, 23);
});

test('móveis já comprados não desaparecem quando a sala 2 ainda está bloqueada', () => {
  const purchased = [{ id:'mesa', equipado:true, x:45, y:66 }, { id:'estante', equipado:true, x:75, y:68 }];
  const result = distribuirMoveis(antigos, novos, purchased, false);
  assert.deepEqual(result.sala1.filter(item => ehMovelDeEstudoAntigo(item.id)).map(item => item.id), ['mesa','estante']);
  assert.equal(result.salaPorId.mesa, 1);
  assert.equal(result.sala2.some(item => ehMovelDeEstudoAntigo(item.id)), false);
});

test('ao liberar sala 2 itens antigos adquiridos acompanham usuário, sem duplicar ou mudar IDs', () => {
  const purchased = MOVEIS_ESTUDO_ANTIGOS.map(id => ({ id, equipado: true, escala: 1.3 }));
  const result = distribuirMoveis(antigos, novos, purchased, true);
  assert.equal(result.sala1.length, 9);
  assert.equal(result.sala2.length, 19);
  for (const id of MOVEIS_ESTUDO_ANTIGOS) {
    assert.equal(result.salaPorId[id], 2);
    assert.equal(result.sala1.some(item => item.id === id), false);
    assert.equal(result.sala2.filter(item => item.id === id).length, 1);
  }
  assert.equal(new Set([...result.sala1, ...result.sala2].map(item=>item.id)).size, 28);
});

test('itens de estudo antigos não comprados não aparecem nas lojas nem são dados de graça', () => {
  const result = distribuirMoveis(antigos, novos, [{ id:'vasinho', equipado:true }], false);
  assert.equal(result.sala1.length, 9);
  assert.equal(result.sala2.length, 14);
  assert.equal(result.salaPorId.mesa, undefined);
});
