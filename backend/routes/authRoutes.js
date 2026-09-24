const express = require("express");

const {
    cadastrar,
    login,
    esqueciSenha,
    redefinirSenha
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


// ============================
// RECUPERAÇÃO DE SENHA
// ============================

router.post("/esqueci-senha", esqueciSenha);

router.post("/redefinir-senha", redefinirSenha);


module.exports = router;
