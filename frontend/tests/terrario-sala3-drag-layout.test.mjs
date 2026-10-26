import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTeste, moverItemTeste, prepararPreviaCompletaSala3 } from '../src/terrario/modoTeste.js';
import { moverComDeslocamento } from '../src/terrario/dragPosition.js';
import { posicionarItemNaZona } from '../src/terrario/posicionamentoItens.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../src/terrario');
const tela=fs.readFileSync(path.join(root,'Terrario.jsx'),'utf8');
const catalogo=fs.readFileSync(path.join(root,'sala3Itens.js'),'utf8');
const itens = [
  {id:'s3_mesa',x:43,y:80,width:30,zone:'chao'},
  {id:'s3_lousa',x:29,y:43,width:24,zone:'parede'},
  {id:'s3_relogio',x:51,y:29,width:9,zone:'parede'},
  {id:'s3_mochila',x:22,y:84,width:13,zone:'chao'},
  {id:'s3_kit',x:53,y:68,width:7,zone:'chao'},
  {id:'s3_calendario',x:86,y:54,width:9,zone:'parede'},
  {id:'s3_painel',x:65,y:41,width:25,zone:'parede'},
  {id:'s3_tapete',x:44,y:85,width:41,zone:'tapete'}
];
const anterior={
  s3_mesa:[42,76],s3_lousa:[32,44],s3_relogio:[77,33],s3_mochila:[23,79],
  s3_kit:[81,80],s3_calendario:[77,50],s3_painel:[57,44],s3_tapete:[53,83]
};
const ler=(estado)=>lerTeste({getItem:()=>JSON.stringify(estado)}, 'test-sala3', itens);

test('Sala 3 fica editável na prévia temporária, inclusive sem entrar em Decorar sala',()=>{
  assert.match(tela,/terceiraConquistada: true,/);
  assert.match(tela,/modoTeste && salaDoItem\(itemId\) === 3/);
  assert.match(tela,/modoTeste && salaDoItem\(item\.id\) === 3/);
  assert.match(tela,/\(\(decorate && selectedRoom === 3\) \|\| modoTeste\) \? 'movable'/);
  assert.match(tela,/Sala 3 · Arraste os móveis/);
  assert.match(tela,/if \(decorate && !roomDetail\.conquistada\) setSelectedRoom\(1\)/);
});

test('nova distribuição é espaçada, respeita zonas e o backend',()=>{
 const model=fs.readFileSync(path.resolve(dir,'../../backend/models/terrarioModel.js'),'utf8');
 assert.equal(itens.length,8);
 for(const item of itens){
  assert.deepEqual(posicionarItemNaZona(item,item),{x:item.x,y:item.y});
  assert.match(catalogo,new RegExp(`id:'${item.id}'[^\\n]*width:${item.width}, x:${item.x}, y:${item.y}`));
  assert.match(model,new RegExp(`${item.id}: \\{ x: ${item.x}, y: ${item.y}, zona: '${item.zone}', sala: 3(?:, limites: \\{ xMax: 88(?:, yMax: 55)? \\})? \\}`));
 }
 assert.ok(itens.find(i=>i.id==='s3_mesa').width < 34);
 assert.ok(itens.find(i=>i.id==='s3_tapete').width < 45);
 assert.ok(itens.find(i=>i.id==='s3_kit').width < 15);
});

test('a composição anterior migra automaticamente, sem perder itens e escalas',()=>{
 const visiveis=itens.map(i=>i.id);
 const positions=Object.fromEntries(Object.entries(anterior).map(([k,[x,y]])=>[k,{x,y}]));
 const inicial=ler({layoutSala3Completo:true,visible:visiveis,positions,scales:{s3_mesa:1.2}});
 assert.deepEqual(inicial.visible,visiveis.filter(id=>id!=='s3_kit'));
 for(const item of itens) assert.deepEqual(inicial.positions[item.id],{x:item.x,y:item.y});
 assert.equal(inicial.scales.s3_mesa,1.2);
 assert.deepEqual(prepararPreviaCompletaSala3(inicial,itens),inicial);
});

test('personalizações manuais permanecem e cada peça pode ser arrastada independentemente',()=>{
 const estado=ler({layoutSala3Completo:true,visible:['s3_mesa','s3_tapete'],positions:{...Object.fromEntries(Object.entries(anterior).map(([id,[x,y]])=>[id,{x,y}])),s3_mesa:{x:52,y:72}},scales:{s3_mesa:1.3}});
 assert.deepEqual(estado.positions.s3_mesa,{x:52,y:72});
 assert.deepEqual(estado.positions.s3_tapete,{x:44,y:85});
 const destino=moverComDeslocamento(estado.positions.s3_mesa,90,-24,900,785,{xMin:14,xMax:86,yMin:56,yMax:86});
 const moved=moverItemTeste(estado,'s3_mesa',destino,itens);
 assert.notDeepEqual(moved.positions.s3_mesa,estado.positions.s3_mesa);
 assert.deepEqual(moved.positions.s3_tapete,estado.positions.s3_tapete);
 assert.equal(moved.scales.s3_mesa,1.3);
});
