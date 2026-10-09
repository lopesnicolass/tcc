const DIAS_POR_QUANTIDADE = {
  1: ['Quarta'],
  2: ['Terça', 'Quinta'],
  3: ['Segunda', 'Quarta', 'Sexta'],
  4: ['Segunda', 'Terça', 'Quinta', 'Sexta'],
  5: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
  6: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  7: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
};

const PRIORIDADE_LABEL = {
  1: 'Essencial',
  2: 'Importante',
  3: 'Complementar',
};

const ATIVIDADES_DE_PRATICA = [
  {
    materia: 'Prática de prova',
    topico: 'Resolver questões de provas anteriores do Vestibulinho',
    descricao: 'Resolva questões oficiais e anote os assuntos em que teve dificuldade.',
  },
  {
    materia: 'Revisão',
    topico: 'Revisar os conteúdos essenciais estudados',
    descricao: 'Recupere os conceitos sem consultar o material e confira o que esqueceu.',
  },
  {
    materia: 'Prática de prova',
    topico: 'Corrigir erros e reforçar pontos de dificuldade',
    descricao: 'Revise as respostas incorretas e estude os conceitos por trás de cada erro.',
  },
  {
    materia: 'Simulado',
    topico: 'Fazer um bloco de questões cronometradas',
    descricao: 'Treine o tempo de prova e analise os erros depois de responder.',
  },
];

function normalizarNumero(valor, padrao, minimo, maximo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return Math.min(maximo, Math.max(minimo, Math.trunc(numero)));
}

function normalizarTopicos(sessoes) {
  const mapa = new Map();

  (Array.isArray(sessoes) ? sessoes : []).forEach((item, indice) => {
    const id = Number(item.topico_id ?? item.topicoId ?? item.id);
    const nome = String(item.topico ?? item.nome ?? '').trim();
    if (!nome) return;

    const materia = String(item.materia || item.materia_nome || 'Conteúdo').trim();
    const chave = Number.isInteger(id) && id > 0
      ? `id:${id}`
      : `nome:${materia.toLocaleLowerCase('pt-BR')}:${nome.toLocaleLowerCase('pt-BR')}`;

    if (mapa.has(chave)) return;

    const prioridade = normalizarNumero(item.prioridade, 2, 1, 3);
    const frequencia = normalizarNumero(item.frequencia_provas, 0, 0, 3);

    mapa.set(chave, {
      id: Number.isInteger(id) && id > 0 ? id : null,
      materia,
      materiaId: Number(item.materia_id ?? item.materiaId) || null,
      topico: nome,
      descricao: String(item.topico_descricao ?? item.descricao ?? '').trim(),
      prioridade,
      prioridadeLabel: PRIORIDADE_LABEL[prioridade],
      frequenciaProvas: frequencia,
      tempoEstimado: normalizarNumero(item.tempo_estimado_minutos, 45, 15, 240),
      justificativaPrioridade: String(item.justificativa_prioridade || '').trim(),
      fonteFrequencia: String(item.fonte_frequencia || '').trim(),
      // A ordem do tópico é local à matéria; o índice preserva a ordem
      // já organizada pelo catálogo entre matérias diferentes.
      ordemOriginal: indice,
    });
  });

  return [...mapa.values()];
}

function compararPrioridade(a, b) {
  // A prioridade pedagógica sempre vem primeiro. A frequência observada é
  // usada apenas como desempate entre tópicos do mesmo nível.
  if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
  if (a.frequenciaProvas !== b.frequenciaProvas) {
    return b.frequenciaProvas - a.frequenciaProvas;
  }
  if (a.ordemOriginal !== b.ordemOriginal) return a.ordemOriginal - b.ordemOriginal;
  return a.topico.localeCompare(b.topico, 'pt-BR');
}

function chaveTopico(topico) {
  return topico.id
    ? `topico:${topico.id}`
    : `topico:${topico.materia}:${topico.topico}`;
}

