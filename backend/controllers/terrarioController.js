const terrario = require('../models/terrarioModel');

const SALAS = [
  ['Ninho Inicial', 'Seu primeiro cantinho de estudos'],
  ['Cantinho de Estudos', 'Construindo uma rotina'],
  ['Biblioteca da Revisão', 'Aprofundando conhecimentos'],
  ['Oficina dos Simulados', 'Praticando para a prova'],
  ['Jardim da Persistência', 'Celebrando sua dedicação'],
  ['Mirante EtecCamp', 'Conquista simbólica da jornada']
];

function erroResposta(res, erro) {
  if (erro.code?.startsWith('SQLITE_CONSTRAINT')) {
    const sessaoDuplicada = /terrario_sessoes\.usuario_id|idx_terrario_sessao_ativa/i.test(erro.message || '');
    return res.status(409).json({ mensagem: sessaoDuplicada
      ? 'Você já possui uma sessão ativa.'
      : 'Não foi possível salvar a alteração. Confira os dados e tente novamente.' });
  }
  if (erro.status) return res.status(erro.status).json({ mensagem: erro.message });
  console.error('Erro no Terrário:', erro);
  return res.status(500).json({ mensagem: 'Não foi possível atualizar o Terrário.' });
}

async function estado(req, res) {
  try { return res.json(await terrario.buscarEstado(req.usuario.id)); }
  catch (erro) { return erroResposta(res, erro); }
}
async function iniciar(req, res) {
  try {
    await terrario.iniciar(req.usuario.id, req.body?.materia, req.body?.duracao);
    return res.status(201).json(await terrario.buscarEstado(req.usuario.id));
  } catch (erro) { return erroResposta(res, erro); }
}
function operacao(tipo) {
  return async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ mensagem: 'ID inválido.' });
      const resultado = await terrario.acao(req.usuario.id, id, tipo);
      if (resultado.status !== 200) return res.status(resultado.status).json({ mensagem: resultado.mensagem });
      return res.json(await terrario.buscarEstado(req.usuario.id));
    } catch (erro) { return erroResposta(res, erro); }
  };
}
async function jornada(req, res) {
  try {
    const estadoAtual = await terrario.buscarEstado(req.usuario.id);
    return res.json({ salas: SALAS.map(([nome, descricao], index) => ({
      numero: index + 1, nome, descricao,
      desbloqueada: index + 1 <= estadoAtual.salaDesbloqueada,
      disponivelNestaVersao: index === 0,
      requisito: index === 1 ? '5 sessões completas de pelo menos 15 minutos' : null
    })), progressoParaSala2: Math.min(5, estadoAtual.sessoesValidas) });
  } catch (erro) { return erroResposta(res, erro); }
}
async function comprarItem(req, res) {
  try {
    await terrario.comprarItem(req.usuario.id, req.params.itemId);
    return res.json(await terrario.buscarEstado(req.usuario.id));
  } catch (erro) { return erroResposta(res, erro); }
}
async function personalizarItem(req, res) {
  try {
    await terrario.personalizarItem(req.usuario.id, req.params.itemId, req.body);
    return res.json(await terrario.buscarEstado(req.usuario.id));
  } catch (erro) { return erroResposta(res, erro); }
}
module.exports = { estado, iniciar, jornada, operacao, comprarItem, personalizarItem };
