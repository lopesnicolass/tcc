const TEMAS = ["azul", "violeta", "verde", "coral"];
const FORMATOS = ["trilha", "cartoes"];

const PADRAO = Object.freeze({
    tema: "azul",
    formato: "trilha",
    rotulo: "TRILHA DE APRENDIZAGEM",
    mensagem: "Um passo de cada vez. Você consegue!",
    minutos: 8,
    mostrarIndice: true
});

function normalizarAparencia(entrada) {
    if (entrada === undefined || entrada === null || entrada === "") {
        return { ...PADRAO };
    }
    if (typeof entrada === "string") {
        try { entrada = JSON.parse(entrada); }
        catch { throw new TypeError("Configuração visual inválida."); }
    }
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
        throw new TypeError("Configuração visual inválida.");
    }
    const tema = entrada.tema ?? PADRAO.tema;
    const formato = entrada.formato ?? PADRAO.formato;
    if (!TEMAS.includes(tema) || !FORMATOS.includes(formato)) {
        throw new TypeError("Tema ou formato de conteúdo inválido.");
    }
    if (entrada.minutos !== undefined && (!Number.isInteger(Number(entrada.minutos)) || Number(entrada.minutos) < 1 || Number(entrada.minutos) > 180)) {
        throw new TypeError("O tempo de leitura deve ficar entre 1 e 180 minutos.");
    }
    const rotulo = String(entrada.rotulo ?? PADRAO.rotulo).trim().slice(0, 48);
    const mensagem = String(entrada.mensagem ?? PADRAO.mensagem).trim().slice(0, 180);
    if (entrada.mostrarIndice !== undefined && typeof entrada.mostrarIndice !== "boolean") {
        throw new TypeError("A opção de índice deve ser verdadeira ou falsa.");
    }
    return {
        tema, formato,
        rotulo,
        mensagem,
        minutos: entrada.minutos === undefined ? PADRAO.minutos : Number(entrada.minutos),
        mostrarIndice: entrada.mostrarIndice ?? PADRAO.mostrarIndice
    };
}
module.exports = { normalizarAparencia, PADRAO };
