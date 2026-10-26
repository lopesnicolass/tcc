import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseTeste, lerTeste, prepararPreviaCompletaSala3 } from '../src/terrario/modoTeste.js';
const dir = path.dirname(fileURLToPath(import.meta.url));
const terrario = path.resolve(dir, '../src/terrario');
const catalogo = fs.readFileSync(path.join(terrario,'sala3Itens.js'),'utf8');
const modelo = fs.readFileSync(path.resolve(dir, '../../backend/models/terrarioModel.js'),'utf8');
const migracao = fs.readFileSync(path.resolve(dir, '../../backend/config/ensureTerrario.js'),'utf8');

const itens = [
  ['s3_mesa','carteira_vestibulinho.png',43,80,'chao'],
  ['s3_lousa','lousa_instrucoes.png',29,43,'parede'],
  ['s3_relogio','relogio_prova.png',51,29,'parede'],
  ['s3_mochila','mochila_tenna.png',22,84,'chao'],
  ['s3_kit','kit_prova.png',53,68,'chao'],
  ['s3_calendario','calendario_vestibulinho.png',86,54,'parede'],
  ['s3_painel','painel_desempenho.png',65,41,'parede'],
  ['s3_tapete','tapete_desafio.png',44,85,'tapete'],
];
const itensMock = itens.map(([id, , x, y, zone])=>({id,x,y,zone,width:14}));

test('oito itens individuais e PNGs RGBA estão disponíveis no novo catálogo da Sala 3', () => {
  const novos = catalogo.split('export const ITEMS_SALA3 = [')[1].split('];')[0];
  assert.equal((novos.match(/id:'s3_/g) || []).length, 8);
  for (const [id,img,x,y,zone] of itens) {
    assert.match(novos, new RegExp(`id:'${id}'`));
    assert.match(catalogo, new RegExp(`assets/sala3/${img.replace(/\./g,'\\.')}`));
    const buffer=fs.readFileSync(path.join(terrario,'assets/sala3',img));
    assert.equal(buffer.subarray(1,4).toString(),'PNG',img);
    assert.equal(buffer[25], 6,`${img} usa canal alfa RGBA`);
    assert.match(modelo, new RegExp(`${id}: \\{ x: ${x}, y: ${y}, zona: '${zone}', sala: 3(?:, limites: \\{ xMax: 88(?:, yMax: 55)? \\})? \\}`));
    assert.match(migracao, new RegExp(`\\('${id}',\\d+\\)`), `preço oficial de ${id}`);
  }
});

test('IDs antigos equivalentes são reaproveitados, móveis substituídos não são duplicados',()=>{
  const novos = catalogo.split('export const ITEMS_SALA3 = [')[1].split('];')[0];
  const legados = catalogo.split('export const ITEMS_SALA3_LEGADOS = [')[1];
  for (const id of ['s3_painel','s3_calendario','s3_tapete']) {
    assert.match(novos,new RegExp(`id:'${id}'`));
    assert.doesNotMatch(legados,new RegExp(`id:'${id}'`));
  }
  assert.match(legados, /id:'s3_cadeira'/);
  assert.match(legados, /id:'s3_estante'/);
});

test('versão antiga de prévia recebe móveis novos uma vez e conserva ajustes', () => {
  const antigos={iniciado:true,visible:['s3_mesa','s3_cadeira'],positions:{s3_mesa:{x:40,y:70}},scales:{s3_mesa:1.3}};
  const migrado=prepararPreviaCompletaSala3(antigos,itensMock);
  assert.equal(migrado.layoutSala3Completo,true);
  assert.equal(new Set(migrado.visible).size,8);
  assert.deepEqual(migrado.positions.s3_mesa,{x:40,y:70});
  assert.equal(migrado.scales.s3_mesa,1.3);
  const removido={...migrado,visible:migrado.visible.filter((id)=>id!=='s3_kit')};
  assert.equal(prepararPreviaCompletaSala3(removido,itensMock), removido);
  const recuperado=lerTeste({getItem:()=>JSON.stringify(removido)},'chave',itensMock);
  assert.equal(recuperado.layoutSala3Completo,true);
  assert.equal(recuperado.visible.includes('s3_kit'),false);
  const estado=baseTeste(itensMock);
  assert.equal(prepararPreviaCompletaSala3(estado,itensMock).visible.length,7);
});

test('posições padrão antigas de painel e calendário migram sem alterar personalizações',()=>{
  const salvo=lerTeste({getItem:()=>JSON.stringify({ visible:['s3_painel','s3_calendario'], positions:{s3_painel:{x:46,y:35},s3_calendario:{x:67,y:36}}})},'chave',itensMock);
  assert.deepEqual(salvo.positions.s3_painel,{x:65,y:41});
  assert.deepEqual(salvo.positions.s3_calendario,{x:86,y:54});
  const personalizado=lerTeste({getItem:()=>JSON.stringify({ visible:['s3_painel'],positions:{s3_painel:{x:60,y:42}}})},'chave',itensMock);
  assert.deepEqual(personalizado.positions.s3_painel,{x:60,y:42});
});
