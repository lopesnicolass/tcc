const modelo = require('../models/cronogramaModeloModel');

function validarNome(nome) {
  return typeof nome === 'string' && nome.trim().length >= 3;
}

function validarMeses(meses) {
  return Number.isInteger(meses) && meses >= 1 && meses <= 12;
}

function prepararDados(req) {
  return {
    nome: String(req.body?.nome || '').trim(),
    descricao: String(req.body?.descricao || '').trim(),
    frequenciaDias: 0,
    meses: Number(req.body?.meses),
    sessoes: Array.isArray(req.body?.sessoes)
      ? req.body.sessoes.map((item) => ({
          mes: Number(item.mes),
          semana: Number(item.semana),
          sessao: Number(item.sessao),
          materiaId: Number(item.materiaId),
          topicoId: Number(item.topicoId)
        }))
      : []
  };
}

function listar(req, res) {
  modelo.listarModelos((erro, modelos) => {
    if (erro) {
      console.error('Erro ao listar cronograma base:', erro);
      return res.status(500).json({ mensagem: 'Erro ao carregar o cronograma.' });
    }

    res.json({ cronogramas: modelos || [] });
  });
}

function ativo(req, res) {
  modelo.buscarModeloPorFrequencia(null, (erro, cronograma) => {
    if (erro) {
      console.error('Erro ao buscar cronograma base:', erro);
      return res.status(500).json({ mensagem: 'Erro ao carregar o cronograma automático.' });
    }

    if (!cronograma) {
      return res.status(404).json({
        mensagem: 'O administrador ainda não configurou o cronograma de estudos.'
      });
    }

    res.json({ cronograma });
  });
}

function criar(req, res) {
  const dados = prepararDados(req);

  if (!validarNome(dados.nome)) {
    return res.status(400).json({ mensagem: 'Informe um nome válido para o cronograma.' });
  }

  if (!validarMeses(dados.meses)) {
    return res.status(400).json({ mensagem: 'Selecione uma quantidade de meses entre 1 e 12.' });
  }

  modelo.criarModelo(dados, (erro, cronograma) => {
    if (erro) {
      console.error('Erro ao criar cronograma base:', erro);
      return res.status(400).json({ mensagem: erro.message || 'Não foi possível criar o cronograma.' });
    }

    res.status(201).json({ mensagem: 'Cronograma criado com sucesso!', cronograma });
  });
}

function atualizar(req, res) {
  const id = Number(req.params.id);
  const dados = prepararDados(req);

  if (!id || !validarNome(dados.nome) || !validarMeses(dados.meses)) {
    return res.status(400).json({ mensagem: 'Dados do cronograma inválidos. Verifique o nome e a quantidade de meses.' });
  }

  modelo.atualizarModelo(id, dados, (erro, cronograma) => {
    if (erro) {
      console.error('Erro ao atualizar cronograma base:', erro);
      return res.status(400).json({ mensagem: erro.message || 'Não foi possível atualizar o cronograma.' });
    }

    res.json({ mensagem: 'Cronograma atualizado com sucesso!', cronograma });
  });
}

function excluir(req, res) {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ mensagem: 'Cronograma inválido.' });
  }

  modelo.excluirModelo(id, (erro, excluido) => {
    if (erro) {
      console.error('Erro ao excluir cronograma base:', erro);
      return res.status(500).json({ mensagem: 'Não foi possível excluir o cronograma.' });
    }

    if (!excluido) {
      return res.status(404).json({ mensagem: 'Cronograma não encontrado.' });
    }

    res.json({ mensagem: 'Cronograma excluído com sucesso!' });
  });
}

function ativar(req, res) {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ mensagem: 'Cronograma inválido.' });
  }

  modelo.ativarModelo(id, (erro, cronograma) => {
    if (erro) {
      console.error('Erro ao ativar cronograma:', erro);
      return res.status(400).json({ mensagem: erro.message || 'Não foi possível ativar o cronograma.' });
    }

    res.json({ mensagem: 'Cronograma disponível para os estudantes!', cronograma });
  });
}

module.exports = {
  listar,
  ativo,
  criar,
  atualizar,
  excluir,
  ativar
};
