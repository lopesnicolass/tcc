const express = require("express");

const {
    listarTodosUsuarios
} = require("../controllers/usuarioController");

const verificarAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", verificarAdmin, listarTodosUsuarios);

module.exports = router;