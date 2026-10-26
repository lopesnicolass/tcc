import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogo = fs.readFileSync(path.join(raiz, 'src/terrario/sala3Itens.js'), 'utf8');
const modelo = fs.readFileSync(path.join(raiz, '../backend/models/terrarioModel.js'), 'utf8');
const migracao = fs.readFileSync(path.join(raiz, '../backend/config/ensureTerrario.js'), 'utf8');
const ids = [...catalogo.matchAll(/id:'(s3_[a-z_]+)'/g)].map((match) => match[1]);

test('Sala 3 tem oito itens PNG atuais e sete legados preservados', () => {
  assert.equal(ids.length, 15);
  assert.equal(new Set(ids).size, 15);
  const arquivos = [...catalogo.matchAll(/from '\.\/assets\/sala3\/([^']+\.(?:png|webp))'/g)].map((match) => match[1]);
  assert.equal(arquivos.length, 15);
  assert.equal(arquivos.filter((file) => file.endsWith('.png')).length, 8);
  for (const arquivo of arquivos) assert.ok(fs.statSync(path.join(raiz, 'src/terrario/assets/sala3', arquivo)).size > 1000);
  for (const id of ids) {
    assert.match(modelo, new RegExp(`\\b${id}: \\{`));
    assert.ok(migracao.includes(`('${id}',`));
  }
});

test('Sala 3 começa sem comprar móveis e é separada da Sala 2', () => {
  assert.equal(migracao.includes("INSERT INTO terrario_inventario(usuario_id,item_id) VALUES(1,'s3_"), false);
  assert.equal(ids.some((id) => id.startsWith('s2_')), false);
});
