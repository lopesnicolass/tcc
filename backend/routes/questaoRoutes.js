const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao,
    listarQuestoesDoConteudo,
    corrigirQuestoesDoConteudo
} = require("../controllers/questaoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

const router = express.Router();


// Upload opcional de imagem por questão; jamais expõe upload para alunos.
const pastaImagens = path.join(__dirname, '..', 'uploads', 'questoes');
fs.mkdirSync(pastaImagens, { recursive: true });
const formatos = {
    'image/png': 'png', 'image/jpeg': 'jpg',
    'image/webp': 'webp', 'image/gif': 'gif'
};
const enviarImagem = multer({
    storage: multer.diskStorage({
        destination: (_, __, cb) => cb(null, pastaImagens),
        filename: (_, arquivo, cb) => cb(null, `${crypto.randomUUID()}.${formatos[arquivo.mimetype]}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_, arquivo, cb) => cb(null, Boolean(formatos[arquivo.mimetype]))
}).single('imagem');

router.post('/imagem', autenticarToken, verificarAdmin, (req, res) => {
    enviarImagem(req, res, (erro) => {
        if (erro) {
            return res.status(400).json({ mensagem: erro.code === 'LIMIT_FILE_SIZE'
                ? 'A imagem deve ter no máximo 5 MB.' : 'Não foi possível enviar a imagem.' });
        }
        if (!req.file) return res.status(400).json({ mensagem: 'Selecione uma imagem PNG, JPG, WEBP ou GIF.' });
        const remover = () => fs.unlink(req.file.path, () => {});
        try {
            const buffer = fs.readFileSync(req.file.path);
            const assinaturaValida =
                (req.file.mimetype === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) ||
                (req.file.mimetype === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
                (req.file.mimetype === 'image/gif' && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString())) ||
                (req.file.mimetype === 'image/webp' && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP');
            if (!assinaturaValida) {
                remover();
                return res.status(400).json({ mensagem: 'O arquivo não é uma imagem válida.' });
            }
            return res.status(201).json({ imagem: `/uploads/questoes/${req.file.filename}` });
        } catch (falha) {
            remover();
            return res.status(500).json({ mensagem: 'Erro ao processar a imagem.' });
        }
    });
});

// =====================================================
// ROTAS DO ALUNO
// =====================================================

router.get(
    "/aluno",
    autenticarToken,
    listarQuestoesDoConteudo
);

router.post(
    "/corrigir-bloco",
    autenticarToken,
    corrigirQuestoesDoConteudo
);


// =====================================================
// ROTAS ADMINISTRATIVAS
// =====================================================

router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    cadastrarQuestao
);

router.get(
    "/",
    autenticarToken,
    verificarAdmin,
    listarTodasQuestoes
);

router.get(
    "/:id",
    autenticarToken,
    verificarAdmin,
    buscarQuestao
);

router.put(
    "/:id",
    autenticarToken,
    verificarAdmin,
    editarQuestao
);

router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    deletarQuestao
);

module.exports = router;