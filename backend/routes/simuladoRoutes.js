const express = require("express");

const {
    cadastrarSimulado,
    listarTodosSimulados,
    buscarSimulado,
    editarSimulado,
    deletarSimulado,
    adicionarQuestao,
    listarQuestoes,
    removerQuestao,
    editarOrdemQuestao,
    corrigirSimulado
} = require("../controllers/simuladoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

const router = express.Router();

// =====================================================
// SIMULADOS
// =====================================================

// Criar — ADMIN
router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    cadastrarSimulado
);

// Listar — qualquer usuário logado (aluno vê os simulados disponíveis)
router.get(
    "/",
    autenticarToken,
    listarTodosSimulados
);

// Buscar (abrir simulado para responder) — qualquer usuário logado.
// A rota NUNCA devolve o gabarito (campo "correta") aqui —
// ver simuladoModel.listarQuestoesDoSimuladoParaResponder.
router.get(
    "/:id",
    autenticarToken,
    buscarSimulado
);

// Editar — ADMIN
router.put(
    "/:id",
    autenticarToken,
    verificarAdmin,
    editarSimulado
);

// Corrigir — qualquer usuário logado (o aluno envia as
// respostas ao finalizar e recebe a nota calculada no servidor)
router.post(
    "/:id/corrigir",
    autenticarToken,
    corrigirSimulado
);

// Excluir — ADMIN
router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    deletarSimulado
);

// =====================================================
// QUESTÕES DO SIMULADO — TODAS ADMIN
// (a listagem aqui é a de edição/montagem do simulado,
// que inclui o gabarito de propósito)
// =====================================================

// Adicionar questão
router.post(
    "/:id/questoes",
    autenticarToken,
    verificarAdmin,
    adicionarQuestao
);

// Listar questões (com gabarito, para o admin editar)
router.get(
    "/:id/questoes",
    autenticarToken,
    verificarAdmin,
    listarQuestoes
);

// Atualizar ordem
router.put(
    "/:id/questoes/:questaoId",
    autenticarToken,
    verificarAdmin,
    editarOrdemQuestao
);

// Remover questão
router.delete(
    "/:id/questoes/:questaoId",
    autenticarToken,
    verificarAdmin,
    removerQuestao
);

module.exports = router;