import test from 'node:test';
import assert from 'node:assert/strict';
import { baseTeste, lerTeste, alternarItemTeste, moverItemTeste, redimensionarItemTeste } from '../src/terrario/modoTeste.js';

const itens = [
  { id:'mesa', x:50, y:61, zone:'chao' },
  { id:'quadro', x:50, y:36, zone:'parede' },
  { id:'cama', x:30, y:70, zone:'chao' }
];

test('modo teste começa com os móveis já equipados, sem mudar inventário', () => {
  const inv = [{id:'mesa', equipado:true, x:54, y:64},{id:'quadro', equipado:false}];
  const copia = structuredClone(inv);
  const base = baseTeste(itens, inv);
  assert.deepEqual(base.visible, ['mesa']);
  assert.deepEqual(base.positions.mesa, {x:54, y:64});
  assert.deepEqual(inv, copia);
});

test('posiciona e remove móveis nunca comprados, sem usar sementes', () => {
  const base = baseTeste(itens);
  const comCama = alternarItemTeste(base,'cama');
  assert.deepEqual(comCama.visible,['cama']);
  assert.deepEqual(alternarItemTeste(comCama,'cama').visible,[]);
});

test('move objetos de teste, mantendo restrição entre parede e chão', () => {
  const base = alternarItemTeste(baseTeste(itens), 'quadro');
  const movido = moverItemTeste(base,'quadro',{x:99,y:99},itens);
  assert.deepEqual(movido.positions.quadro, {x:78,y:50});
  assert.deepEqual(base.positions.quadro,{x:50,y:36});
});

test('recarrega dados válidos e ignora posições malformadas e itens inválidos', () => {
  const store = {getItem:()=>JSON.stringify({visible:['cama','hacker'],positions:{cama:{x:999,y:999},mesa:{x:'ruim',y:50}}})};
  const dados = lerTeste(store,'chave',itens);
  assert.deepEqual(dados.visible, ['cama']);
  assert.deepEqual(dados.positions.cama, {x:88,y:86});
  assert.deepEqual(dados.positions.mesa, {x:50,y:61});
  assert.equal(lerTeste({getItem:()=>'{'} ,'chave',itens).iniciado,false);
});

test('modo livre: escala de cada item é independente, limitada e recarregável', () => {
  let modo = baseTeste(itens);
  modo = redimensionarItemTeste(modo, 'mesa', 1.4, itens);
  modo = redimensionarItemTeste(modo, 'cama', 3, itens);
  assert.equal(modo.scales.mesa, 1.4);
  assert.equal(modo.scales.cama, 1.5);
  assert.equal(modo.scales.quadro, 1);
  const salvo = lerTeste({ getItem: () => JSON.stringify(modo) }, 'chave', itens);
  assert.equal(salvo.scales.mesa, 1.4);
  assert.equal(salvo.scales.cama, 1.5);
  assert.equal(lerTeste({ getItem: () => JSON.stringify({ ...modo, scales:{mesa:0} }) }, 'chave', itens).scales.mesa, 0.6);
  assert.deepEqual(redimensionarItemTeste(modo, 'invalid', 1.5, itens), modo);
});

test('deco antiga: reposiciona somente mesa e prateleira nos padrões anteriores', () => {
  const atuais = [
    { id: 'mesa', x:50, y:56, width:27, zone:'chao' },
    { id: 'prateleira', x:26, y:36, width:25, zone:'parede' },
  ];
  const velha = {visible:['mesa','prateleira'],positions:{ mesa:{x:50,y:61},prateleira:{x:27,y:39}}};
  const lido=lerTeste({getItem:()=>JSON.stringify(velha)},'teste',atuais);
  assert.deepEqual(lido.positions.mesa,{x:50,y:56});
  assert.deepEqual(lido.positions.prateleira,{x:26,y:36});
  const custom = { ...velha, positions:{mesa:{x:53,y:62},prateleira:{x:30,y:40}} };
  const mantido=lerTeste({getItem:()=>JSON.stringify(custom)},'teste',atuais);
  assert.deepEqual(mantido.positions.mesa,{x:53,y:62});
  assert.deepEqual(mantido.positions.prateleira,{x:30,y:40});
});

// A troca da ilustração da cadeira não deve mexer em decoração personalizada.
test('migração do padrão da cadeira e estante na Sala 2 preserva posições manuais', async () => {
  const { posicaoPadraoCompat } = await import('../src/terrario/modoTeste.js');
  assert.deepEqual(posicaoPadraoCompat({ id: 's2_cadeira', x:36, y:73 }, { x:50, y:75 }), { id:'s2_cadeira', x:36, y:73 });
  assert.deepEqual(posicaoPadraoCompat({ id: 's2_estante', x:76, y:68 }, { x:74, y:63 }), { id:'s2_estante', x:76, y:68 });
  assert.deepEqual(posicaoPadraoCompat({ id: 's2_cadeira', x:36, y:73 }, { x:48, y:77 }), { x:48, y:77 });
});
