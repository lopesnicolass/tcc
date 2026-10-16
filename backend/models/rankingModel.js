const db = require('../config/db');

function listarTop3(callback) {
  db.all(`
    SELECT
      u.id,
      u.nome,
      COALESCE(u.xp, 0) AS xp,
      CASE WHEN u.foto_perfil_dados IS NOT NULL
        AND length(u.foto_perfil_dados) > 0
        AND u.foto_perfil_tipo IN ('image/jpeg', 'image/png', 'image/webp')
      THEN 1 ELSE 0 END AS possuiFoto
    FROM usuarios u
    INNER JOIN ranking_participantes p ON p.usuario_id = u.id
    WHERE LOWER(TRIM(u.tipo)) = 'aluno' AND p.participando = 1
    ORDER BY COALESCE(u.xp, 0) DESC, u.id ASC
    LIMIT 3
  `, [], callback);
}


// Colocação individual, incluindo participantes fora do Top 3.
// Usa a mesma ordenação de XP e desempate por ID do ranking público.
function buscarPosicaoParticipante(id, callback) {
  db.get(`
    SELECT
      (SELECT COUNT(*) + 1 FROM usuarios outros
        INNER JOIN ranking_participantes op ON op.usuario_id = outros.id
        WHERE LOWER(TRIM(outros.tipo)) = 'aluno' AND op.participando = 1
          AND (COALESCE(outros.xp, 0) > COALESCE(u.xp, 0)
            OR (COALESCE(outros.xp, 0) = COALESCE(u.xp, 0) AND outros.id < u.id))
      ) AS posicao
    FROM usuarios u
    INNER JOIN ranking_participantes p ON p.usuario_id = u.id
    WHERE u.id = ? AND LOWER(TRIM(u.tipo)) = 'aluno' AND p.participando = 1
  `, [id], callback);
}

function buscarParticipacao(id, callback) {
  db.get(`
    SELECT CASE WHEN p.participando = 1 THEN 1 ELSE 0 END AS participando
    FROM usuarios u
    LEFT JOIN ranking_participantes p ON p.usuario_id = u.id
    WHERE u.id = ? AND LOWER(TRIM(u.tipo)) = 'aluno'
  `, [id], callback);
}

function atualizarParticipacao(id, participando, callback) {
  // Só alunos podem habilitar sua visibilidade.
  db.run(`
    INSERT INTO ranking_participantes (usuario_id, participando)
    SELECT id, ? FROM usuarios
    WHERE id = ? AND LOWER(TRIM(tipo)) = 'aluno'
    ON CONFLICT(usuario_id) DO UPDATE SET participando = excluded.participando
  `, [participando ? 1 : 0, id], function (erro) {
    callback(erro, this?.changes || 0);
  });
}

function buscarFotoParticipante(id, callback) {
  db.get(`
    SELECT u.foto_perfil_dados AS dados, u.foto_perfil_tipo AS tipo
    FROM usuarios u
    INNER JOIN ranking_participantes p ON p.usuario_id = u.id
    WHERE u.id = ? AND LOWER(TRIM(u.tipo)) = 'aluno' AND p.participando = 1
  `, [id], callback);
}

module.exports = {
  listarTop3,
  buscarPosicaoParticipante,
  buscarParticipacao,
  atualizarParticipacao,
  buscarFotoParticipante
};
