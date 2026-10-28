import { reagendarDatasPlano, lerDataLocal, validarDiasSemana } from './planoProgramado.js';
// Sessões preservam uma chave estável mesmo que o estudante ajuste os dias.
export function chaveSessaoPlano(item, mes, semana, diaIndex, itemIndex) {
  const identificador = String(item?.key || `${mes.numero}-${semana.number}-${diaIndex}-${itemIndex}`);
  return `plano-automatico:${identificador}`;
}

const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];
const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const pad = (numero) => String(numero).padStart(2, '0');

export function sugerirDataSessao(mes, semana, dia) {
  // Os novos planos possuem a data civil exata; o cálculo legado é só fallback.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dia?.data || '')) return dia.data;
  const titulo = normalizar(mes?.nome);
  const numeroMes = MESES.findIndex((nome) => titulo.includes(nome));
  const anoEncontrado = titulo.match(/\b(20\d{2})\b/);
  const hoje = new Date();
  const primeiro = numeroMes >= 0 && anoEncontrado
    ? new Date(Number(anoEncontrado[1]), numeroMes, 1)
    : new Date(hoje.getFullYear(), hoje.getMonth() + (Number(mes?.numero || 1) - 1), 1);
  const indiceDia = DIAS.findIndex((nome) => normalizar(dia?.day).startsWith(nome));
  const diaSemana = indiceDia < 0 ? 1 : indiceDia;
  const distancia = (diaSemana - primeiro.getDay() + 7) % 7;
  const diaDoMes = 1 + distancia + 7 * Math.max(0, Number(semana?.number || 1) - 1);
  const data = new Date(primeiro.getFullYear(), primeiro.getMonth(), diaDoMes);
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export function sessaoJaAgendada(atividades, origem) {
  return Array.isArray(atividades) && atividades.some((atividade) => atividade.origem === origem);
}

// Evita sugerir 08:00 quando já são 20:00, respeitando o timezone do navegador.
export function sugerirAgendamentoFuturo(dataDesejada, agora = new Date()) {
  const today = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const hoje = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const inicio = new Date(agora.getTime() + 15 * 60000);
  inicio.setSeconds(0, 0);
  const arredondar = inicio.getMinutes() % 15;
  if (arredondar) inicio.setMinutes(inicio.getMinutes() + (15 - arredondar));
  const dataMinima = `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`;
  const data = dataDesejada && dataDesejada > dataMinima ? dataDesejada : dataMinima;
  return { data, horario: data === dataMinima ? `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}` : '18:00', hoje };
}

// Atividades geradas pelo Cronograma podem ser registradas no histórico,
// inclusive com datas anteriores a hoje. Agendamentos manuais seguem outra regra.
export function agendamentoValido(data, horario) {
  return Boolean(lerDataLocal(data)) && /^([01]\d|2[0-3]):[0-5]\d$/.test(horario || '');
}

export function agendamentoNoFuturo(data, horario, agora = new Date()) {
  if (!agendamentoValido(data, horario)) return false;
  const [ano, mes, dia] = data.split('-').map(Number);
  const [hora, minuto] = horario.split(':').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto).getTime() > agora.getTime();
}

// Ao agendar uma sessão isolada, a exceção retroativa vale somente para
// sua data original. Alterações para outras datas continuam exigindo o futuro.
export function dataPermitidaSessaoPlano(data, horario, dataPrevista, agora = new Date()) {
  return agendamentoValido(data, horario) &&
    (data === dataPrevista || agendamentoNoFuturo(data, horario, agora));
}

// As atividades do plano respeitam o mês civil e a data da semana, mesmo quando
// a escolha dos dias é feita após o começo do mês. Não transferir atrasadas.
export function prepararAgendamentoCompleto(plano, { diasSemana, horarioInicial, atividadesExistentes = [], topicosEstudados = {}, agora = new Date() } = {}) {
  const totalDias = plano?.[0]?.semanas?.[0]?.days?.length || 0;
  if (!validarDiasSemana(diasSemana, totalDias)) return { erro: `Selecione ${totalDias} dias da semana.` };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horarioInicial || '')) return { erro: 'Escolha um horário de início válido.' };

  const [hora, minuto] = horarioInicial.split(':').map(Number);

  const redistribuido = reagendarDatasPlano(plano, { diasSemana, inicio: plano[0].inicio });
  if (!redistribuido.length) return { erro: 'Não foi possível distribuir as sessões nesses dias.' };

  const jaAgendadas = new Set(atividadesExistentes.map((a) => a.origem).filter(Boolean));
  const ocupados = new Set(atividadesExistentes.map((a) => `${a.data}|${a.horario}`));
  const novas = [];
  let ignoradas = 0;
  let concluidas = 0;
  let total = 0;
  let anteriores = 0;

  for (const mes of redistribuido) {
    for (const semana of mes.semanas) {
      for (let indiceDia = 0; indiceDia < semana.days.length; indiceDia++) {
        const dia = semana.days[indiceDia];
        const pendentes = [];
        for (let indiceItem = 0; indiceItem < dia.items.length; indiceItem++) {
          const item = dia.items[indiceItem];
          total += 1;
          const origem = chaveSessaoPlano(item, mes, semana, indiceDia, indiceItem);
          if (jaAgendadas.has(origem)) { ignoradas += 1; continue; }
          if (item.topicoId && topicosEstudados[String(item.topicoId)]) { concluidas += 1; continue; }
          pendentes.push({ item, origem });
        }
        if (!pendentes.length) continue;

        // Mantém a data exata do modelo, mesmo que ela já tenha passado.
        const dataAgendada = dia.data;
        if (!lerDataLocal(dataAgendada)) return { erro: 'Há uma data inválida no cronograma.' };
        let proximoMinuto = hora * 60 + minuto;
        for (const { item, origem } of pendentes) {
          // Um dia com dois ou mais conteúdos recebe horários consecutivos.
          while (proximoMinuto < 24 * 60 && ocupados.has(`${dataAgendada}|${pad(Math.floor(proximoMinuto / 60))}:${pad(proximoMinuto % 60)}`)) {
            proximoMinuto += 60;
          }
          if (proximoMinuto >= 24 * 60) {
            return { erro: `Não há horários suficientes em ${dataAgendada}. Escolha um horário de início mais cedo.` };
          }
          const horario = `${pad(Math.floor(proximoMinuto / 60))}:${pad(proximoMinuto % 60)}`;
          if (!agendamentoValido(dataAgendada, horario)) {
            return { erro: 'Há um horário inválido no cronograma.' };
          }
          if (!agendamentoNoFuturo(dataAgendada, horario, agora)) anteriores += 1;
          novas.push({ nome: item.topico, materia: item.materia || 'Outro', data: dataAgendada,
            horario, topicoId: item.topicoId || null, done: false, origem });
          ocupados.add(`${dataAgendada}|${horario}`);
          proximoMinuto += 60;
        }
      }
    }
  }
  return { plano: redistribuido, atividades: novas, jaAgendadas: ignoradas,
    concluidas, anteriores, total, inicio: novas[0]?.data || redistribuido[0].inicio,
    inicioPlano: redistribuido[0].inicio, diasSemana: [...diasSemana] };
}


