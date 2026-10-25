import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lerTeste } from '../src/terrario/modoTeste.js';
const dir = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(dir,'../src/terrario');
const catalogo=readFileSync(path.join(base,'sala3Itens.js'),'utf8');
const estilos=readFileSync(path.join(base,'Terrario.css'),'utf8');
const tela=readFileSync(path.join(base,'Terrario.jsx'),'utf8');
const itens = ['lousa_instrucoes.png','painel_desempenho.png','relogio_prova.png','calendario_vestibulinho.png','carteira_vestibulinho.png','mochila_tenna.png','kit_prova.png','tapete_desafio.png'];

test('todos os oito novos móveis continuam imagens individuais com transparência',()=>{
 for(const name of itens){
  const bytes=readFileSync(path.join(base,'assets/sala3',name));
  assert.equal(bytes.subarray(1,4).toString(),'PNG',name);
  assert.equal(bytes[25],6,`${name} precisa de transparência RGBA`);
 }
});

test('quadros e calendário acompanham a parede sem bloquear seu arraste',()=>{
 assert.match(tela,/data-item-id=\{item\.id\} data-zona=\{item\.zone\}/);
 for(const id of ['s3_lousa','s3_painel','s3_relogio','s3_calendario']) {
  assert.match(estilos,new RegExp(`\\.terr-world-room-3 \\.terr-scene-item\\[data-item-id="${id}"\\]`));
 }
 assert.match(estilos,/data-item-id="s3_calendario"\]\s*\{\s*transform: translate\(-50%, -90%\) rotate\(9deg\)/);
});

test('kit migra da posição antiga e pode ser colocado sobre a carteira',()=>{
 assert.match(catalogo,/id:'s3_kit'[^\n]*width:7, x:53, y:68/);
 assert.match(tela,/item\.id === 's3_kit' \? 86/);
 const kit={id:'s3_kit',width:7,x:53,y:68,zone:'chao'};
 const saved=lerTeste({getItem:()=>JSON.stringify({visible:['s3_kit'],positions:{s3_kit:{x:62,y:85}},scales:{s3_kit:1.2}})},'test',[kit]);
 assert.deepEqual(saved.positions.s3_kit,{x:53,y:68});
 assert.equal(saved.scales.s3_kit,1.2);
 const moved=lerTeste({getItem:()=>JSON.stringify({visible:['s3_kit'],positions:{s3_kit:{x:44,y:74}}})},'test',[kit]);
 assert.deepEqual(moved.positions.s3_kit,{x:44,y:74});
});
