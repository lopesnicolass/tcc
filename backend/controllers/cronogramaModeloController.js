const modelo = require('../models/cronogramaModeloModel');

// =====================================================
// VALIDAÇÕES
// =====================================================

function validarNome(nome) {
  return (
    typeof nome === 'string' &&
    nome.trim().length >= 3 &&
    nome.trim().length <= 100
  );
}

function validarDescricao(descricao) {
  return (
    typeof descricao === 'string' &&
    descricao.trim().length <= 300
  );
}

function validarMeses(meses) {
  return (
    Number.isInteger(meses) &&
    meses >= 1 &&
    meses <= 12
  );
}


// =====================================================
// PREPARAR DADOS
// =====================================================

function prepararDados(req) {
  const body = req.body || {};

  return {
    nome: String(body.nome || '').trim(),

    descricao:
      String(body.descricao || '').trim(),

    meses:
      Number(body.meses),

    sessoes:
      Array.isArray(body.sessoes)
        ? body.sessoes.map((item) => ({
            mes: Number(item.mes),
            semana: Number(item.semana),
            sessao: Number(item.sessao),
            diaEstudo:
              Number(item.diaEstudo || 1),
            materiaId:
              Number(item.materiaId),
            topicoId:
              Number(item.topicoId)
          }))
        : []
  };
}


// =====================================================
// VALIDAR DADOS
// =====================================================

function validarDados(dados) {

  if (!validarNome(dados.nome)) {
    return (
      'Informe um nome válido para o cronograma.'
    );
  }


  if (!validarDescricao(dados.descricao)) {
    return (
      'A descrição do cronograma pode ter no máximo 300 caracteres.'
    );
  }


  if (!validarMeses(dados.meses)) {
    return (
      'Selecione uma quantidade de meses entre 1 e 12.'
    );
  }


  if (
    !Array.isArray(dados.sessoes) ||
    !dados.sessoes.length
  ) {
    return (
      'Adicione pelo menos um conteúdo ao cronograma.'
    );
  }


  return null;
}


// =====================================================
// LISTAR
// =====================================================

function listar(req, res) {

  modelo.listarModelos(
    (erro, modelos) => {

      if (erro) {

        console.error(
          '❌ Erro ao listar cronograma base:',
          erro
        );

        return res.status(500).json({
          mensagem:
            'Erro ao carregar o cronograma.'
        });
      }


      return res.json({
        cronogramas:
          modelos || []
      });
    }
  );
}


// =====================================================
// BUSCAR MODELO ATIVO PARA ALUNO
// =====================================================

function ativo(req, res) {

  modelo.buscarModeloPorFrequencia(
    null,
    (erro, cronograma) => {

      if (erro) {

        console.error(
          '❌ Erro ao buscar cronograma base:',
          erro
        );

        return res.status(500).json({
          mensagem:
            'Erro ao carregar o cronograma automático.'
        });
      }


      if (!cronograma) {

        return res.status(404).json({
          mensagem:
            'O administrador ainda não configurou o cronograma de estudos.'
        });
      }


      return res.json({
        cronograma
      });
    }
  );
}


// =====================================================
// CRIAR
// =====================================================

function criar(req, res) {

  const dados =
    prepararDados(req);

  const erroValidacao =
    validarDados(dados);


  if (erroValidacao) {

    return res.status(400).json({
      mensagem:
        erroValidacao
    });
  }


  modelo.criarModelo(
    dados,
    (erro, cronograma) => {

      if (erro) {

        console.error(
          '❌ Erro ao criar cronograma base:',
          erro
        );

        return res.status(400).json({
          mensagem:
            erro.message ||
            'Não foi possível criar o cronograma.'
        });
      }


      return res.status(201).json({
        mensagem:
          'Cronograma criado com sucesso!',
        cronograma
      });
    }
  );
}


// =====================================================
// ATUALIZAR
// =====================================================

function atualizar(req, res) {

  const id =
    Number(req.params.id);

  const dados =
    prepararDados(req);

  const erroValidacao =
    validarDados(dados);


  if (!id) {

    return res.status(400).json({
      mensagem:
        'Cronograma inválido.'
    });
  }


  if (erroValidacao) {

    return res.status(400).json({
      mensagem:
        erroValidacao
    });
  }


  modelo.atualizarModelo(
    id,
    dados,
    (erro, cronograma) => {

      if (erro) {

        console.error(
          '❌ Erro ao atualizar cronograma base:',
          erro
        );

        return res.status(400).json({
          mensagem:
            erro.message ||
            'Não foi possível atualizar o cronograma.'
        });
      }


      return res.json({
        mensagem:
          'Cronograma atualizado com sucesso!',
        cronograma
      });
    }
  );
}


// =====================================================
// EXCLUIR
// =====================================================

function excluir(req, res) {

  const id =
    Number(req.params.id);


  if (!id) {

    return res.status(400).json({
      mensagem:
        'Cronograma inválido.'
    });
  }


  modelo.excluirModelo(
    id,
    (erro, excluido) => {

      if (erro) {

        console.error(
          '❌ Erro ao excluir cronograma base:',
          erro
        );

        return res.status(500).json({
          mensagem:
            'Não foi possível excluir o cronograma.'
        });
      }


      if (!excluido) {

        return res.status(404).json({
          mensagem:
            'Cronograma não encontrado.'
        });
      }


      return res.json({
        mensagem:
          'Cronograma excluído com sucesso!'
      });
    }
  );
}


// =====================================================
// ATIVAR
// =====================================================

function ativar(req, res) {

  const id =
    Number(req.params.id);


  if (!id) {

    return res.status(400).json({
      mensagem:
        'Cronograma inválido.'
    });
  }


  modelo.ativarModelo(
    id,
    (erro, cronograma) => {

      if (erro) {

        console.error(
          '❌ Erro ao ativar cronograma:',
          erro
        );

        return res.status(400).json({
          mensagem:
            erro.message ||
            'Não foi possível ativar o cronograma.'
        });
      }


      return res.json({
        mensagem:
          'Cronograma disponível para os estudantes!',
        cronograma
      });
    }
  );
}


module.exports = {
  listar,
  ativo,
  criar,
  atualizar,
  excluir,
  ativar
};