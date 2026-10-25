import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { limitesParaItem, posicionarItemNaZona, posicaoEncostada } from '../src/terrario/posicionamentoItens.js';
import { baseTeste, lerTeste, moverItemTeste } from '../src/terrario/modoTeste.js';

const mesa = { id:'s2_mesa', width:33, x:50, y:62, zone:'chao' };
const luzes = { id:'s2_luzes', width:29, x:49, y:20, zone:'pendurado' };
const planta = { id:'s2_planta', width:13, x:17, y:33, zone:'pendurado' };
const calendario = { id:'s2_calendario', width:14, x:72, y:35, zone:'parede' };
const estante = { id:'s2_estante', width:21, x:26, y:74, zone:'chao' };

const caminho = new URL('../src/terrario/', import.meta.url);
const modelo = fs.readFileSync(new URL('../../backend/models/terrarioModel.js', import.meta.url), 'utf8');
const catalogo = fs.readFileSync(new URL('./sala2Itens.js', caminho), 'utf8');
const componente = fs.readFileSync(new URL('./Terrario.jsx', caminho), 'utf8');
const css = fs.readFileSync(new URL('./Terrario.css', caminho), 'utf8');

test('cadeira avulsa removida da loja e do desenho, mas compras legadas preservadas', () => {
  assert.doesNotMatch(catalogo, /id:'s2_cadeira'/);
  assert.doesNotMatch(catalogo, /import cadeira2/);
  assert.match(modelo, /s2_cadeira: \{/);
  const id = 's2_cadeira';
  const sala = [mesa, luzes, planta];
  const passado = lerTeste({getItem:()=>JSON.stringify({iniciado:true,visible:[id,'s2_mesa'],positions:{s2_cadeira:{x:43,y:69},s2_mesa:{x:45,y:63}},layoutV4:true})}, 'sala2', sala);
  assert.deepEqual(passado.visible,['s2_mesa']);
  assert.deepEqual(passado.positions.s2_mesa,{x:45,y:63});
});

test('mesa sobe acima de 56 e luzes sobem acima de 26, no frontend e no backend', () => {
  assert.equal(limitesParaItem(mesa).yMin,43);
  assert.equal(limitesParaItem(luzes).yMin,12);
  assert.equal(limitesParaItem(planta).yMin,16);
  assert.equal(limitesParaItem(estante).yMin,56);
  assert.deepEqual(posicionarItemNaZona({x:50,y:45},mesa),{x:50,y:45});
  assert.deepEqual(posicionarItemNaZona({x:49,y:15},luzes),{x:49,y:15});
  assert.deepEqual(posicaoEncostada('s2_mesa'),{x:50,y:62});
  for (const id of ['s2_mesa','s2_luzes','s2_planta']) {
    assert.match(modelo, new RegExp(`${id}: \\{[^\\n]*limites: \\{ yMin:`));
  }
});

test('planta move-se para esquerda e calendário inclina apenas na sala 2', () => {
  assert.match(catalogo, /id:'s2_planta'[^\n]*x:17, y:33/);
  assert.match(css, /terr-world-room-2 \.terr-sala2-item\[data-item-id='s2_calendario'\][\s\S]*rotate\(9deg\)/);
  assert.match(componente, /data-item-id=\{item.id\}/);
});

test('prévia antiga migra somente posições padrão e respeita móveis arrastados', () => {
  const sala = [mesa, luzes, planta, calendario, estante];
  const anterior = {
    visible:sala.map(i=>i.id),
    positions:{s2_mesa:{x:50,y:65},s2_luzes:{x:49,y:26},s2_planta:{x:79,y:43},s2_calendario:{x:72,y:35},s2_estante:{x:35,y:73}},
    scales:{}, layoutV4:true,
  };
  const salvo=lerTeste({getItem:()=>JSON.stringify(anterior)},'sala2',sala);
  assert.deepEqual(salvo.positions.s2_mesa,{x:50,y:62});
  assert.deepEqual(salvo.positions.s2_luzes,{x:49,y:20});
  assert.deepEqual(salvo.positions.s2_planta,{x:17,y:33});
  assert.deepEqual(salvo.positions.s2_calendario,{x:72,y:35});
  assert.deepEqual(salvo.positions.s2_estante,{x:35,y:73});
  const noLimite = lerTeste({getItem:()=>JSON.stringify({...anterior,positions:{...anterior.positions,s2_mesa:{x:50,y:56}}})},'sala2',sala);
  assert.deepEqual(noLimite.positions.s2_mesa,{x:50,y:56},'quem já arrastou a mesa ao limite mantém a posição');
  const mexido=moverItemTeste(baseTeste(sala),'s2_luzes',{x:46,y:13},sala);
  assert.deepEqual(mexido.positions.s2_luzes,{x:46,y:13});
});
