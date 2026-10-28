const model = require('../models/planoPessoalModel');

function valido(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor) ||
      !Number.isInteger(valor.months) || valor.months < 1 || valor.months > 12 ||
      !Number.isInteger(valor.days) || valor.days < 1 || valor.days > 7 ||
      !Number.isInteger(valor.modeloId) || valor.modeloId <= 0 ||
      !Array.isArray(valor.plan) || valor.plan.length !== valor.months ||
      !Array.isArray(valor.diasSemana) || valor.diasSemana.length !== valor.days ||
      new Set(valor.diasSemana).size !== valor.diasSemana.length ||
      !valor.diasSemana.every(d => Number.isInteger(d) && d >= 0 && d <= 6) ||
      !/^\d{4}-\d{2}-01$/.test(valor.inicio || '')) return false;
  let total = 0;
  for (const mes of valor.plan) {
    if (!Array.isArray(mes?.semanas) || mes.semanas.length !== 4) return false;
    for (const semana of mes.semanas) {
      if (!Array.isArray(semana?.days) || semana.days.length !== valor.days) return false;
      for (const dia of semana.days) {
        if (!Array.isArray(dia?.items)) return false;
        total += dia.items.length;
        if (total > 3000) return false;
      }
    }
  }
  return true;
}

function meuPlano(req, res) {
  model.buscar(Number(req.usuario.id), (erro, registro) => {
    if (erro) return res.status(500).json({ mensagem: 'Erro ao consultar seu plano.' });
    if (!registro) return res.json({ plano: null });
    try { return res.json({ plano: JSON.parse(registro.configuracao), salvoEm: registro.salvo_em }); }
    catch { return res.status(500).json({ mensagem: 'Plano salvo com formato inválido.' }); }
  });
}

function atualizarMeuPlano(req, res) {
  const plano = req.body?.plano;
  const salvoEm = Number(req.body?.salvoEm);
  if (!valido(plano) || !Number.isSafeInteger(salvoEm) || salvoEm <= 0 ||
      JSON.stringify(plano).length > 500000) {
    return res.status(400).json({ mensagem: 'Configuração do plano inválida.' });
  }
  model.salvar(Number(req.usuario.id), plano, salvoEm, (erro, registro) => {
    if (erro) return res.status(500).json({ mensagem: 'Não foi possível guardar seu plano.' });
    return res.json({ salvoEm: registro.salvo_em });
  });
}

module.exports = { meuPlano, atualizarMeuPlano };
