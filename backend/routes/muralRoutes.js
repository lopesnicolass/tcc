const express = require("express");

const {
    listar,
    criar,
    atualizar,
    excluir
} = require("../controllers/muralController");

const router = express.Router();


// ==========================================
// LISTAR POST-ITS DO USUÁRIO
// ==========================================

router.get(
    "/:usuarioId",
    listar
);


// ==========================================
// CRIAR POST-IT
// ==========================================

router.post(
    "/:usuarioId",
    criar
);


// ==========================================
// EDITAR POST-IT
// ==========================================

router.put(
    "/:usuarioId/:id",
    atualizar
);


// ==========================================
// EXCLUIR POST-IT
// ==========================================

router.delete(
    "/:usuarioId/:id",
    excluir
);


module.exports = router;