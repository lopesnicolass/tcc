const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let DatabaseSync;
try { ({ DatabaseSync } = require('node:sqlite')); } catch { /* Node antigo: pular integração SQLite */ }

if (!DatabaseSync) {
  test('Integração SQLite requer Node com node:sqlite', { skip: true }, () => {});
} else {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE usuarios (id INTEGER PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0,
      streak INTEGER DEFAULT 0, last_active_date TEXT);
    CREATE TABLE simulados(id INTEGER PRIMARY KEY);
    CREATE TABLE resultados(id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL, simulado_id INTEGER,
      acertos INTEGER, erros INTEGER, total_questoes INTEGER, porcentagem REAL,
      tentativa_id TEXT, detalhes_json TEXT,
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id));
    CREATE UNIQUE INDEX idx_resultados_tentativa_unica ON resultados(usuario_id,tentativa_id);
    CREATE TABLE xp_eventos(usuario_id INTEGER, action TEXT, data TEXT, quantidade INTEGER);
    CREATE TABLE xp_eventos_verificados(id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL,
      action TEXT NOT NULL, referencia TEXT NOT NULL, data TEXT NOT NULL, quantidade INTEGER NOT NULL,
      UNIQUE(usuario_id,action,referencia),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id));
    INSERT INTO usuarios(id) VALUES(1),(2);
    INSERT INTO simulados(id) VALUES(10);`);

  // Executa o gatilho escrito no código real, não uma reprodução do SQL.
  const origem = fs.readFileSync(path.join(__dirname, '../config/ensureXP.js'), 'utf8');
  const ddl = origem.match(/db\.run\(`(CREATE TRIGGER IF NOT EXISTS trg_xp_verificado_saldo[\s\S]*?)`\);/);
  assert.ok(ddl, 'Gatilho de XP não encontrado no projeto');
  sqlite.exec(ddl[1]);

  const fakeDb = {
    run(sql, valores, callback) {
      try {
        const info = sqlite.prepare(sql).run(...valores);
        callback.call({ changes: Number(info.changes), lastID: Number(info.lastInsertRowid) }, null);
      } catch (err) { callback.call({}, err); }
    },
    get(sql, valores, callback) {
      try { callback(null, sqlite.prepare(sql).get(...valores)); }
      catch (err) { callback(err); }
    }
  };
  const dbPath = require.resolve('../config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };
  const { concederXPVerificado } = require('../services/xpService');
  const { criarResultado } = require('../models/resultadoModel');

  function xp(usuario, acao, ref) {
    let saida;
    concederXPVerificado(usuario, acao, ref, (erro, pontos) => { saida = { erro, pontos }; });
    return saida;
  }
  function resultado(tentativaId, respostas) {
    let saida;
    const detalhes = [{ questaoId: 99, respostaUsuario: respostas, respostaCorreta: 'A', acertou: respostas === 'A' }];
    criarResultado(1, 10, respostas === 'A' ? 1 : 0, respostas === 'A' ? 0 : 1,
      1, respostas === 'A' ? 100 : 0,
      { tentativaId, detalhes },
      (erro, dados) => { saida = { erro, dados }; });
    return saida;
  }

  test('resultado reenviado mantém o mesmo ID e a mesma pontuação registrada', () => {
    const chave = 'a3a3a3a3-2b2b-4c4c-8d8d-e5e5e5e5e5e5';
    const primeiro = resultado(chave, 'A');
    assert.equal(primeiro.erro, null);
    assert.equal(primeiro.dados.duplicado, false);
    const repetido = resultado(chave, 'A');
    assert.equal(repetido.erro, null);
    assert.equal(repetido.dados.duplicado, true);
    assert.equal(repetido.dados.lastID, primeiro.dados.lastID);
    assert.equal(repetido.dados.registro.acertos, 1);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM resultados').get().n, 1);
    assert.equal(xp(1, 'simulado_concluido', primeiro.dados.lastID).pontos, 50);
    assert.equal(xp(1, 'simulado_concluido', repetido.dados.lastID).pontos, 0);
    assert.equal(sqlite.prepare('SELECT xp FROM usuarios WHERE id=1').get().xp, 50);
  });

  test('nova tentativa permite novo resultado, mas cada referência concede uma vez', () => {
    const tentativa = resultado('b4b4b4b4-2b2b-4c4c-8d8d-e5e5e5e5e5e5', 'B');
    assert.equal(tentativa.dados.duplicado, false);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM resultados').get().n, 2);
    assert.equal(xp(1, 'simulado_concluido', tentativa.dados.lastID).pontos, 50);
    assert.equal(xp(1, 'simulado_concluido', tentativa.dados.lastID).pontos, 0);
    assert.equal(sqlite.prepare('SELECT xp FROM usuarios WHERE id=1').get().xp, 100);
  });

  test('limite diário impede ganhar XP além de cinco simulados e dez post-its', () => {
    for (let i=200; i<210; i++) xp(1, 'simulado_concluido', i);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM xp_eventos_verificados WHERE usuario_id=1 AND action=?').get('simulado_concluido').n, 5);
    for (let i=1; i<13; i++) xp(1, 'novo_postit', i);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM xp_eventos_verificados WHERE usuario_id=1 AND action=?').get('novo_postit').n, 10);
    assert.equal(sqlite.prepare('SELECT xp FROM usuarios WHERE id=1').get().xp, 350);
  });

  test('erro na atualização do saldo desfaz o evento inteiro', () => {
    sqlite.exec('CREATE TRIGGER bloquear_xp BEFORE UPDATE OF xp ON usuarios WHEN NEW.id=2 BEGIN SELECT RAISE(ABORT, "indisponivel"); END;');
    const tentativa = xp(2, 'novo_postit', 88);
    assert.ok(tentativa.erro);
    assert.equal(sqlite.prepare('SELECT xp FROM usuarios WHERE id=2').get().xp, 0);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM xp_eventos_verificados WHERE usuario_id=2').get().n, 0);
    sqlite.exec('DROP TRIGGER bloquear_xp');
  });

  test('rejeita identificadores inválidos e mantém sequências coerentes', () => {
    assert.ok(xp(0, 'novo_postit', 1).erro);
    assert.ok(xp(1, 'novo_postit', 0).erro);
    assert.ok(xp(1, 'qualquer', 1).erro);
    const dados = sqlite.prepare('SELECT streak,last_active_date FROM usuarios WHERE id=1').get();
    assert.equal(dados.streak, 1);
    assert.match(dados.last_active_date, /^\d{4}-\d\d-\d\d$/);
  });
}
