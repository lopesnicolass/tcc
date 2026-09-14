const express = require("express");

const {
    listar,
    criar,
    atualizar,
    excluir
} = require("../controllers/muralController");

const autenticarToken =
    require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// LISTAR POST-ITS DO USUÁRIO
// ==========================================

router.get(
    "/:usuarioId",
    autenticarToken,
    listar
);


// ==========================================
// CRIAR POST-IT
// ==========================================

router.post(
    "/:usuarioId",
    autenticarToken,
    criar
);


// ==========================================
// EDITAR POST-IT
// ==========================================

router.put(
    "/:usuarioId/:id",
    autenticarToken,
    atualizar
);


// ==========================================
// EXCLUIR POST-IT
// ==========================================

router.delete(
    "/:usuarioId/:id",
    autenticarToken,
    excluir
);


module.exports = router;