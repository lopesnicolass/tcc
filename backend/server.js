require("dotenv").config();

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

// Cria a estrutura adicional do checklist.
// Não apaga nem recria o banco existente.
require("./config/ensureChecklist");
require("./config/ensureCalendario");
require("./config/ensureCronogramasModelos");

// =====================================================
// APP
// =====================================================

const app =
    express();

app.use(
    cors()
);

app.use(
    express.json()
);

// =====================================================
// UPLOADS
// =====================================================
//
// Só a pasta "provas" é pública de propósito (provas de
// vestibulinhos anteriores, não é dado sensível — ver
// comentário em provaRoutes.js). As fotos de perfil NÃO
// passam mais por aqui: elas ficam salvas como BLOB no
// banco (usuarios.foto_perfil_dados) e só são entregues
// pelo endpoint autenticado /usuarios/meu-perfil. Por isso
// servimos só "/uploads/provas", e não a pasta "uploads"
// inteira — assim "uploads/perfis" (com fotos antigas de
// antes dessa mudança) não fica acessível publicamente.

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
                "API do Vestibulinho funcionando!"
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