function escolherTopicosEquilibrados(topicos, limite) {
  const ordenados = [...topicos].sort(compararPrioridade);
  const quantidade = Math.min(ordenados.length, Math.max(0, limite));
  if (quantidade === 0) return [];

  // Primeiro separa os tópicos por prioridade e, dentro de cada nível,
  // organiza uma fila para cada matéria. Isso garante que um plano curto
  // não troque um tópico essencial por um complementar só para cobrir uma matéria.
  const filasPorPrioridade = new Map([[1, new Map()], [2, new Map()], [3, new Map()]]);

  ordenados.forEach((topico) => {
    const chaveMateria = topico.materia.toLocaleLowerCase('pt-BR');
    const filasDaPrioridade = filasPorPrioridade.get(topico.prioridade);
    if (!filasDaPrioridade.has(chaveMateria)) {
      filasDaPrioridade.set(chaveMateria, []);
    }
    filasDaPrioridade.get(chaveMateria).push(topico);
  });

  const escolhidos = [];

  // Esgota os essenciais antes de passar aos importantes e só então aos
  // complementares. Dentro de cada nível alterna matérias para dar equilíbrio.
  for (const prioridade of [1, 2, 3]) {
    if (escolhidos.length >= quantidade) break;

    const filasDaPrioridade = filasPorPrioridade.get(prioridade);
    const filas = [...filasDaPrioridade.entries()]
      .sort(([, filaA], [, filaB]) => compararPrioridade(filaA[0], filaB[0]))
      .map(([, fila]) => fila);

    let indiceDaFila = 0;
    let houveAdicao = true;

    while (escolhidos.length < quantidade && houveAdicao) {
      houveAdicao = false;
      for (const fila of filas) {
        if (escolhidos.length >= quantidade) break;
        if (fila[indiceDaFila]) {
          escolhidos.push(fila[indiceDaFila]);
          houveAdicao = true;
        }
      }
      indiceDaFila += 1;
    }
  }

  return escolhidos;
}

function criarItemPratica(slot, indicePratica) {
  const atividade = ATIVIDADES_DE_PRATICA[indicePratica % ATIVIDADES_DE_PRATICA.length];

  return {
    materia: atividade.materia,
    materiaId: null,
    topico: atividade.topico,
    topicoId: null,
    descricao: atividade.descricao,
    prioridade: 1,
    prioridadeLabel: 'Prática',
    frequenciaProvas: 0,
    tempoEstimado: 45,
    key: `pratica:${slot.mes}:${slot.semana}:${slot.dia}`,
    tipo: 'pratica',
  };
}

/**
 * Gera um plano a partir dos tópicos ativos do catálogo.
 * Cada sessão comporta um tópico ou uma atividade de prática; no último dia
 * de estudo da quarta semana de cada mês fica reservada uma revisão mensal.
 * Os tópicos essenciais entram primeiro, seguidos dos importantes e, depois,
 * dos complementares. A recorrência observada só desempata a mesma prioridade.
 */
