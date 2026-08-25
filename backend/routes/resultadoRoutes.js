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

router.post(
    "/",
    cadastrarResultado
);


// ============================
// BUSCAR DESEMPENHO
// IMPORTANTE: vem antes de /:usuarioId
// ============================

router.get(
    "/:usuarioId/desempenho",
    buscarDesempenho
);


// ============================
// BUSCAR RESULTADOS
// ============================

router.get(
    "/:usuarioId",
    listarResultados
);


module.exports = router;