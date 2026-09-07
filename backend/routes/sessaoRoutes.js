const express = require("express");

const {
    listarSessoesAtivas,
    sair
} = require("../controllers/sessaoController");

const autenticarToken = require("../middleware/authMiddleware");
const verificarAdmin = require("../middleware/adminMiddleware");

const router = express.Router();


// =====================================================
// LISTAR USUÁRIOS LOGADOS
// =====================================================

router.get(
    "/ativas",
    autenticarToken,
    verificarAdmin,
    listarSessoesAtivas
);


// =====================================================
// ENCERRAR SESSÃO
// =====================================================

router.put(
    "/sair/:usuarioId",
    autenticarToken,
    sair
);


module.exports = router;