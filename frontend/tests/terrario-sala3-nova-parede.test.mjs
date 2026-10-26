import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { posicaoPadraoCompat, lerTeste } from '../src/terrario/modoTeste.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const src=path.resolve(dir,'../src/terrario');
const cat=fs.readFileSync(path.join(src,'sala3Itens.js'),'utf8');
const model=fs.readFileSync(path.resolve(dir,'../../backend/models/terrarioModel.js'),'utf8');
const wall=[
 {id:'s3_lousa',img:'lousa_instrucoes.png',width:24,x:29,y:43},
 {id:'s3_painel',img:'painel_desempenho.png',width:25,x:65,y:41},
 {id:'s3_relogio',img:'relogio_prova.png',width:9,x:51,y:29},
 {id:'s3_calendario',img:'calendario_vestibulinho.png',width:9,x:86,y:54},
];
test('novas artes de parede são PNGs transparentes, independentes e com posições coerentes',()=>{
 for(const item of wall){
  const data=fs.readFileSync(path.join(src,'assets/sala3',item.img));
  assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.equal(data[25],6);
  assert.match(cat,new RegExp(`id:'${item.id}'[^\n]*width:${item.width}, x:${item.x}, y:${item.y}, zone:'parede'`));
  assert.ok(model.includes(`${item.id}: { x: ${item.x}, y: ${item.y}, zona: 'parede', sala: 3`));
 }
});
test('calendário fica à direita, as artes antigas são atualizadas e posições manuais preservadas',()=>{
 const cal=wall.find(item=>item.id==='s3_calendario');
 assert.ok(cal.x>=70);
 assert.deepEqual(posicaoPadraoCompat(cal,{x:78,y:50}),cal);
 assert.deepEqual(posicaoPadraoCompat(cal,{x:65,y:45}),{x:65,y:45});
 const stored={visible:wall.map(item=>item.id),positions:{
   s3_lousa:{x:30,y:48},s3_painel:{x:58,y:43},s3_relogio:{x:78,y:31},s3_calendario:{x:78,y:50}},scales:{s3_calendario:1.2}};
 const loaded=lerTeste({getItem:()=>JSON.stringify(stored)},'sala3',wall.map(i=>({...i,zone:'parede'})));
 for(const item of wall) assert.deepEqual(loaded.positions[item.id],{x:item.x,y:item.y});
 assert.equal(loaded.scales.s3_calendario,1.2);
});
