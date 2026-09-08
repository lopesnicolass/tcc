const flashcardModel =
    require("../models/flashcardModel");


// =====================================================
// LISTAR FLASHCARDS
// =====================================================

function listar(req, res) {

    flashcardModel.listarFlashcards(
        (erro, flashcards) => {

            if (erro) {

                console.error(
                    "❌ Erro ao listar flashcards:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao carregar flashcards."
                });
            }

            return res.json({
                flashcards
            });
        }
    );
}


// =====================================================
// BUSCAR FLASHCARD
// =====================================================

function buscarPorId(req, res) {

    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            erro:
                "ID do flashcard inválido."
        });
    }

    flashcardModel.buscarFlashcardPorId(
        id,
        (erro, flashcard) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar flashcard:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao buscar flashcard."
                });
            }

            if (!flashcard) {

                return res.status(404).json({
                    erro:
                        "Flashcard não encontrado."
                });
            }

            return res.json(
                flashcard
            );
        }
    );
}


// =====================================================
// CRIAR FLASHCARD
// =====================================================

function criar(req, res) {

    const {
        primario,
        secundario,
        materia
    } = req.body || {};


    if (
        !primario ||
        !String(primario).trim()
    ) {

        return res.status(400).json({
            erro:
                "O texto primário é obrigatório."
        });
    }


    if (
        !secundario ||
        !String(secundario).trim()
    ) {

        return res.status(400).json({
            erro:
                "O texto secundário é obrigatório."
        });
    }


    if (
        !materia ||
        !String(materia).trim()
    ) {

        return res.status(400).json({
            erro:
                "A matéria é obrigatória."
        });
    }


    flashcardModel.criarFlashcard(
        String(primario).trim(),
        String(secundario).trim(),
        String(materia).trim(),
        (erro, flashcard) => {

            if (erro) {

                console.error(
                    "❌ Erro ao criar flashcard:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao criar flashcard."
                });
            }

            return res.status(201).json({

                mensagem:
                    "Flashcard criado com sucesso.",

                flashcard

            });
        }
    );
}


// =====================================================
// ATUALIZAR FLASHCARD
// =====================================================

function atualizar(req, res) {

    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            erro:
                "ID do flashcard inválido."
        });
    }


    const dados =
        {
            ...(req.body || {})
        };


    if (
        dados.primario !== undefined
    ) {

        dados.primario =
            String(
                dados.primario
            ).trim();

        if (!dados.primario) {

            return res.status(400).json({
                erro:
                    "O texto primário é obrigatório."
            });
        }
    }


    if (
        dados.secundario !== undefined
    ) {

        dados.secundario =
            String(
                dados.secundario
            ).trim();

        if (!dados.secundario) {

            return res.status(400).json({
                erro:
                    "O texto secundário é obrigatório."
            });
        }
    }


    if (
        dados.materia !== undefined
    ) {

        dados.materia =
            String(
                dados.materia
            ).trim();

        if (!dados.materia) {

            return res.status(400).json({
                erro:
                    "A matéria é obrigatória."
            });
        }
    }


    flashcardModel.atualizarFlashcard(
        id,
        dados,
        (erro, flashcard) => {

            if (erro) {

                console.error(
                    "❌ Erro ao atualizar flashcard:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao atualizar flashcard."
                });
            }


            if (!flashcard) {

                return res.status(404).json({
                    erro:
                        "Flashcard não encontrado."
                });
            }


            return res.json({

                mensagem:
                    "Flashcard atualizado com sucesso.",

                flashcard

            });
        }
    );
}


// =====================================================
// EXCLUIR FLASHCARD
// =====================================================

function excluir(req, res) {

    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            erro:
                "ID do flashcard inválido."
        });
    }


    flashcardModel.excluirFlashcard(
        id,
        (erro, excluido) => {

            if (erro) {

                console.error(
                    "❌ Erro ao excluir flashcard:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao excluir flashcard."
                });
            }


            if (!excluido) {

                return res.status(404).json({
                    erro:
                        "Flashcard não encontrado."
                });
            }


            return res.json({

                mensagem:
                    "Flashcard excluído com sucesso."

            });
        }
    );
}


module.exports = {

    listar,

    buscarPorId,

    criar,

    atualizar,

    excluir

};