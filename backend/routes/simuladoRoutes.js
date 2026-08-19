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

router.post("/", cadastrarSimulado);

router.get("/", listarTodosSimulados);

router.get("/:id", buscarSimulado);

router.post("/:id/questoes", adicionarQuestao);

router.get("/:id/questoes", listarQuestoes);

router.delete("/:id/questoes/:questaoId", removerQuestao);

module.exports = router;