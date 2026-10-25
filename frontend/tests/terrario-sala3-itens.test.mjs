import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogo = fs.readFileSync(path.join(raiz,'src/terrario/sala3Itens.js'),'utf8');
const modelo = fs.readFileSync(path.join(raiz,'../backend/models/terrarioModel.js'),'utf8');
const migracao = fs.readFileSync(path.join(raiz,'../backend/config/ensureTerrario.js'),'utf8');
const ids = [...catalogo.matchAll(/id:'(s3_[a-z_]+)'/g)].map(m=>m[1]);

test('Sala 3 possui onze móveis com IDs próprios, sprites presentes e preços no servidor', () => {
  assert.equal(ids.length, 11);
  assert.equal(new Set(ids).size, 11);
  const arquivos = [...catalogo.matchAll(/from '\.\/assets\/sala3\/([^']+\.webp)'/g)].map(m=>m[1]);
  assert.equal(arquivos.length, 11);
  for (const arquivo of arquivos) assert.ok(fs.statSync(path.join(raiz,'src/terrario/assets/sala3',arquivo)).size > 1000);
  for (const id of ids) {
    assert.match(modelo, new RegExp(`\\b${id}: \\{`));
    assert.ok(migracao.includes(`('${id}',`));
  }
});

test('Sala 3 começa vazia e é separada da Sala 2', () => {
  assert.equal(migracao.includes("INSERT INTO terrario_inventario(usuario_id,item_id) VALUES(1,'s3_"), false);
  assert.equal(ids.some(id => id.startsWith('s2_')), false);
});
