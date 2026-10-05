// =====================================================
// MATÉRIAS USADAS PELO MURAL
// =====================================================

// O Mural trabalha com categorias próprias em texto.
// Elas não dependem da tabela "materias" do conteúdo,
// então Matemática continua válida no Mural mesmo que
// ainda não exista como registro na tabela de matérias.

const MATERIAS_MURAL = [
    "Português",
    "Matemática",
    "História",
    "Geografia",
    "Ciências"
];


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTextoMateria(valor) {

    return String(valor || "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// =====================================================
// CONVERTER QUALQUER VARIAÇÃO PARA O NOME USADO NO MURAL
// =====================================================

function normalizarMateriaMural(valor) {

    const materia =
        normalizarTextoMateria(valor);

    switch (materia) {

        case "portugues":
        case "lingua portuguesa":
            return "Português";

        case "matematica":
            return "Matemática";

        case "historia":
            return "História";

        case "geografia":
            return "Geografia";

        case "ciencias":
        case "ciencias da natureza":
            return "Ciências";

        default:
            return String(valor || "").trim();
    }
}


// =====================================================
// VALIDAR MATÉRIA DO MURAL
// =====================================================

function materiaMuralValida(valor) {

    const materia =
        normalizarMateriaMural(valor);

    return MATERIAS_MURAL.includes(
        materia
    );
}


module.exports = {
    MATERIAS_MURAL,
    normalizarMateriaMural,
    materiaMuralValida
};