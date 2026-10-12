const express = require("express");

const {
    listar,
    proximoVestibulinho,
    criar,
    atualizar,
    excluir
} = require("../controllers/calendarioController");

const autenticarToken = require("../middleware/authMiddleware");
const verificarAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

// A data da prova é pública; todas as outras datas continuam autenticadas.
router.get("/vestibulinho", proximoVestibulinho);
router.get("/datas-importantes", autenticarToken, listar);
router.post("/datas-importantes", autenticarToken, verificarAdmin, criar);
router.put("/datas-importantes/:id", autenticarToken, verificarAdmin, atualizar);
router.delete("/datas-importantes/:id", autenticarToken, verificarAdmin, excluir);

module.exports = router;
