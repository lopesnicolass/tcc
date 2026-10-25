import test from 'node:test';
import assert from 'node:assert/strict';
import { limitesParaItem, posicionarItemNaZona, posicaoEncostada } from '../src/terrario/posicionamentoItens.js';
import { baseTeste, moverItemTeste, redimensionarItemTeste, lerTeste } from '../src/terrario/modoTeste.js';

const guardaRoupa = { id:'guarda_roupa', width:27, x:59, y:51, zone:'chao' };
const cama = { id:'cama', width:31, x:31, y:68, zone:'chao' };

test('o guarda-roupa é maior, inicia mais alto e tem limite superior próprio', () => {
  assert.deepEqual(posicaoEncostada('guarda_roupa'), { x:59, y:51 });
  assert.equal(limitesParaItem(guardaRoupa).yMin, 42);
  assert.equal(limitesParaItem(cama).yMin, 56);
  assert.deepEqual(posicionarItemNaZona({ x:59, y:49 }, guardaRoupa), { x:59, y:49 });
  assert.deepEqual(posicionarItemNaZona({ x:59, y:10 }, guardaRoupa), { x:59, y:42 });
  assert.deepEqual(posicionarItemNaZona({ x:31, y:49 }, cama), { x:31, y:56 });
});

test('movimento e redimensionamento em modo de teste permitem subir sem mexer nos demais móveis', () => {
  const itens = [guardaRoupa, cama];
  let estado = baseTeste(itens);
  assert.deepEqual(estado.positions.guarda_roupa, { x:59, y:51 });
  estado = moverItemTeste(estado, 'guarda_roupa', { x:61, y:44 }, itens);
  estado = redimensionarItemTeste(estado, 'guarda_roupa', 1.3, itens);
  assert.deepEqual(estado.positions.guarda_roupa, { x:61, y:44 });
  assert.deepEqual(estado.positions.cama, { x:31, y:68 });
  const salvo = lerTeste({ getItem: () => JSON.stringify(estado) }, 'previsualizacao', itens);
  assert.deepEqual(salvo.positions.guarda_roupa, { x:61, y:44 });
});
