const express = require("express");

const {
    cadastrar,
    login
} = require("../controllers/authController");

const router = express.Router();


// ============================
// CADASTRO DE ALUNO
// ============================

router.post("/cadastro", cadastrar);


// ============================
// LOGIN
// ============================

router.post("/login", login);


module.exports = router;