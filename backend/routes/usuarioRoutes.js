const express = require("express");

const {
    listarTodosUsuarios,
    excluir
} = require("../controllers/usuarioController");

const autenticarToken = require("../middleware/authMiddleware");
const verificarAdmin = require("../middleware/adminMiddleware");

const router = express.Router();


// ============================
// LISTAR TODOS OS USUÁRIOS
// ============================

router.get(
    "/",
    autenticarToken,
    verificarAdmin,
    listarTodosUsuarios
);


// ============================
// EXCLUIR USUÁRIO
// ============================

router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    excluir
);


module.exports = router;