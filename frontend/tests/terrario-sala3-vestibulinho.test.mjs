import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { posicaoPadraoCompat, lerTeste, baseTeste, moverItemTeste } from '../src/terrario/modoTeste.js';
import { construirJornada } from '../src/terrario/jornada.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const terrario = path.resolve(dir, '../src/terrario');
const ler = (nome) => fs.readFileSync(path.join(terrario, nome), 'utf8');
const catalogo = ler('sala3Itens.js');
const tela = ler('Terrario.jsx');
const modelo = fs.readFileSync(path.resolve(dir, '../../backend/models/terrarioModel.js'), 'utf8');
const item = {id:'s3_mesa',x:43,y:80,width:30,zone:'chao'};

test('a carteira aprovada permanece na sala 3 em PNG com transparência', () => {
  assert.match(catalogo, /carteira_vestibulinho\.png/);
  const file = path.join(terrario,'assets/sala3/carteira_vestibulinho.png');
  const b=fs.readFileSync(file);
  assert.equal(b.subarray(1,4).toString(), 'PNG');
  assert.equal(b[25],6, 'formato RGBA (com canal alfa)');
  assert.match(catalogo,/id:'s3_mesa'.*Carteira do Vestibulinho.*price:28.*width:30, x:43, y:80/);
  assert.match(catalogo,/export const ITEMS_SALA3_LEGADOS/);
  assert.doesNotMatch(catalogo.split('export const ITEMS_SALA3_LEGADOS')[0], /id:'s3_cadeira'/);
});

test('compras antigas continuam reconhecidas, mas protótipos antigos não aparecem para venda', () => {
  assert.match(tela,/ITEMS_SALA3_LEGADOS\.filter\(\(item\) => ownedInventory\.some/);
  assert.match(modelo,/s3_mesa: \{ x: 43, y: 80, zona: 'chao', sala: 3 \}/);
  assert.match(modelo,/s3_cadeira: \{/);
  assert.match(tela, /prepararPreviaCompletaSala3/);
});

test('posição antiga da mesa migra uma vez, mantendo ajustes manuais', () => {
  assert.deepEqual(posicaoPadraoCompat(item,{x:38,y:66}),item);
  assert.deepEqual(posicaoPadraoCompat(item,{x:47,y:72}),{x:47,y:72});
  const salvo=lerTeste({getItem:()=>JSON.stringify({visible:['s3_mesa','s3_cadeira'],positions:{s3_mesa:{x:38,y:66}}})},'sala3',[item]);
  assert.deepEqual(salvo.visible,['s3_mesa']);
  assert.deepEqual(salvo.positions.s3_mesa,{x:43,y:80});
  assert.deepEqual(moverItemTeste(baseTeste([item]),'s3_mesa',{x:52,y:68},[item]).positions.s3_mesa,{x:52,y:68});
});

test('nome da sala 3 é Desafio Final, mantendo desbloqueio e teto fechado', () => {
  const jornada=construirJornada({salaDesbloqueada:3,sessoesValidas:10});
  assert.equal(jornada.salas[2].nome,'Sala do Desafio Final');
  assert.match(tela,/Teto fechado/);
});
