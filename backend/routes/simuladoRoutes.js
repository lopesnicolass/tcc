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
    editarOrdemQuestao
} = require("../controllers/simuladoController");

const router = express.Router();

// =====================================================
// SIMULADOS
// =====================================================

// Criar
router.post("/", cadastrarSimulado);

// Listar
router.get("/", listarTodosSimulados);

// Buscar
router.get("/:id", buscarSimulado);

// Editar
router.put("/:id", editarSimulado);

// Excluir
router.delete("/:id", deletarSimulado);

// =====================================================
// QUESTÕES DO SIMULADO
// =====================================================

// Adicionar questão
router.post(
    "/:id/questoes",
    adicionarQuestao
);

// Listar questões
router.get(
    "/:id/questoes",
    listarQuestoes
);

// Atualizar ordem
router.put(
    "/:id/questoes/:questaoId",
    editarOrdemQuestao
);

// Remover questão
router.delete(
    "/:id/questoes/:questaoId",
    removerQuestao
);

module.exports = router;