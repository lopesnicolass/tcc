require("dotenv").config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres no ambiente de produção.');
}
const express = require("express");
const cors = require("cors");
const path = require("path");

// =====================================================
// ROTAS
// =====================================================

const questaoRoutes =
    require("./routes/questaoRoutes");

const authRoutes =
    require("./routes/authRoutes");

const usuarioRoutes =
    require("./routes/usuarioRoutes");

const resultadoRoutes =
    require("./routes/resultadoRoutes");

const simuladoRoutes =
    require("./routes/simuladoRoutes");

const muralRoutes =
    require("./routes/muralRoutes");

const sessaoRoutes =
    require("./routes/sessaoRoutes");

const provaRoutes =
    require("./routes/provaRoutes");

const gamificacaoRoutes =
    require("./routes/gamificacaoRoutes");

const conteudoRoutes =
    require("./routes/conteudoRoutes");

const flashcardRoutes =
    require("./routes/flashcardRoutes");

const cronogramaRoutes =
    require("./routes/cronogramaRoutes");

const cronogramaModeloRoutes =
    require("./routes/cronogramaModeloRoutes");

const calendarioRoutes =
    require("./routes/calendarioRoutes");

const resultadoFlashcardRoutes =
    require("./routes/resultadoFlashcardRoutes");

const conteudoPaginaRoutes =
    require("./routes/conteudoPaginaRoutes");

const checklistRoutes =
    require("./routes/checklistRoutes");

// =====================================================
// INICIALIZAÇÕES
// =====================================================

require("./config/ensureChecklist");
require("./config/ensureCalendario");
require("./config/ensureCronogramasModelos");
require("./config/ensureResultados");
require("./config/ensureXP");
require("./config/ensureRanking");

// =====================================================
// APP
// =====================================================

const app =
    express();

const origens = String(process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',').map(origem => origem.trim()).filter(Boolean);
app.use(cors({
    origin(origem, callback) {
        if (!origem || origens.includes(origem)) return callback(null, true);
        callback(new Error('Origem não autorizada pelo CORS.'));
    }
}));

app.use(
    express.json()
);

// =====================================================
// UPLOADS
// =====================================================

app.use('/uploads/questoes', express.static(path.join(__dirname, 'uploads', 'questoes')));

app.use(
    "/uploads/provas",
    express.static(
        path.join(
            __dirname,
            "uploads",
            "provas"
        )
    )
);

// =====================================================
// ROTAS
// =====================================================

app.use(
    "/auth",
    authRoutes
);

app.use(
    "/usuarios",
    usuarioRoutes
);

app.use(
    "/resultados",
    resultadoRoutes
);

app.use(
    "/questoes",
    questaoRoutes
);

app.use(
    "/simulados",
    simuladoRoutes
);

app.use(
    "/mural",
    muralRoutes
);

app.use(
    "/sessoes",
    sessaoRoutes
);

app.use(
    "/provas",
    provaRoutes
);

app.use(
    "/gamificacao",
    gamificacaoRoutes
);

app.use(
    "/conteudos",
    conteudoRoutes
);

app.use(
    "/flashcards",
    flashcardRoutes
);

app.use(
    "/cronograma",
    cronogramaRoutes
);

app.use(
    "/cronogramas-modelos",
    cronogramaModeloRoutes
);

app.use(
    "/calendario",
    calendarioRoutes
);

app.use(
    "/flashcards/resultados",
    resultadoFlashcardRoutes
);

app.use(
    "/paginas-conteudo",
    conteudoPaginaRoutes
);

app.use(
    "/checklists",
    checklistRoutes
);

// =====================================================
// TESTE DA API
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.json({
            mensagem:
                "API Tenna funcionando!"
        });

    }
);

// =====================================================
// SERVIDOR
// =====================================================

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

    }
);