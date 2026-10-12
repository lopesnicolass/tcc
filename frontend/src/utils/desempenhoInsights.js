// Indicadores derivados dos resultados reais. Não estimamos acertos por questão
// ou por assunto quando o simulado não tem vínculo com um tópico cadastrado.
const NOMES = {
  portugues: 'Português',
  matematica: 'Matemática',
  historia: 'História',
  geografia: 'Geografia',
  ciencias: 'Ciências'
};

function normalizarChave(valor) {
  return String(valor ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function normalizarMateriaDesempenho(valor) {
  const chave = normalizarChave(valor);
  if (chave === 'lingua portuguesa') return 'Português';
  if (chave === 'ciencias da natureza') return 'Ciências';
  if (NOMES[chave]) return NOMES[chave];
  if (!chave || ['geral', 'misto', 'simulado geral', 'simulados gerais', 'geral/misto'].includes(chave)) {
    return null;
  }
  return String(valor).trim();
}

function dadosValidos(item) {
  const total = Number(item?.total_questoes ?? item?.totalQuestoes);
  const acertos = Number(item?.acertos);
  if (!Number.isFinite(total) || !Number.isFinite(acertos) || total <= 0 || acertos < 0 || acertos > total) {
    return null;
  }
  return { total, acertos };
}

function agrupar(registros, criarChave) {
  const mapa = new Map();
  for (const registro of registros) {
    const info = dadosValidos(registro);
    const chave = criarChave(registro);
    if (!info || !chave?.id) continue;

    const atual = mapa.get(chave.id) || {
      id: chave.id,
      nome: chave.nome,
      materia: chave.materia ?? null,
      topicoId: chave.topicoId ?? null,
      acertos: 0,
      questoes: 0,
      tentativas: 0
    };
    atual.acertos += info.acertos;
    atual.questoes += info.total;
    atual.tentativas += 1;
    mapa.set(chave.id, atual);
  }
  return [...mapa.values()].map((item) => ({
    ...item,
    percentual: Math.round(100 * item.acertos / item.questoes),
    amostraInicial: item.questoes < 20
  })).sort((a, b) => a.percentual - b.percentual || b.questoes - a.questoes || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function analisarResultadosPorMateria(resultados) {
  const lista = Array.isArray(resultados) ? resultados : [];
  return agrupar(lista, (resultado) => {
    const nome = normalizarMateriaDesempenho(resultado?.materia);
    return nome ? { id: normalizarChave(nome), nome } : null;
  });
}

export function analisarResultadosPorAssunto(resultados) {
  const lista = Array.isArray(resultados) ? resultados : [];
  return agrupar(lista, (resultado) => {
    const materia = normalizarMateriaDesempenho(resultado?.materia);
    const nome = typeof resultado?.assunto === 'string' ? resultado.assunto.trim() : '';
    if (!materia || !nome) return null;
    const idNumerico = Number(resultado.topico_id);
    const topicoId = Number.isInteger(idNumerico) && idNumerico > 0 ? idNumerico : null;
    return {
      id: topicoId ? `topico-${topicoId}` : `${normalizarChave(materia)}-${normalizarChave(nome)}`,
      nome,
      materia,
      topicoId
    };
  });
}

export function resumirEvolucao(resultadosCronologicos) {
  const validos = (Array.isArray(resultadosCronologicos) ? resultadosCronologicos : [])
    .filter((item) => Number.isFinite(Number(item?.porcentagem)) && item?.porcentagem !== null);
  if (validos.length < 2) return null;
  const janela = Math.min(3, Math.floor(validos.length / 2));
  const recentes = validos.slice(-janela);
  const anteriores = validos.slice(-2 * janela, -janela);
  const media = (itens) => itens.reduce((soma, item) => soma + Number(item.porcentagem), 0) / itens.length;
  const diferenca = Math.round((media(recentes) - media(anteriores)) * 10) / 10;
  return {
    diferenca,
    recentes: recentes.length,
    anteriores: anteriores.length,
    mediaRecente: Math.round(media(recentes)),
    mediaAnterior: Math.round(media(anteriores))
  };
}

export function sugerirRevisoes(resultados, limite = 3) {
  const materias = analisarResultadosPorMateria(resultados);
  const assuntos = analisarResultadosPorAssunto(resultados);
  // Um assunto por matéria, para apresentar variedade. A classificação final
  // leva em conta o aproveitamento, não a ordem dos cartões na página.
  const menorAssunto = new Map();
  for (const assunto of assuntos) {
    if (!menorAssunto.has(assunto.materia)) menorAssunto.set(assunto.materia, assunto);
  }
  const sugestoes = materias.map((materia) => {
    const assunto = menorAssunto.get(materia.nome);
    return assunto ? { ...assunto, tipo: 'assunto' } : { ...materia, tipo: 'materia' };
  });
  return sugestoes.sort((a, b) => a.percentual - b.percentual || b.questoes - a.questoes).slice(0, limite);
}
