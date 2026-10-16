// Testes de consultas SQL do ranking sem acessar o banco de usuários.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const source = fs.readFileSync(path.join(__dirname, '..', 'models', 'rankingModel.js'), 'utf8');

function sqlDaFuncao(nome) {
  const inicio = source.indexOf(`function ${nome}(`);
  assert.ok(inicio >= 0, `Função ${nome} deve existir no modelo.`);
  const trecho = source.slice(inicio);
  const consulta = trecho.match(/db\.(?:all|get|run)\(\s*`([\s\S]*?)`/);
  assert.ok(consulta, `Consulta SQL não localizada em ${nome}.`);
  return consulta[1];
}

let db;
beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY, nome TEXT NOT NULL, tipo TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      foto_perfil_dados BLOB, foto_perfil_tipo TEXT
    );
    CREATE TABLE ranking_participantes (
      usuario_id INTEGER PRIMARY KEY,
      participando INTEGER NOT NULL DEFAULT 0 CHECK(participando IN (0, 1)),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    );
  `);
  const ins = db.prepare('INSERT INTO usuarios (id, nome, tipo, xp) VALUES (?, ?, ?, ?)');
  [
    [1, 'Aluno A', 'aluno', 900],
    [2, 'Aluno B', 'aluno', 600],
    [3, 'Aluno C', 'aluno', 600],
    [4, 'Aluno D', 'aluno', 800],
    [5, 'Administrador', 'admin', 9000]
  ].forEach(row => ins.run(...row));
});
afterEach(() => db.close());

function participar(id, ativo = true) {
  db.prepare(sqlDaFuncao('atualizarParticipacao')).run(ativo ? 1 : 0, id);
}

test('ranking ordena XP e desempata por ID; exibe no máximo três', () => {
  for (let id = 1; id <= 5; id++) participar(id);
  const linhas = db.prepare(sqlDaFuncao('listarTop3')).all();
  assert.deepEqual(linhas.map(x => x.id), [1, 4, 2]);
  assert.equal(linhas.length, 3);
});

test('colocação individual considera quem está fora do Top 3', () => {
  [1, 2, 3, 4].forEach(id => participar(id));
  const query = db.prepare(sqlDaFuncao('buscarPosicaoParticipante'));
  assert.equal(query.get(3).posicao, 4);
  assert.equal(query.get(2).posicao, 3);
  assert.equal(query.get(1).posicao, 1);
});

test('ranking mostra apenas alunos com participação habilitada', () => {
  participar(2);
  participar(5);
  assert.deepEqual(db.prepare(sqlDaFuncao('listarTop3')).all().map(x => x.id), [2]);
});

test('aluno pode sair do ranking', () => {
  participar(1);
  participar(1, false);
  assert.deepEqual(db.prepare(sqlDaFuncao('listarTop3')).all(), []);
});

test('foto depende de participação voluntária', () => {
  db.prepare('UPDATE usuarios SET foto_perfil_dados = ?, foto_perfil_tipo = ? WHERE id = 1')
    .run(Buffer.from('imagem-ficticia'), 'image/png');
  const consulta = db.prepare(sqlDaFuncao('buscarFotoParticipante'));
  assert.equal(consulta.get(1), undefined);
  participar(1);
  const foto = consulta.get(1);
  assert.deepEqual(Buffer.from(foto.dados), Buffer.from('imagem-ficticia'));
  assert.equal(foto.tipo, 'image/png');
  participar(1, false);
  assert.equal(consulta.get(1), undefined);
});

test('conta administrativa não participa do ranking', () => {
  participar(5);
  const qtd = db.prepare('SELECT COUNT(*) AS total FROM ranking_participantes WHERE usuario_id = 5').get();
  assert.equal(qtd.total, 0);
});

test('consulta de participação reflete estado de adesão', () => {
  const consulta = db.prepare(sqlDaFuncao('buscarParticipacao'));
  assert.equal(consulta.get(1).participando, 0);
  participar(1);
  assert.equal(consulta.get(1).participando, 1);
});
