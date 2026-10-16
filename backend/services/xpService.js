const db = require('../config/db');

// O cliente não informa quantidade nem tipo de XP. Somente eventos confirmados
// por uma gravação real (resultado ou post-it) chamam este serviço.
const ACOES = Object.freeze({
    simulado_concluido: { pontos: 50, limite: 5 },
    novo_postit: { pontos: 10, limite: 10 }
});

function concederXPVerificado(usuarioId, acao, referencia, callback = () => {}) {
    const regra = ACOES[acao];
    if (!regra || !Number.isSafeInteger(Number(usuarioId)) || Number(usuarioId) <= 0 ||
        !Number.isSafeInteger(Number(referencia)) || Number(referencia) <= 0) {
        return callback(new TypeError('Evento de XP inválido.'));
    }
    const agora = new Date();
    const data = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;

    db.run(`INSERT INTO xp_eventos_verificados(usuario_id, action, referencia, data, quantidade)
      SELECT ?, ?, ?, ?, ? WHERE (
        (SELECT COUNT(*) FROM xp_eventos_verificados WHERE usuario_id=? AND action=? AND data=?) +
        (SELECT COUNT(*) FROM xp_eventos WHERE usuario_id=? AND action=? AND data=?)
      ) < ? ON CONFLICT(usuario_id, action, referencia) DO NOTHING`,
      [usuarioId, acao, String(referencia), data, regra.pontos, usuarioId, acao, data, usuarioId, acao, data, regra.limite],
      function (erro) {
        if (erro) return callback(erro);
        // O gatilho do banco atualiza XP + sequência atomicamente no INSERT.
        return callback(null, this.changes ? regra.pontos : 0);
      }
    );
}
module.exports = { concederXPVerificado };
