const db = require("../config/db");

const flashcardsIniciais = [
    {
        primario: "Qual a fórmula de Bhaskara?",
        secundario: "x = (-b ± √Δ) / 2a",
        materia: "Matemática"
    },
    {
        primario: "O que é um adjetivo?",
        secundario: "Palavra que caracteriza o substantivo.",
        materia: "Português"
    },
    {
        primario: "Quem descobriu o Brasil?",
        secundario: "Pedro Álvares Cabral, em 1500.",
        materia: "História"
    },
    {
        primario: "O que é um advérbio?",
        secundario: "Palavra que modifica verbo, adjetivo ou outro advérbio.",
        materia: "Português"
    },
    {
        primario: "Em que ano começou a Segunda Guerra Mundial?",
        secundario: "1939.",
        materia: "História"
    },
    {
        primario: "O que é urbanização?",
        secundario: "Processo de crescimento e expansão das cidades.",
        materia: "Geografia"
    }
];

let index = 0;

function inserirProximo() {

    if (index >= flashcardsIniciais.length) {
        console.log("Flashcards iniciais verificados.");
        return;
    }

    const card = flashcardsIniciais[index];

    db.run(
        `
            INSERT INTO flashcards
            (
                primario,
                secundario,
                materia,
                ativo
            )
            SELECT ?, ?, ?, 1
            WHERE NOT EXISTS (
                SELECT 1
                FROM flashcards
                WHERE primario = ?
                AND materia = ?
            )
        `,
        [
            card.primario,
            card.secundario,
            card.materia,
            card.primario,
            card.materia
        ],
        (erro) => {

            if (erro) {
                console.error(
                    "Erro ao cadastrar flashcard:",
                    erro.message
                );
                return;
            }

            index++;
            inserirProximo();
        }
    );
}

inserirProximo();