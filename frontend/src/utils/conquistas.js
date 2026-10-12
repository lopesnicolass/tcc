// Conquistas calculadas exclusivamente a partir de informações da conta.
// Não são concedidos XP extra nem medalhas por interações apenas visuais.

export const CATEGORIAS_CONQUISTAS = ['Todas', 'Conteúdos', 'Simulados', 'Flashcards', 'Consistência'];

function inteiroNaoNegativo(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.floor(numero)) : 0;
}

export function calcularNivelPorXp(xp, xpForLevel) {
  let nivel = 1;
  let xpAtual = inteiroNaoNegativo(xp);
  while (xpAtual >= xpForLevel(nivel)) {
    xpAtual -= xpForLevel(nivel);
    nivel += 1;
  }
  return { nivel, xpNoNivel: xpAtual, xpProximoNivel: xpForLevel(nivel) };
}

/**
 * Valores null indicam que a respectiva API não foi consultada com sucesso;
 * arrays vazios indicam dados carregados, mas nenhuma atividade registrada.
 */
export function montarConquistas({ resultados, topicos, sessoes, gamificacao } = {}) {
  const totalConteudos = Array.isArray(topicos)
    ? new Set(topicos.filter((item) => Boolean(item?.estudado)).map((item) => String(item.topico_id))).size
    : null;
  const tentativas = Array.isArray(resultados) ? resultados.length : null;
  const notasMaximas = Array.isArray(resultados)
    ? resultados.filter((item) => Number(item?.total_questoes) > 0 && Number(item?.porcentagem) >= 100).length
    : null;
  const sessoesConcluidas = Array.isArray(sessoes)
    ? sessoes.filter((item) => Boolean(item?.data_fim)).length
    : null;
  const xp = gamificacao && Number.isFinite(Number(gamificacao.xp))
    ? inteiroNaoNegativo(gamificacao.xp)
    : null;
  const sequencia = gamificacao && Number.isFinite(Number(gamificacao.streak))
    ? inteiroNaoNegativo(gamificacao.streak)
    : null;

  const metas = [
    { id: 'primeiro-conteudo', categoria: 'Conteúdos', titulo: 'Primeiro passo', descricao: 'Estude seu primeiro conteúdo.', meta: 1, valor: totalConteudos, icone: 'book', destino: '/conteudos' },
    { id: 'cinco-conteudos', categoria: 'Conteúdos', titulo: 'Explorador do saber', descricao: 'Estude 5 conteúdos.', meta: 5, valor: totalConteudos, icone: 'layers', destino: '/conteudos' },
    { id: 'quinze-conteudos', categoria: 'Conteúdos', titulo: 'Colecionador de conhecimento', descricao: 'Estude 15 conteúdos.', meta: 15, valor: totalConteudos, icone: 'book', destino: '/conteudos' },
    { id: 'primeiro-simulado', categoria: 'Simulados', titulo: 'Primeiro desafio', descricao: 'Conclua seu primeiro simulado.', meta: 1, valor: tentativas, icone: 'checkSquare', destino: '/simulados' },
    { id: 'cinco-simulados', categoria: 'Simulados', titulo: 'Treino constante', descricao: 'Conclua 5 simulados.', meta: 5, valor: tentativas, icone: 'target', destino: '/simulados' },
    { id: 'nota-maxima', categoria: 'Simulados', titulo: 'Nota máxima', descricao: 'Acerte 100% em um simulado.', meta: 1, valor: notasMaximas, icone: 'trophy', destino: '/simulados' },
    { id: 'primeira-rodada', categoria: 'Flashcards', titulo: 'Memória em ação', descricao: 'Conclua uma rodada de flashcards.', meta: 1, valor: sessoesConcluidas, icone: 'layers', destino: '/flashcards' },
    { id: 'cinco-rodadas', categoria: 'Flashcards', titulo: 'Revisão frequente', descricao: 'Conclua 5 rodadas de flashcards.', meta: 5, valor: sessoesConcluidas, icone: 'refresh', destino: '/flashcards' },
    { id: 'sequencia-tres', categoria: 'Consistência', titulo: 'Três dias seguidos', descricao: 'Mantenha uma sequência de 3 dias.', meta: 3, valor: sequencia, icone: 'calendar', destino: '/home' },
    { id: 'xp-quinhentos', categoria: 'Consistência', titulo: 'Rumo ao topo', descricao: 'Acumule 500 XP.', meta: 500, valor: xp, icone: 'highlight', destino: '/home' }
  ];

  return metas.map((item) => {
    const verificado = item.valor !== null;
    const desbloqueada = verificado && item.valor >= item.meta;
    const progresso = verificado ? Math.min(item.valor, item.meta) : 0;
    return {
      ...item,
      verificado,
      desbloqueada,
      progresso,
      porcentagem: verificado ? Math.round(progresso / item.meta * 100) : 0
    };
  });
}
