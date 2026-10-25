import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogo = fs.readFileSync(path.join(raiz,'src/terrario/sala2Itens.js'),'utf8');
const modelo = fs.readFileSync(path.join(raiz,'../backend/models/terrarioModel.js'),'utf8');
const migracao = fs.readFileSync(path.join(raiz,'../backend/config/ensureTerrario.js'),'utf8');
const ids = [...catalogo.matchAll(/id:'(s2_[a-z_]+)'/g)].map(m=>m[1]);

test('Sala 2 usa 13 PNGs independentes, sem cadeira avulsa', () => {
  assert.equal(ids.length, 13);
  assert.equal(new Set(ids).size, 13);
  const importedAssets = [...catalogo.matchAll(/from '\.\/assets\/sala2\/([^']+\.png)'/g)].map(m=>m[1]);
  assert.equal(importedAssets.length, 13);
  for (const asset of importedAssets) {
    const img = fs.readFileSync(path.join(raiz,'src/terrario/assets/sala2',asset));
    assert.ok(img.length > 1000, asset);
    assert.deepEqual([...img.subarray(0,8)], [137,80,78,71,13,10,26,10], `${asset} precisa ser PNG válido`);
  }
  assert.doesNotMatch(catalogo, /\.webp/);
  for (const id of ids) {
    assert.match(modelo, new RegExp(`\\b${id}: \\{`));
    assert.ok(migracao.includes(`('${id}',`), `${id} precisa de preço oficial`);
  }
});

test('Sala 2 começa sem nenhum item concedido automaticamente', () => {
  assert.equal(/INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+terrario_inventario[^`]*'s2_/im.test(migracao),false);
});

test('mesa tem cadeira encaixada; estante cresceu e planta pendurada foi incluída', () => {
  assert.match(catalogo, /id:'s2_mesa'[^\n]*width:33, x:50, y:62/);
  assert.match(catalogo, /id:'s2_estante'[^\n]*width:21, x:26, y:74/);
  assert.match(catalogo, /id:'s2_planta'[^\n]*zone:'pendurado'/);
  assert.match(catalogo, /planta_pendente2\.png/);
  const featured = catalogo.match(/export const DESTAQUES_SALA2 = Object\.freeze\(\[([\s\S]*?)\]\)/)?.[1];
  assert.ok(featured);
  assert.ok(featured.includes('s2_planta'));
  assert.ok(!featured.includes('s2_cadeira'), 'a cadeira já faz parte da escrivaninha por padrão');
  assert.ok(!ids.includes('s2_cadeira'), 'a cadeira solta não aparece na loja nem no cenário');
  assert.match(modelo, /s2_cadeira: \{/, 'compras legadas permanecem no banco');
});
