const express = require("express");

const {
    listar,
    criar,
    criarEmLote,
    atualizar,
    excluir,
    excluirPorOrigem
} = require("../controllers/cronogramaController");

const autenticarToken =
    require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:usuarioId", autenticarToken, listar);
router.post("/:usuarioId", autenticarToken, criar);
router.post("/:usuarioId/lote", autenticarToken, criarEmLote);
router.delete("/:usuarioId/origem/:origem", autenticarToken, excluirPorOrigem);
router.put("/:usuarioId/:id", autenticarToken, atualizar);
router.delete("/:usuarioId/:id", autenticarToken, excluir);

module.exports = router;