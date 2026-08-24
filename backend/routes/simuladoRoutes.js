const express = require("express");

const {
    cadastrarSimulado,
    listarTodosSimulados,
    buscarSimulado,
    adicionarQuestao,
    listarQuestoes,
    removerQuestao
} = require("../controllers/simuladoController");

const router = express.Router();


// ============================
// SIMULADOS
// ============================

// Criar simulado
router.post("/", cadastrarSimulado);

// Listar simulados
router.get("/", listarTodosSimulados);

// Buscar simulado + questões
router.get("/:id", buscarSimulado);


// ============================
// QUESTÕES DO SIMULADO
// ============================

// Adicionar questão
router.post("/:id/questoes", adicionarQuestao);

// Listar questões
router.get("/:id/questoes", listarQuestoes);

// Remover questão
router.delete("/:id/questoes/:questaoId", removerQuestao);


module.exports = router;