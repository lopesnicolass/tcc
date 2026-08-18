const express = require("express");

const {
    cadastrarResultado,
    listarResultados,
    buscarDesempenho
} = require("../controllers/resultadoController");

const router = express.Router();


// ============================
// SALVAR RESULTADO
// ============================

router.post("/", cadastrarResultado);


// ============================
// BUSCAR RESULTADOS
// ============================

router.get("/:usuarioId", listarResultados);


// ============================
// BUSCAR DESEMPENHO
// ============================

router.get("/:usuarioId/desempenho", buscarDesempenho);


module.exports = router;