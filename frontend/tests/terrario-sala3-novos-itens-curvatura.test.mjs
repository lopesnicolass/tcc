import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { posicaoPadraoCompat, lerTeste } from '../src/terrario/modoTeste.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../src/terrario');
const catalog=readFileSync(path.join(root,'sala3Itens.js'),'utf8');
const css=readFileSync(path.join(root,'Terrario.css'),'utf8');
const backend=readFileSync(path.resolve(root,'../../../backend/models/terrarioModel.js'),'utf8');
const items=[
  ['s3_mesa','carteira_vestibulinho.png',30,43,80,'chao'],
  ['s3_lousa','lousa_instrucoes.png',24,29,43,'parede'],
  ['s3_relogio','relogio_prova.png',9,51,29,'parede'],
  ['s3_mochila','mochila_tenna.png',13,22,84,'chao'],
  ['s3_kit','kit_prova.png',7,53,68,'chao'],
  ['s3_calendario','calendario_vestibulinho.png',9,86,54,'parede'],
  ['s3_painel','painel_desempenho.png',25,65,41,'parede'],
  ['s3_tapete','tapete_desafio.png',41,44,85,'tapete']
];
test('oito novos desenhos RGBA mantêm os mesmos IDs, categorias e coordenadas no servidor',()=>{
  for(const [id,img,width,x,y,zone] of items){
    const bytes=readFileSync(path.join(root,'assets/sala3',img));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes[25],6);
    assert.match(catalog,new RegExp(`id:'${id}'[^\n]*width:${width}, x:${x}, y:${y}, zone:'${zone}'`));
    assert.ok(backend.includes(`${id}: { x: ${x}, y: ${y}, zona: '${zone}', sala: 3`));
  }
  assert.match(css,/s3_painel'\] \{\s*transform: translate\(-50%, -90%\) rotate\(0deg\)/);
});
test('o painel migra do padrão antigo para a parede direita sem alterar posições manuais',()=>{
  const quadro={id:'s3_painel',width:25,x:65,y:41,zone:'parede'};
  assert.deepEqual(posicaoPadraoCompat(quadro,{x:59,y:39}),quadro);
  assert.deepEqual(posicaoPadraoCompat(quadro,{x:72,y:43}),{x:72,y:43});
  const saved={visible:['s3_painel'],positions:{s3_painel:{x:59,y:39}},scales:{s3_painel:1.2}};
  const restored=lerTeste({getItem:()=>JSON.stringify(saved)},'test',[quadro]);
  assert.deepEqual(restored.positions.s3_painel,{x:65,y:41});
  assert.equal(restored.scales.s3_painel,1.2);
});
