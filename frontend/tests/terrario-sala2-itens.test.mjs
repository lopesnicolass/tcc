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

test('Sala 2 tem 14 móveis exclusivos com imagens novas e valores oficiais', () => {
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  const importedAssets = [...catalogo.matchAll(/from '\.\/assets\/sala2\/([^']+\.webp)'/g)].map(m=>m[1]);
  assert.equal(importedAssets.length,14);
  for (const asset of importedAssets) assert.ok(fs.statSync(path.join(raiz,'src/terrario/assets/sala2',asset)).size > 1000, asset);
  for (const id of ids) {
    assert.match(modelo,new RegExp(`\\b${id}: \\{`));
    assert.ok(migracao.includes(`('${id}',`), `${id} precisa de preço oficial`);
  }
});

test('Sala 2 começa sem nenhum item concedido automaticamente', () => {
  assert.equal(/INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+terrario_inventario[^`]*'s2_/im.test(migracao),false);
});

test('cadeira usa mesma coluna da escrivaninha e estante tem formato alto', () => {
  assert.match(catalogo, /id:'s2_cadeira'[^\n]*x:36, y:73/);
  assert.match(catalogo, /id:'s2_mesa'[^\n]*x:36, y:66/);
  for (const id of ['s2_tapete_redondo','s2_vaso','s2_livros','s2_avisos']) assert.ok(ids.includes(id));
});