// O calendário pode conter um plano parcialmente agendado. Recupera os dias e
// o horário conhecido, sem inventar dias extras nem trazer dados de outro plano.
export function recuperarConfiguracaoAgenda(plano, atividades = [], quantidadeDias = 0) {
  const origens = new Set((plano || []).flatMap((mes) => mes.semanas.flatMap((semana) =>
    semana.days.flatMap((dia, diaIndex) => dia.items.map((item, itemIndex) =>
      chaveSessaoPlano(item, mes, semana, diaIndex, itemIndex))))));
  const encontradas = (atividades || []).filter((a) => origens.has(a.origem) && lerDataLocal(a.data) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(a.horario || ''));
  const diasSemana = [];
  for (const atividade of encontradas) {
    const dia = lerDataLocal(atividade.data).getDay();
    if (!diasSemana.includes(dia) && diasSemana.length < quantidadeDias) diasSemana.push(dia);
  }
  const horarios = encontradas.map((a) => a.horario).sort();
  return { diasSemana: diasSemana.sort((a, b) => a - b), horario: horarios[0] || null };
}

// Progresso (conteúdo estudado) e agendamento (sessão no Calendário) são independentes.
export function resumoSemanaPlano(mes, semana, atividades = [], topicosEstudados = {}) {
  const itens = semana.days.flatMap((dia, diaIndex) => dia.items.map((item, itemIndex) =>
    ({ item, origem: chaveSessaoPlano(item, mes, semana, diaIndex, itemIndex) })));
  const ids = [...new Set(itens.filter(({ item }) => item.topicoId).map(({ item }) => String(item.topicoId)))];
  const estudados = ids.filter((id) => Boolean(topicosEstudados[id])).length;
  const origensAgendadas = new Set((atividades || []).map((a) => a.origem).filter(Boolean));
  const agendadas = itens.filter(({ origem }) => origensAgendadas.has(origem)).length;
  const progresso = itens.length === 0 ? 'Sem atividades'
    : ids.length > 0 && estudados === ids.length ? 'Concluída'
      : estudados > 0 ? 'Em andamento' : 'Pendente';
  const agendamento = itens.length === 0 ? 'Sem sessões'
    : agendadas === 0 ? 'Sem agendamento'
      : agendadas === itens.length ? 'Agendada'
        : `${agendadas} de ${itens.length} agendadas`;
  return { progresso, agendamento, total: itens.length, agendadas, estudados };
}

// Move apenas a sessão escolhida; a chave do ADM permanece igual para persistência
// e para a sincronização, sem modificar o cadastro administrativo.
export function moverSessaoNaSemana(plano, mesNumero, semanaNumero, diaOrigem, itemIndex, diaDestino) {
  const mesIndex = plano?.findIndex((mes) => mes.numero === mesNumero) ?? -1;
  const semanaIndex = plano?.[mesIndex]?.semanas?.findIndex((semana) => semana.number === semanaNumero) ?? -1;
  const semana = plano?.[mesIndex]?.semanas?.[semanaIndex];
  if (!semana || !Number.isInteger(diaOrigem) || !Number.isInteger(itemIndex) ||
    !Number.isInteger(diaDestino) || diaDestino < 0 || diaDestino >= semana.days.length ||
    diaOrigem < 0 || diaOrigem >= semana.days.length || diaOrigem === diaDestino ||
    !semana.days[diaOrigem].items[itemIndex]) return plano;
  return plano.map((mes, indiceMes) => indiceMes !== mesIndex ? mes : {
    ...mes, semanas: mes.semanas.map((atual, indiceSemana) => indiceSemana !== semanaIndex ? atual : {
      ...atual, days: atual.days.map((dia, i) => {
        if (i === diaOrigem) return { ...dia, items: dia.items.filter((_, index) => index !== itemIndex) };
        if (i === diaDestino) return { ...dia, items: [...dia.items, semana.days[diaOrigem].items[itemIndex]] };
        return dia;
      }),
    }),
  });
}
