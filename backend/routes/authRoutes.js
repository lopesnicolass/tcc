const express = require("express");

const {
    cadastrar,
    login,
    esqueciSenha,
    redefinirSenha
} = require("../controllers/authController");

const { limitarRequisicoes } = require('../middleware/limiteRequisicoes');
const router = express.Router();
const limiteLogin = limitarRequisicoes({ maximo: 10, maximoIP: 150, usarEmail: true });
const limiteCadastro = limitarRequisicoes({ maximo: 30 });
const limiteRecuperacao = limitarRequisicoes({ maximo: 5, maximoIP: 100, usarEmail: true });


// ============================
// CADASTRO DE ALUNO
// ============================

router.post("/cadastro", limiteCadastro, cadastrar);


// ============================
// LOGIN
// ============================

router.post("/login", limiteLogin, login);


// ============================
// RECUPERAÇÃO DE SENHA
// ============================

router.post("/esqueci-senha", limiteRecuperacao, esqueciSenha);

router.post("/redefinir-senha", limiteRecuperacao, redefinirSenha);


module.exports = router;
