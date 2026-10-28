const db = require('../config/db');

function garantirTabela(callback) {
  db.run(`CREATE TABLE IF NOT EXISTS planos_pessoais (
    usuario_id INTEGER PRIMARY KEY,
    configuracao TEXT NOT NULL,
    salvo_em INTEGER NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`, callback);
}

function buscar(usuarioId, callback) {
  garantirTabela((erro) => {
    if (erro) return callback(erro);
    db.get('SELECT configuracao, salvo_em FROM planos_pessoais WHERE usuario_id = ?',
      [usuarioId], callback);
  });
}

function salvar(usuarioId, configuracao, salvoEm, callback) {
  garantirTabela((erro) => {
    if (erro) return callback(erro);
    db.run(`INSERT INTO planos_pessoais (usuario_id, configuracao, salvo_em)
      VALUES (?, ?, ?) ON CONFLICT(usuario_id) DO UPDATE SET
      configuracao = excluded.configuracao, salvo_em = excluded.salvo_em
      WHERE excluded.salvo_em >= planos_pessoais.salvo_em`,
      [usuarioId, JSON.stringify(configuracao), salvoEm], function (erroSalvar) {
        if (erroSalvar) return callback(erroSalvar);
        buscar(usuarioId, callback);
      });
  });
}

module.exports = { buscar, salvar };
