import test from 'node:test';
import assert from 'node:assert/strict';
import { moverComDeslocamento, passouDoLimiteArrasto } from '../src/terrario/dragPosition.js';

test('um clique ou leve movimento não inicia o arrasto', () => {
  assert.equal(passouDoLimiteArrasto(100, 100, 100, 100), false);
  assert.equal(passouDoLimiteArrasto(100, 100, 104, 103), false);
  assert.equal(passouDoLimiteArrasto(100, 100, 106, 100), true);
});

test('deslocamento preserva o ponto de origem do objeto em diferentes resoluções', () => {
  const partida = { x: 59, y: 82 };
  assert.deepEqual(moverComDeslocamento(partida, 10, 0, 500, 500), { x: 61, y: 82 });
  assert.deepEqual(moverComDeslocamento(partida, 10, 0, 250, 250), { x: 63, y: 82 });
  assert.deepEqual(moverComDeslocamento(partida, 0, 0, 250, 250), partida);
});

test('móveis não saem da faixa definida do ninho', () => {
  assert.deepEqual(moverComDeslocamento({ x: 30, y: 78 }, -900, 900, 400, 400), { x: 12, y: 86 });
  assert.deepEqual(moverComDeslocamento({ x: 30, y: 78 }, 900, -900, 400, 400), { x: 88, y: 56 });
  assert.equal(moverComDeslocamento({ x: 30, y: 78 }, 2, 5, 0, 400), null);
});

test('posicionamento respeita limites da parede durante o arrasto', async () => {
  const { limitesItem, posicionarNaZona } = await import('../src/terrario/posicionamentoItens.js');
  const limite = limitesItem('parede');
  assert.deepEqual(moverComDeslocamento({ x: 50, y: 38 }, 1000, -1000, 500, 500, limite), { x: 78, y: 26 });
  assert.deepEqual(posicionarNaZona({ x: 50, y: 77 }, 'parede'), { x: 50, y: 50 });
  assert.deepEqual(posicionarNaZona({ x: 40, y: 12 }, 'tapete'), { x: 40, y: 66 });
});

test('posições de encostar na parede e limites da escala', async () => {
  const { posicaoEncostada, ajustarEscala } = await import('../src/terrario/posicionamentoItens.js');
  assert.deepEqual(posicaoEncostada('mesa'), {x:50, y:56});
  assert.deepEqual(posicaoEncostada('prateleira'), {x:26, y:36});
  assert.equal(posicaoEncostada('banquinho'), null);
  assert.equal(ajustarEscala(2), 1.5);
  assert.equal(ajustarEscala(-1), 0.6);
  assert.equal(ajustarEscala(1.26), 1.3);
});

test('móvel ampliado preserva bordas laterais do cenário', async () => {
  const { limitesParaItem, posicionarItemNaZona } = await import('../src/terrario/posicionamentoItens.js');
  const item={id:'cama',width:31,zone:'chao'};
  const lim=limitesParaItem(item,1.5);
  assert.equal(lim.xMin, 25.25);
  assert.equal(lim.xMax, 74.75);
  assert.deepEqual(posicionarItemNaZona({x:88,y:70},item,1.5),{x:74.75,y:70});
});
