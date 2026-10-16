const {
  listarTop3,
  buscarPosicaoParticipante,
  buscarParticipacao,
  atualizarParticipacao,
  buscarFotoParticipante
} = require('../models/rankingModel');

function responderErro(res, erro) {
  console.error('Erro no ranking:', erro);
  return res.status(500).json({ mensagem: 'Não foi possível consultar o ranking.' });
}

function listar(req, res) {
  listarTop3((erro, alunos) => {
    if (erro) return responderErro(res, erro);
    buscarParticipacao(req.usuario.id, (erroParticipacao, dados) => {
      if (erroParticipacao) return responderErro(res, erroParticipacao);
      buscarPosicaoParticipante(req.usuario.id, (erroPosicao, usuarioRanking) => {
        if (erroPosicao) return responderErro(res, erroPosicao);
        return res.json({
          top3: alunos.map((aluno, indice) => ({
            posicao: indice + 1,
            id: aluno.id,
            nome: aluno.nome,
            xp: Number(aluno.xp) || 0,
            possuiFoto: Boolean(aluno.possuiFoto)
          })),
          participando: Boolean(dados?.participando),
          minhaPosicao: usuarioRanking?.posicao ?? null
        });
      });
    });
  });
}

function configuracao(req, res) {
  buscarParticipacao(req.usuario.id, (erro, dados) => {
    if (erro) return responderErro(res, erro);
    if (!dados) return res.status(403).json({ mensagem: 'Apenas alunos podem participar do ranking.' });
    return res.json({ participando: Boolean(dados.participando) });
  });
}

function atualizarConfiguracao(req, res) {
  if (typeof req.body?.participando !== 'boolean') {
    return res.status(400).json({ mensagem: 'Informe participando como verdadeiro ou falso.' });
  }
  atualizarParticipacao(req.usuario.id, req.body.participando, (erro, alteracoes) => {
    if (erro) return responderErro(res, erro);
    if (!alteracoes) return res.status(403).json({ mensagem: 'Apenas alunos podem participar do ranking.' });
    return res.json({ participando: req.body.participando });
  });
}

function foto(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ mensagem: 'Participante inválido.' });
  }

  buscarFotoParticipante(id, (erro, imagem) => {
    if (erro) return responderErro(res, erro);
    if (!imagem || !imagem.dados || !['image/jpeg', 'image/png', 'image/webp'].includes(imagem.tipo)) {
      return res.status(404).json({ mensagem: 'Foto indisponível.' });
    }
    res.set({
      'Content-Type': imagem.tipo,
      'Cache-Control': 'private, no-store',
      'Vary': 'Authorization',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.send(imagem.dados);
  });
}

module.exports = { listar, configuracao, atualizarConfiguracao, foto };
