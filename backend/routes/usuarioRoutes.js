const express = require("express");

const {
    listarTodosUsuarios
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


module.exports = router;