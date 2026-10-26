import test from 'node:test';
import assert from 'node:assert/strict';
import { montarAmbienteSala3, lerTeste } from '../src/terrario/modoTeste.js';
import { readFileSync } from 'node:fs';

const itens = [
  { id:'s3_mesa', x:43, y:80, width:30, zone:'chao' },
  { id:'s3_lousa', x:29, y:43, width:24, zone:'parede' },
  { id:'s3_relogio', x:51, y:29, width:9, zone:'parede' },
  { id:'s3_mochila', x:22, y:84, width:13, zone:'chao' },
  { id:'s3_kit', x:53, y:68, width:7, zone:'chao' },
  { id:'s3_calendario', x:86, y:54, width:9, zone:'parede' },
  { id:'s3_painel', x:65, y:41, width:25, zone:'parede' },
  { id:'s3_tapete', x:44, y:85, width:41, zone:'tapete' },
];

test('Montar ambiente evita o kit duplicado e distribui relógio e calendário', () => {
  const velho = { iniciado: true, visible:['s3_kit','s3_mesa'], positions:{s3_mesa:{x:67,y:72}, s3_calendario:{x:51,y:45}}, scales:{s3_mesa:1.4}, layoutSala3Completo:true };
  const resultado = montarAmbienteSala3(velho, itens);
  assert.equal(resultado.visible.includes('s3_kit'), false);
  assert.equal(resultado.visible.length, 7);
  assert.deepEqual(resultado.positions.s3_relogio, {x:51,y:29});
  assert.deepEqual(resultado.positions.s3_calendario, {x:86,y:54});
  assert.deepEqual(resultado.positions.s3_mesa, {x:43,y:80});
  assert.equal(resultado.scales.s3_mesa, 1);
  assert.deepEqual(velho.positions.s3_mesa, {x:67,y:72});
});

test('Posições da versão anterior migram; posições deliberadamente alteradas não', () => {
  const salvo = { visible:['s3_relogio','s3_calendario'], positions:{s3_relogio:{x:82,y:31},s3_calendario:{x:82,y:51}} };
  const restaurado = lerTeste({getItem:()=>JSON.stringify(salvo)}, 'sala3', itens);
  assert.deepEqual(restaurado.positions.s3_relogio, {x:51,y:29});
  assert.deepEqual(restaurado.positions.s3_calendario, {x:86,y:54});
  const editado={...salvo,positions:{s3_relogio:{x:48,y:32},s3_calendario:{x:71,y:48}}};
  const mantido=lerTeste({getItem:()=>JSON.stringify(editado)},'sala3',itens);
  assert.deepEqual(mantido.positions.s3_relogio, editado.positions.s3_relogio);
  assert.deepEqual(mantido.positions.s3_calendario, editado.positions.s3_calendario);
});

test('Botão Montar ambiente usa a montagem sem kit duplicado',()=>{
  const tela=readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url),'utf8');
  assert.match(tela, /selectedRoom === 3 \? montarAmbienteSala3\(atual, ITEMS_SALA3\)/);
});