export function gerarPlanoPrioritario(meses, quantidadeDias, sessoes) {
  const mesesValidos = normalizarNumero(meses, 1, 1, 12);
  const diasValidos = normalizarNumero(quantidadeDias, 3, 1, 7);
  const diasDaSemana = DIAS_POR_QUANTIDADE[diasValidos];
  const topicos = normalizarTopicos(sessoes);
  if (!topicos.length) return [];

  const slots = [];
  const slotsDeConteudo = [];

  for (let mes = 1; mes <= mesesValidos; mes += 1) {
    for (let semana = 1; semana <= 4; semana += 1) {
      diasDaSemana.forEach((dia, indiceDia) => {
        const slot = {
          mes,
          semana,
          dia,
          items: [],
          revisao: semana === 4 && indiceDia === diasDaSemana.length - 1,
        };
        slots.push(slot);
        if (!slot.revisao) slotsDeConteudo.push(slot);
      });
    }
  }

  const topicosEscolhidos = escolherTopicosEquilibrados(
    topicos,
    slotsDeConteudo.length,
  );

  let indiceTopico = 0;
  let indicePratica = 0;

  // O conteúdo entra em sessões consecutivas para que um plano curto comece
  // pelos fundamentos, sem deixar lacunas artificiais entre tópicos.
  slotsDeConteudo.forEach((slot) => {
    const topico = topicosEscolhidos[indiceTopico];

    if (topico) {
      slot.items.push({
        materia: topico.materia,
        materiaId: topico.materiaId,
        topico: topico.topico,
        topicoId: topico.id,
        descricao: topico.descricao,
        prioridade: topico.prioridade,
        prioridadeLabel: topico.prioridadeLabel,
        frequenciaProvas: topico.frequenciaProvas,
        tempoEstimado: topico.tempoEstimado,
        justificativaPrioridade: topico.justificativaPrioridade,
        fonteFrequencia: topico.fonteFrequencia,
        key: chaveTopico(topico),
        tipo: 'conteudo',
      });
      indiceTopico += 1;
    } else {
      slot.items.push(criarItemPratica(slot, indicePratica));
      indicePratica += 1;
    }
  });

  slots.filter((slot) => slot.revisao).forEach((slot) => {
    slot.items.push({
      materia: 'Prática de prova',
      materiaId: null,
      topico: 'Revisão mensal e questões de provas anteriores',
      topicoId: null,
      descricao: 'Revise os conteúdos estudados no mês e pratique com provas e gabaritos oficiais anteriores do Vestibulinho.',
      prioridade: 1,
      prioridadeLabel: 'Prática',
      frequenciaProvas: 0,
      tempoEstimado: 45,
      key: `revisao:${slot.mes}`,
      tipo: 'pratica',
    });
  });

  const agora = new Date();
  return Array.from({ length: mesesValidos }, (_, indiceMes) => {
    const data = new Date(agora.getFullYear(), agora.getMonth() + indiceMes, 1);
    const semanas = Array.from({ length: 4 }, (_, indiceSemana) => ({
      number: indiceSemana + 1,
      days: diasDaSemana.map((dia) => {
        const slot = slots.find((item) =>
          item.mes === indiceMes + 1
          && item.semana === indiceSemana + 1
          && item.dia === dia,
        );
        return { day: dia, items: slot?.items || [] };
      }),
    }));

    return {
      numero: indiceMes + 1,
      nome: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      semanas,
    };
  });
}

export function resumirPrioridades(plano, sessoesOriginais) {
  const escolhidos = new Set(
    (plano || []).flatMap((mes) => mes.semanas.flatMap((semana) =>
      semana.days.flatMap((dia) => dia.items
        .filter((item) => item.tipo === 'conteudo')
        .map((item) => item.key)),
    )),
  );
  const unicos = normalizarTopicos(sessoesOriginais);
  const selecionados = unicos.filter((topico) => escolhidos.has(chaveTopico(topico)));
  const materiasDisponiveis = [...new Set(unicos.map((item) => item.materia))];
  const materiasSelecionadas = new Set(selecionados.map((item) => item.materia));
  const materiasFaltantes = materiasDisponiveis.filter((materia) => !materiasSelecionadas.has(materia));

  return {
    totalDisponiveis: unicos.length,
    totalSelecionados: selecionados.length,
    materiasDisponiveis: materiasDisponiveis.length,
    materiasNoPlano: materiasSelecionadas.size,
    materiasFaltantes,
    essenciais: selecionados.filter((item) => item.prioridade === 1).length,
    importantes: selecionados.filter((item) => item.prioridade === 2).length,
    complementares: selecionados.filter((item) => item.prioridade === 3).length,
    foraDoPlano: Math.max(0, unicos.length - selecionados.length),
    recorrenciaNaoAnalisada: unicos.filter((item) => item.frequenciaProvas === 0).length,
  };
}

export function rotuloFrequencia(frequencia) {
  const rotulos = {
    0: 'Recorrência ainda não analisada',
    1: 'Baixa recorrência observada',
    2: 'Recorrência observada',
    3: 'Alta recorrência observada',
  };
  return rotulos[normalizarNumero(frequencia, 0, 0, 3)];
}