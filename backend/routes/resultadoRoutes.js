const express = require("express");

const {
    cadastrarResultado,
    listarResultados,
    buscarDesempenho
} = require("../controllers/resultadoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const router = express.Router();


// ============================
// SALVAR RESULTADO
// (o usuário é sempre o dono do token,
// não é mais aceito no corpo da requisição)
// ============================

router.post(
    "/",
    autenticarToken,
    cadastrarResultado
);


// ============================
// BUSCAR DESEMPENHO
// IMPORTANTE: vem antes de /:usuarioId
// ============================

router.get(
    "/:usuarioId/desempenho",
    autenticarToken,
    buscarDesempenho
);


// ============================
// BUSCAR RESULTADOS
// ============================

router.get(
    "/:usuarioId",
    autenticarToken,
    listarResultados
);


module.exports = router;