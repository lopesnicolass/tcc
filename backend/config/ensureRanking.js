const db = require('./db');

// Participação voluntária: o nome e a foto de alunos não são
// publicados no ranking até que o próprio aluno autorize.
db.run(`
  CREATE TABLE IF NOT EXISTS ranking_participantes (
    usuario_id INTEGER PRIMARY KEY,
    participando INTEGER NOT NULL DEFAULT 0 CHECK (participando IN (0, 1)),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )
`);
