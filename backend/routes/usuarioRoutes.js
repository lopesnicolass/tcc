const express = require("express");

const {
    buscarPerfil,
    atualizarPerfil
} = require("../controllers/usuarioController");

const router = express.Router();


// Buscar perfil
router.get("/:id", buscarPerfil);


// Atualizar perfil
router.put("/:id", atualizarPerfil);


module.exports = router;