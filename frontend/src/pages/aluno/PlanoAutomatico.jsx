import '../../styles/aluno/PlanoAutomatico.css';
import '../../styles/aluno/PlanoAutomaticoRedesign.css';
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  useNavigate
} from 'react-router-dom';
import SubjectIcon
  from '../../components/SubjectIcon.jsx';
import Icon
  from '../../components/Icon.jsx';
import { API_URL, request, obterToken } from '../../services/api.js';
import { gerarPlanoProgramado, reagendarDatasPlano, avaliarPrazoPlanoReal,
  diasPadrao, validarDiasSemana, NOMES_DIAS, formatarPeriodo, dataCivil, inicioDoMes } from '../../utils/planoProgramado.js';
import { getSubjectStyle } from '../../utils/subjects.js';
import { chaveSessaoPlano, sugerirDataSessao, sessaoJaAgendada, dataPermitidaSessaoPlano, agendamentoNoFuturo, prepararAgendamentoCompleto, recuperarConfiguracaoAgenda, resumoSemanaPlano, moverSessaoNaSemana } from '../../utils/planoCalendario.js';
import { enviarPlanoCalendario } from '../../utils/enviarPlanoCalendario.js';
// Paleta exclusiva da trilha: preserva a identidade do Tenna e diferencia as matérias.
const PALETTE_STUDY = {
  matematica: { color: '#C73C4B', bg: '#FFF0F1' },
  portugues: { color: '#146CC7', bg: '#EAF5FF' },
  historia: { color: '#996331', bg: '#FDF3E7' },
  geografia: { color: '#268452', bg: '#EAF8EF' },
  ciencias: { color: '#7B49B4', bg: '#F4ECFF' },
};
function corMateriaPlano(materia) {
  const slug = String(materia || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const key = Object.keys(PALETTE_STUDY).find((nome) => slug.includes(nome));
  return key ? PALETTE_STUDY[key] : getSubjectStyle(materia || 'Outro');
}

const STORAGE_KEY =
  'tenna_plano_automatico';
const pad = (n) =>
  String(n).padStart(2, '0');
function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'etecamp_usuario'
      ) || '{}'
    );
  } catch {
    return {};
  }
}
function getUserKey() {
  const usuario =
    getUser();
  return String(
    usuario.id ||
    usuario.usuarioId ||
    'anonimo'
  );
}
function carregarPlanoSalvo(valorExterno = undefined) {
  try {
    const valor = valorExterno === undefined
      ? JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${getUserKey()}`) || 'null') : valorExterno;
    const plano = Array.isArray(valor) ? valor : valor?.plan;
    if (!valor?.modeloId || !Array.isArray(plano) || plano.length === 0 || !plano.every((mes) =>
      Array.isArray(mes?.semanas) && mes.semanas.every((semana) =>
        Array.isArray(semana?.days) && semana.days.every((dia) => Array.isArray(dia?.items))
      )
    )) return null;
    // Planos salvos antes da correção começavam na data de geração.
    // Realinha as datas ao primeiro dia daquele mesmo mês, sem perder sessões.
    const diasSalvos = validarDiasSemana(valor.diasSemana, Number(valor.days || 3))
      ? valor.diasSemana : diasPadrao(Number(valor.days || 3));
    const inicio = inicioDoMes(valor.inicio || plano[0]?.inicio || new Date());
    const planoCorrigido = inicio && (plano[0]?.inicio !== inicio ||
      !plano.every((mes, index) => mes.inicio?.slice(8) === '01'))
      ? reagendarDatasPlano(plano, { inicio, diasSemana: diasSalvos }) : plano;
    return {
      plan: planoCorrigido,
      months: Array.isArray(valor) ? plano.length : Number(valor.months || plano.length),
      days: Number(valor.days || 3),
      modeloId: Number(valor.modeloId),
      modeloAtualizadoEm: valor.modeloAtualizadoEm || null,
      modeloVersao: valor.modeloVersao || null,
      salvoEm: Number(valor.salvoEm || 0),
      diasSemana: diasSalvos,
      diasPersonalizados: Boolean(valor.diasPersonalizados),
      inicio,
    };
  } catch {
    return null;
  }
}
let ultimaGravacao = 0;
function gravarNoNavegador(dados) {
  try { localStorage.setItem(`${STORAGE_KEY}_${getUserKey()}`, JSON.stringify(dados)); }
  catch (erro) { console.warn('Não foi possível salvar localmente:', erro); }
}
function enviarPlanoServidor(dados) {
  if (!obterToken() || !(getUser().id || getUser().usuarioId)) return Promise.resolve();
  return request('/cronogramas-modelos/meu-plano', {
    method: 'PUT', body: JSON.stringify({ plano: dados, salvoEm: dados.salvoEm }),
  }, 'Não foi possível sincronizar o cronograma.');
}
function savePlan(plan, months, days, modeloId, modeloAtualizadoEm, diasSemana, inicio, diasPersonalizados = false, modeloVersao = null) {
  ultimaGravacao = Math.max(Date.now(), ultimaGravacao + 1);
  const anterior = carregarPlanoSalvo();
  const dados = { plan, months, days, modeloId, modeloAtualizadoEm,
    modeloVersao: modeloVersao ?? (anterior?.modeloId === modeloId ? anterior.modeloVersao : null),
    diasSemana, inicio, diasPersonalizados, salvoEm: ultimaGravacao };
  gravarNoNavegador(dados);
  return enviarPlanoServidor(dados).catch(erro => {
    window.dispatchEvent(new CustomEvent('tenna-plano-nao-sincronizado', { detail: erro.message }));
  });
}
async function sincronizarAntesDeAgendar(plan, config) {
  const local = carregarPlanoSalvo();
  if (!plan || !local) throw new Error('Salve seu cronograma antes de agendar.');
  const salvoEm = Math.max(Number(local.salvoEm || 0), Date.now());
  await request('/cronogramas-modelos/meu-plano', { method: 'PUT',
    body: JSON.stringify({ plano: { ...local, plan, salvoEm }, salvoEm }),
  }, 'Não foi possível sincronizar o cronograma antes do agendamento.');
}

export default function PlanoAutomatico() {
  const navigate =
    useNavigate();
  const planoAnterior = useMemo(() => carregarPlanoSalvo(), []);
  const [
    months,
    setMonths
  ] =
    useState(planoAnterior?.months || 6);
  const [
    days,
    setDays
  ] =
    useState(planoAnterior?.days || 3);
  const [diasSemana, setDiasSemana] = useState(planoAnterior?.diasSemana || diasPadrao(planoAnterior?.days || 3));
  const [plan, setPlan] = useState(planoAnterior?.plan || null);
  const [inicioPlano, setInicioPlano] = useState(planoAnterior?.inicio || null);
  const [configSalva, setConfigSalva] = useState(() => ({
    months: planoAnterior?.months || 6, days: planoAnterior?.days || 3,
    diasSemana: planoAnterior?.diasSemana || diasPadrao(planoAnterior?.days || 3),
    diasPersonalizados: Boolean(planoAnterior?.diasPersonalizados),
    inicio: planoAnterior?.inicio || null,
    modeloId: planoAnterior?.modeloId || null,
    modeloAtualizadoEm: planoAnterior?.modeloAtualizadoEm || null,
    modeloVersao: planoAnterior?.modeloVersao || null,
  }));
  const [selected, setSelected] = useState(() => {
    try { return Number(sessionStorage.getItem(`tenna_mes_plano_${getUserKey()}`)) || 1; }
    catch { return 1; }
  });
  const [openWeeks, setOpenWeeks] = useState(() => {
    try {
      const chave = sessionStorage.getItem(`tenna_semana_plano_${getUserKey()}`);
      return new Set([chave && /^\d+-[1-4]$/.test(chave) ? chave : '1-1']);
    } catch { return new Set(['1-1']); }
  });
  const [
    syncingPlan,
    setSyncingPlan
  ] =
    useState(false);
  const [
    syncError,
    setSyncError
  ] =
    useState('');
  const [, setCronogramaModelo] = useState(null);
  const [
    ,
    setCarregandoModelo
  ] =
    useState(true);
  const [
    ,
    setModeloError
  ] =
    useState('');
  const [editandoPlano, setEditandoPlano] = useState(false);
  // Personalização opcional: a configuração principal continua sendo meses + dias por semana.
  const [personalizandoDias, setPersonalizandoDias] = useState(false);
  const [diasRascunho, setDiasRascunho] = useState([]);
  const [erroPersonalizacao, setErroPersonalizacao] = useState('');
  const [variacoesDisponiveis, setVariacoesDisponiveis] = useState([]);
  const [dataVestibulinho, setDataVestibulinho] = useState(null);
  const [studiedTopics, setStudiedTopics] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [savingTopicId, setSavingTopicId] = useState(null);
  const usuarioId = Number(getUser().id || getUser().usuarioId || 0);
  const planoHidratadoRemotamente = useRef(false);
  const [atividadesAgenda, setAtividadesAgenda] = useState([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);
  const [erroAgenda, setErroAgenda] = useState('');
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);
  const [dataAgenda, setDataAgenda] = useState('');
  const [horarioAgenda, setHorarioAgenda] = useState('08:00');
  const [salvandoAgenda, setSalvandoAgenda] = useState(false);
  const [erroSalvarAgenda, setErroSalvarAgenda] = useState('');
  const [mensagemAgenda, setMensagemAgenda] = useState('');
  const [avisoPlano, setAvisoPlano] = useState('');
  const [agendandoPlano, setAgendandoPlano] = useState(false);
  const [diasAgendaPlano, setDiasAgendaPlano] = useState([]);
  const [horaAgendaPlano, setHoraAgendaPlano] = useState('19:00');
  const [salvandoPlanoAgenda, setSalvandoPlanoAgenda] = useState(false);
  const [erroPlanoAgenda, setErroPlanoAgenda] = useState('');
  const [organizandoSemana, setOrganizandoSemana] = useState(null);


  // Restaura o plano em qualquer dispositivo, sem perder alterações locais mais recentes.
  useEffect(() => {
    if (!usuarioId || !obterToken()) return;
    let ativo = true;
    const erroSync = evento => { if (ativo) setAvisoPlano('Plano salvo neste navegador, mas ainda não sincronizado. Confira a conexão.'); };
    window.addEventListener('tenna-plano-nao-sincronizado', erroSync);
    request('/cronogramas-modelos/meu-plano', {}, 'Não foi possível consultar seu plano salvo.')
      .then(({ plano: remoto, salvoEm }) => {
        if (!ativo) return;
        const local = carregarPlanoSalvo();
        const validoRemoto = carregarPlanoSalvo(remoto);
        if (validoRemoto && Number(salvoEm || 0) > Number(local?.salvoEm || 0)) {
          const dados = { ...remoto, salvoEm: Number(salvoEm) };
          gravarNoNavegador(dados);
          planoHidratadoRemotamente.current = true;
          setPlan(validoRemoto.plan);
          setMonths(validoRemoto.months);
          setDays(validoRemoto.days);
          setDiasSemana(validoRemoto.diasSemana);
          setInicioPlano(validoRemoto.inicio);
          setConfigSalva({ months: validoRemoto.months, days: validoRemoto.days,
            inicio: validoRemoto.inicio, modeloId: validoRemoto.modeloId,
            modeloAtualizadoEm: validoRemoto.modeloAtualizadoEm,
            modeloVersao: validoRemoto.modeloVersao,
            diasSemana: validoRemoto.diasSemana,
            diasPersonalizados: validoRemoto.diasPersonalizados });
          setAvisoPlano('Seu cronograma foi recuperado da sua conta.');
        } else if (local && (!validoRemoto || Number(local.salvoEm || 0) > Number(salvoEm || 0))) {
          ultimaGravacao = Math.max(Date.now(), ultimaGravacao + 1);
          const dados = { ...local, salvoEm: Math.max(Number(local.salvoEm || 0), ultimaGravacao) };
          gravarNoNavegador(dados);
          enviarPlanoServidor(dados).catch(() => {
            if (ativo) setAvisoPlano('Cronograma local mantido. Não foi possível sincronizá-lo com sua conta.');
          });
        }
      })
      .catch(() => { if (ativo && !carregarPlanoSalvo()) setAvisoPlano('Não foi possível consultar o plano salvo na sua conta.'); });
    return () => { ativo = false; window.removeEventListener('tenna-plano-nao-sincronizado', erroSync); };
  }, [usuarioId]);

  function selecionarSemana(mes, semana) {
    const chave = `${mes}-${semana}`;
    setSelected(mes);
    setOpenWeeks(new Set([chave]));
    try {
      sessionStorage.setItem(`tenna_mes_plano_${getUserKey()}`, String(mes));
      sessionStorage.setItem(`tenna_semana_plano_${getUserKey()}`, chave);
    } catch { /* navegador privado */ }
  }

  async function carregarAtividadesAgenda() {
    if (!usuarioId) return [];
    const resposta = await request(`/cronograma/${usuarioId}`, {}, 'Não foi possível consultar o calendário.');
    const atividades = Array.isArray(resposta.atividades) ? resposta.atividades : [];
    setAtividadesAgenda(atividades);
    return atividades;
  }

  useEffect(() => {
    if (!plan || !usuarioId) return;
    let ativo = true;
    queueMicrotask(() => {
      if (ativo) { setCarregandoAgenda(true); setErroAgenda(''); }
    });
    request(`/cronograma/${usuarioId}`, {}, 'Não foi possível carregar o calendário.')
      .then((resposta) => {
        if (ativo) setAtividadesAgenda(Array.isArray(resposta.atividades) ? resposta.atividades : []);
      })
      .catch((erro) => { if (ativo) setErroAgenda(erro.message || 'Não foi possível carregar o calendário.'); })
      .finally(() => { if (ativo) setCarregandoAgenda(false); });
    return () => { ativo = false; };
  }, [plan, usuarioId]);

  useEffect(() => {
    if (!sessaoSelecionada) return;
    function fecharComEscape(evento) {
      if (evento.key === 'Escape' && !salvandoAgenda) setSessaoSelecionada(null);
    }
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [sessaoSelecionada, salvandoAgenda]);

  async function abrirAgendamentoCompleto() {
    setErroPlanoAgenda('');
    let atividades = atividadesAgenda;
    try {
      if (usuarioId) atividades = await carregarAtividadesAgenda();
    } catch {
      // Continua com os dados locais, mas informa a falha no modal.
      setErroPlanoAgenda('Não foi possível atualizar o Calendário. Confira sua conexão antes de confirmar.');
    }
    const anterior = recuperarConfiguracaoAgenda(plan, atividades, configSalva.days);
    setDiasAgendaPlano(configSalva.diasPersonalizados
      ? [...configSalva.diasSemana]
      : anterior.diasSemana);
    setHoraAgendaPlano(anterior.horario || '19:00');
    setAgendandoPlano(true);
  }
  function alternarDiaDaAgenda(indice) {
    setDiasAgendaPlano((anteriores) => anteriores.includes(indice)
      ? anteriores.filter((dia) => dia !== indice)
      : anteriores.length < configSalva.days ? [...anteriores, indice] : anteriores);
    setErroPlanoAgenda('');
  }
  const previaAgendamentoCompleto = useMemo(() => agendandoPlano && plan
    ? prepararAgendamentoCompleto(plan, {
        diasSemana: diasAgendaPlano, horarioInicial: horaAgendaPlano,
        atividadesExistentes: atividadesAgenda, topicosEstudados: studiedTopics,
      }) : null,
  [agendandoPlano, plan, diasAgendaPlano, horaAgendaPlano, atividadesAgenda, studiedTopics]);

  async function confirmarAgendamentoCompleto() {
    if (!usuarioId || salvandoPlanoAgenda || !validarDiasSemana(diasAgendaPlano, configSalva.days)) return;
    setErroPlanoAgenda('');
    try {
      setSalvandoPlanoAgenda(true);
      const existentes = await carregarAtividadesAgenda();
      const resultado = prepararAgendamentoCompleto(plan, {
        diasSemana: diasAgendaPlano, horarioInicial: horaAgendaPlano,
        atividadesExistentes: existentes, topicosEstudados: studiedTopics,
      });
      if (resultado.erro) throw new Error(resultado.erro);
      if (!resultado.atividades.length) {
        setErroPlanoAgenda('Nenhuma sessão pendente para agendar. As sessões já agendadas e os conteúdos estudados foram preservados.');
        return;
      }
      if (resultado.atividades.length > 500) throw new Error('Este plano tem mais de 500 atividades pendentes. Agende parte dele antes de continuar.');
      await sincronizarAntesDeAgendar(plan, configSalva);
      const resposta = await enviarPlanoCalendario({
        usuarioId,
        atividades: resultado.atividades,
        requisitar: request,
        consultarAtividades: carregarAtividadesAgenda,
      });
      // Agendamento confirmado: uma falha temporária na releitura não é falha no salvamento.
      try {
        await carregarAtividadesAgenda();
      } catch {
        setErroAgenda('As atividades foram salvas, mas não foi possível atualizar a lista agora. Abra o Calendário para conferir.');
      }
      const selecionados = [...diasAgendaPlano].sort((a, b) => a - b);
      setPlan(resultado.plano);
      setDiasSemana(selecionados);
      setInicioPlano(resultado.inicioPlano);
      setConfigSalva((anterior) => ({ ...anterior, diasSemana: selecionados, inicio: resultado.inicioPlano, diasPersonalizados: true }));
      savePlan(resultado.plano, configSalva.months, configSalva.days,
        configSalva.modeloId, configSalva.modeloAtualizadoEm, selecionados, resultado.inicioPlano, true, configSalva.modeloVersao);
      const novas = Number(resposta.adicionadas ?? resultado.atividades.length);
      const duplicadas = Number(resposta.ignoradas ?? 0) + resultado.jaAgendadas;
      setMensagemAgenda(`${novas} ${novas === 1 ? 'atividade adicionada' : 'atividades adicionadas'} ao Calendário.` +
        (duplicadas ? ` ${duplicadas} já ${duplicadas === 1 ? 'estava agendada' : 'estavam agendadas'}.` : ''));
      setAvisoPlano('Os dias escolhidos foram aplicados ao seu cronograma. Seus conteúdos estudados foram preservados.');
      setAgendandoPlano(false);
    } catch (erro) {
      setErroPlanoAgenda(erro.message || 'Não foi possível agendar o plano.');
    } finally {
      setSalvandoPlanoAgenda(false);
    }
  }

  function abrirAdicionarSessao(item, mes, semana, dia, diaIndex, itemIndex) {
    const origem = chaveSessaoPlano(item, mes, semana, diaIndex, itemIndex);
    const atividade = atividadesAgenda.find((a) => a.origem === origem);
    const dataPrevista = sugerirDataSessao(mes, semana, dia);
    setMensagemAgenda('');
    setErroSalvarAgenda('');
    setDataAgenda(atividade?.data || dataPrevista);
    setHorarioAgenda(atividade?.horario || '18:00');
    setSessaoSelecionada({ item, origem, atividade: atividade || null, dia: dia.day, dataPrevista });
  }

  function moverSessao(item, mesNumero, semanaNumero, diaOrigem, itemIndex, diaDestino) {
    if (sessaoJaAgendada(atividadesAgenda, chaveSessaoPlano(item, { numero: mesNumero }, { number: semanaNumero }, diaOrigem, itemIndex))) {
      setMensagemAgenda('Para alterar uma sessão que está no Calendário, use Reagendar.');
      return;
    }
    const novoPlano = moverSessaoNaSemana(plan, mesNumero, semanaNumero, diaOrigem, itemIndex, diaDestino);
    if (novoPlano === plan) return;
    setPlan(novoPlano);
    savePlan(novoPlano, configSalva.months, configSalva.days, configSalva.modeloId,
      configSalva.modeloAtualizadoEm, configSalva.diasSemana, inicioPlano, configSalva.diasPersonalizados, configSalva.modeloVersao);
    setMensagemAgenda('Sessão movida. A ordem do plano foi salva neste navegador.');
  }

  async function confirmarAdicionarSessao(evento) {
    evento.preventDefault();
    if (!sessaoSelecionada || !usuarioId || salvandoAgenda) return;
    const { item, origem } = sessaoSelecionada;
    const atividadeAtual = sessaoSelecionada.atividade;
    const semAlteracao = atividadeAtual && atividadeAtual.data === dataAgenda && atividadeAtual.horario === horarioAgenda;
    const valido = atividadeAtual
      ? semAlteracao || agendamentoNoFuturo(dataAgenda, horarioAgenda)
      : dataPermitidaSessaoPlano(dataAgenda, horarioAgenda, sessaoSelecionada.dataPrevista);
    if (!valido) {
      setErroSalvarAgenda(atividadeAtual
        ? 'Para reagendar, escolha uma data e horário futuros. Você também pode manter o horário original.'
        : 'Você pode manter a data prevista pelo cronograma ou escolher uma data futura.');
      return;
    }
    try {
      setSalvandoAgenda(true);
      setErroSalvarAgenda('');
      // Revalida a origem no servidor para evitar duplicações e alterar a sessão correta.
      const existentes = await carregarAtividadesAgenda();
      const registrada = existentes.find((a) => a.origem === origem);
      if (registrada) {
        if (registrada.data === dataAgenda && registrada.horario === horarioAgenda) {
          setSessaoSelecionada(null);
          setMensagemAgenda('Esta sessão já está agendada nesse horário.');
          return;
        }
        if (!agendamentoNoFuturo(dataAgenda, horarioAgenda)) {
          throw new Error('Para mudar uma sessão já agendada, escolha um horário futuro.');
        }
        await request(`/cronograma/${usuarioId}/${registrada.id}`, {
          method: 'PUT', body: JSON.stringify({ data: dataAgenda, horario: horarioAgenda }),
        }, 'Não foi possível reagendar a sessão.');
      } else if (atividadeAtual) {
        throw new Error('A sessão não está mais no Calendário. Atualize a página antes de reagendar.');
      } else {
        // A rota exclusiva do cronograma permite manter a data histórica prevista.
        await sincronizarAntesDeAgendar(plan, configSalva);
        await enviarPlanoCalendario({
          usuarioId,
          atividades: [{ nome: item.topico, materia: item.materia || 'Outro',
            data: dataAgenda, horario: horarioAgenda, topicoId: item.topicoId || null,
            done: false, origem }],
          requisitar: request, consultarAtividades: carregarAtividadesAgenda,
        });
      }
      try {
        await carregarAtividadesAgenda();
      } catch {
        setErroAgenda('A sessão foi salva, mas não foi possível atualizar a lista agora. Confira no Calendário.');
      }
      setMensagemAgenda(`“${item.topico}” ${atividadeAtual ? 'foi reagendado' : 'foi adicionado'} ao Calendário.`);
      setSessaoSelecionada(null);
    } catch (erro) {
      setErroSalvarAgenda(erro.message || 'Não foi possível adicionar a sessão.');
    } finally {
      setSalvandoAgenda(false);
    }
  }

  useEffect(() => {
    let ativo = true;
    request('/calendario/vestibulinho')
      .then((resposta) => {
        if (ativo) setDataVestibulinho(resposta?.data || null);
      })
      .catch(() => {
        if (ativo) setDataVestibulinho(null);
      })
    return () => { ativo = false; };
  }, []);

  const prazoSelecionado = avaliarPrazoPlanoReal(months, dataVestibulinho, inicioPlano || dataCivil(new Date()));
  const prazoNovaConfiguracao = avaliarPrazoPlanoReal(months, dataVestibulinho);

  useEffect(() => {
    let ativo = true;
    async function carregarProgramacoes() {
      setCarregandoModelo(true);
      setModeloError('');
      try {
        const resposta = await request('/cronogramas-modelos/disponiveis', {},
          'Não foi possível consultar os planos disponíveis.');
        if (!ativo) return;
        const opcoes = Array.isArray(resposta.opcoes) ? resposta.opcoes : [];
        setVariacoesDisponiveis(opcoes);
        if (opcoes.length) {
          setCronogramaModelo({ nome: 'Cronogramas definidos pelo administrador', sessoes: [],
            sessoes_preenchidas: opcoes.length });
          const salvo = opcoes.find((c) => Number(c.id) === planoAnterior?.modeloId &&
            Number(c.meses) === planoAnterior?.months && Number(c.dias) === planoAnterior?.days);
          const padrao = salvo || opcoes[0];
          // Jamais apagar o plano pessoal porque o ADM editou/arquivou o modelo.
          if (!planoAnterior?.plan && !planoHidratadoRemotamente.current) {
            setMonths(Number(padrao.meses));
            setDays(Number(padrao.dias));
            setDiasSemana(diasPadrao(Number(padrao.dias)));
          }
          if (salvo && planoAnterior?.plan &&
            ((planoAnterior.modeloVersao && Number(salvo.versao) > Number(planoAnterior.modeloVersao)) ||
             (!planoAnterior.modeloVersao && salvo.atualizadoEm !== planoAnterior.modeloAtualizadoEm))) {
            setAvisoPlano('O administrador atualizou este modelo. Seu cronograma continua preservado; use Ajustar plano se quiser gerar uma nova versão.');
          }
        } else {
          setCronogramaModelo(null);
          if (!planoAnterior?.plan && !planoHidratadoRemotamente.current) setModeloError('O administrador ainda não publicou nenhum cronograma de estudos.');
        }
      } catch (error) {
        if (ativo) {
          setCronogramaModelo(null);
          if (!planoAnterior?.plan && !planoHidratadoRemotamente.current) setModeloError(error.message || 'Não foi possível carregar as programações.');
        }
      } finally {
        if (ativo) setCarregandoModelo(false);
      }
    }
    carregarProgramacoes();
    return () => { ativo = false; };
  }, [planoAnterior?.days, planoAnterior?.modeloAtualizadoEm, planoAnterior?.modeloId, planoAnterior?.months, planoAnterior?.plan]);

  async function carregarProgressoPlano() {
    const token = localStorage.getItem('token');
    if (!token) {
      setStudiedTopics({});
      return;
    }

    try {
      setLoadingProgress(true);
      const resposta = await fetch(`${API_URL}/conteudos/progresso`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || 'Não foi possível carregar o progresso do plano.');
      }
      const mapa = {};
      (Array.isArray(dados.topicos) ? dados.topicos : []).forEach((item) => {
        mapa[String(item.topico_id)] = Boolean(item.estudado);
      });
      setStudiedTopics(mapa);
    } catch (erro) {
      console.error('Erro ao carregar progresso do plano:', erro);
    } finally {
      setLoadingProgress(false);
    }
  }

  useEffect(() => {
    const iniciar = setTimeout(() => { void carregarProgressoPlano(); }, 0);
    return () => clearTimeout(iniciar);
  }, []);

  function abrirDestinoItem(item) {
    if (item?.topicoId) {
      navigate(`/conteudos/${item.topicoId}`);
      return;
    }

    if (item?.tipo === 'pratica') {
      navigate(item?.key?.startsWith('revisao:') ? '/provas' : '/simulados');
      return;
    }

    navigate('/conteudos');
  }

  async function alternarEstudoItem(item) {
    if (!item?.topicoId) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      window.alert('Sua sessão expirou. Faça login novamente.');
      return;
    }

    const topicoId = Number(item.topicoId);
    const novoStatus = !studiedTopics[String(topicoId)];

    try {
      setSavingTopicId(topicoId);
      const resposta = await fetch(`${API_URL}/conteudos/progresso/${topicoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estudado: novoStatus })
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || 'Não foi possível atualizar o progresso deste conteúdo.');
      }
      setStudiedTopics((prev) => ({
        ...prev,
        [String(topicoId)]: novoStatus
      }));
    } catch (erro) {
      console.error('Erro ao atualizar tópico do plano:', erro);
      window.alert(erro.message || 'Não foi possível atualizar o progresso deste conteúdo.');
    } finally {
      setSavingTopicId(null);
    }
  }

  const phases = [
    'Fundamentos',
    'Construção de conhecimento',
    'Aprofundamento',
    'Prática',
    'Revisão',
    'Simulados'
  ];
  const current =
    plan?.find(
      (m) =>
        m.numero ===
        selected
    ) ||
    plan?.[0];

  const topicoIdsDoPlano = useMemo(
    () => (
      plan
        ? [...new Set(
            plan.flatMap((month) =>
              month.semanas.flatMap((week) =>
                week.days.flatMap((day) =>
                  day.items
                    .filter((item) => item.topicoId)
                    .map((item) => String(item.topicoId))
                )
              )
            )
          )]
        : []
    ),
    [plan]
  );

  const totalPlanSessions = useMemo(
    () => (
      plan
        ? plan.reduce(
            (total, month) =>
              total + month.semanas.reduce(
                (subtotal, week) =>
                  subtotal + week.days.reduce(
                    (dayTotal, day) => dayTotal + day.items.length,
                    0
                  ),
                0
              ),
            0
          )
        : 0
    ),
    [plan]
  );

  const studiedPlanTopics = useMemo(
    () => topicoIdsDoPlano.filter((id) => studiedTopics[id]).length,
    [topicoIdsDoPlano, studiedTopics]
  );

  const progress = useMemo(
    () => (
      topicoIdsDoPlano.length
        ? Math.round((studiedPlanTopics / topicoIdsDoPlano.length) * 100)
        : 0
    ),
    [studiedPlanTopics, topicoIdsDoPlano]
  );

  const nextPendingItem = useMemo(
    () => {
      if (!plan) return null;
      const allItems = plan.flatMap((month) =>
        month.semanas.flatMap((week) =>
          week.days.flatMap((day) =>
            day.items.map((item) => ({
              ...item,
              dayLabel: day.day,
              monthNumber: month.numero,
              weekNumber: week.number,
              data: day.data || null,
            }))
          )
        )
      );

      const pendentes = allItems.filter((item) =>
        !item.topicoId || !studiedTopics[String(item.topicoId)]);
      const agora = new Date();
      const hoje = dataCivil(agora);
      const agendadas = pendentes.map((item) => {
        const origem = chaveSessaoPlano(item, { numero: item.monthNumber }, { number: item.weekNumber }, 0, 0);
        const atividade = atividadesAgenda.find((a) => a.origem === origem);
        return atividade ? { ...item, atividadeAgendada: atividade } : null;
      }).filter(Boolean).sort((a, b) =>
        `${a.atividadeAgendada.data}T${a.atividadeAgendada.horario}`.localeCompare(`${b.atividadeAgendada.data}T${b.atividadeAgendada.horario}`));
      const proximas = agendadas.find((item) =>
        `${item.atividadeAgendada.data}T${item.atividadeAgendada.horario}` >=
        `${hoje}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`);
      return proximas || pendentes.find((item) => item.data && item.data >= hoje) ||
        agendadas[0] || pendentes[0] || null;
    },
    [plan, studiedTopics, atividadesAgenda]
  );

  const combinacaoDisponivel = variacoesDisponiveis.find((c) =>
    Number(c.meses) === months && Number(c.dias) === days);

  async function generate() {
    if (!combinacaoDisponivel) {
      setSyncError('Ainda não há um cronograma disponível para essa combinação.');
      return;
    }
    if (!validarDiasSemana(diasSemana, days)) {
      setSyncError(`Escolha exatamente ${days} ${days === 1 ? 'dia' : 'dias'} da semana.`);
      return;
    }
    const mesesDoPlano = Number(months);
    const inicio = inicioDoMes(new Date());
    let programacao;
    try {
      setSyncingPlan(true);
      const resposta = await request(
        `/cronogramas-modelos/ativo?meses=${mesesDoPlano}&dias=${Number(days)}`,
        {}, 'Este cronograma ainda não está disponível.');
      programacao = resposta.cronograma;
    } catch (erro) {
      setSyncError(erro.message || 'Não foi possível carregar o plano do administrador.');
      setSyncingPlan(false);
      return;
    }
    const diasDaGeracao = diasPadrao(days);
    const planoGerado = gerarPlanoProgramado(programacao, { diasSemana: diasDaGeracao, inicio });
    if (!planoGerado.length) {
      setSyncError('A programação escolhida não possui conteúdos válidos.');
      setSyncingPlan(false);
      return;
    }
    setCronogramaModelo(programacao);
    setSyncError('');
    setMonths(mesesDoPlano);
    setPlan(planoGerado);
    setInicioPlano(inicio);
    setDiasSemana(diasDaGeracao);
    setConfigSalva({ months: mesesDoPlano, days, diasSemana: [...diasDaGeracao], diasPersonalizados: false, inicio,
      modeloId: programacao.id, modeloAtualizadoEm: programacao.atualizado_em, modeloVersao: programacao.versao });
    selecionarSemana(1, 1);
    savePlan(planoGerado, mesesDoPlano, days, programacao.id, programacao.atualizado_em, diasDaGeracao, inicio, false, programacao.versao);
    setAvisoPlano('O cronograma começa no dia 1º do mês atual. Ao adicioná-lo ao Calendário, as sessões mantêm as datas previstas, mesmo as que já passaram.');
    setEditandoPlano(false);
    // Gerar o plano NÃO adiciona todas as sessões ao calendário.
    // Cada sessão é escolhida e confirmada individualmente pelo aluno.
    setSyncingPlan(false);
  }

  const focoItem = nextPendingItem ||
    current?.semanas
      ?.flatMap(
        (week) =>
          week.days.flatMap(
            (day) =>
              day.items
          )
      )
      ?.find(
        Boolean
      );
  const focoMateria =
    focoItem?.materia;
  const focoTopico =
    focoItem?.topico;
  const focoAgendado = focoItem?.atividadeAgendada || (focoItem?.key
    ? atividadesAgenda.find((a) => a.origem === `plano-automatico:${focoItem.key}`) : null);
  function cancelarAjuste() {
    setMonths(configSalva.months);
    setDays(configSalva.days);
    setDiasSemana([...configSalva.diasSemana]);
    setSyncError('');
    setEditandoPlano(false);
  }
  function mudarMeses(quantidade) {
    setMonths(quantidade);
    setSyncError('');
  }
  function mudarQuantidadeDias(quantidade) {
    setDays(quantidade);
    setDiasSemana(diasPadrao(quantidade));
    setSyncError('');
  }
  function abrirPersonalizacaoDias() {
    setDiasRascunho([...configSalva.diasSemana]);
    setErroPersonalizacao('');
    setPersonalizandoDias(true);
  }
  function alternarDiaPersonalizado(dia) {
    setDiasRascunho((anterior) => anterior.includes(dia)
      ? anterior.filter((item) => item !== dia)
      : anterior.length < configSalva.days ? [...anterior, dia] : anterior);
    setErroPersonalizacao('');
  }
  function salvarDiasPersonalizados() {
    if (!plan || !validarDiasSemana(diasRascunho, configSalva.days)) {
      setErroPersonalizacao(`Selecione ${configSalva.days} ${configSalva.days === 1 ? 'dia' : 'dias'} da semana.`);
      return;
    }
    const selecionados = [...diasRascunho].sort((a, b) => a - b);
    const anteriores = [...configSalva.diasSemana].sort((a, b) => a - b);
    if (selecionados.join(',') === anteriores.join(',')) {
      setConfigSalva((anterior) => ({ ...anterior, diasPersonalizados: true }));
      savePlan(plan, configSalva.months, configSalva.days, configSalva.modeloId,
        configSalva.modeloAtualizadoEm, selecionados, inicioPlano, true, configSalva.modeloVersao);
      setPersonalizandoDias(false);
      setAvisoPlano('Dias de estudo confirmados.');
      return;
    }
    const jaAgendadas = atividadesAgenda.some((atividade) =>
      typeof atividade.origem === 'string' && atividade.origem.startsWith('plano-automatico:'));
    if (jaAgendadas && !window.confirm('Alterar os dias do plano? As atividades que você já colocou no Calendário manterão suas datas originais.')) return;
    const inicio = inicioDoMes(inicioPlano || plan[0]?.inicio || new Date());
    const reorganizado = reagendarDatasPlano(plan, { diasSemana: selecionados, inicio });
    if (!reorganizado.length) {
      setErroPersonalizacao('Não foi possível redistribuir as sessões. Tente novamente.');
      return;
    }
    setPlan(reorganizado);
    setDiasSemana(selecionados);
    setInicioPlano(inicio);
    setConfigSalva((anterior) => ({ ...anterior, diasSemana: selecionados, inicio, diasPersonalizados: true }));
    savePlan(reorganizado, configSalva.months, configSalva.days, configSalva.modeloId,
      configSalva.modeloAtualizadoEm, selecionados, inicio, true, configSalva.modeloVersao);
    selecionarSemana(1, 1);
    setAvisoPlano('Seus dias de estudo foram atualizados. Conteúdos concluídos e atividades do Calendário foram preservados.');
    setPersonalizandoDias(false);
  }
  const hojePlano = dataCivil(new Date());
  const pendentesAtrasados = Boolean(plan?.some((mes) => mes.semanas.some((semana) =>
    semana.days.some((dia) => dia.items.length > 0 && dia.data && dia.data < hojePlano &&
      dia.items.some((item) => !item.topicoId || !studiedTopics[String(item.topicoId)])))));
  const planoSemDatas = Boolean(plan?.some((mes) => mes.semanas.some((semana) => semana.days.some((dia) =>
    dia.items.length > 0 && !dia.data))));
  const mostrandoConfig = !plan || editandoPlano;
  const mesesDisponiveis = Array.from({ length: 12 }, (_, index) => 12 - index);
  const diasDisponiveis = Array.from({ length: 7 }, (_, index) => index + 1);


  return (
    <div className="tenna-auto-plan page-shell">
      {mostrandoConfig && (
        <>
          <section className="tenna-auto-intro tenna-auto-intro-new tenna-auto-simple-banner">
            <div className="tenna-auto-intro-copy">
              <span className="tenna-auto-kicker">MEU PLANO DE ESTUDOS</span>
              <h2>Seu cronograma de estudos</h2>
              <p>Escolha o tempo e os dias disponíveis para estudar.</p>
            </div>
          </section>

          <section className="tenna-auto-config tenna-auto-config-new tenna-auto-simple-form">
            <div className="tenna-auto-simple-heading">
              <h3>Monte seu cronograma</h3>
            </div>

            <div className="tenna-auto-simple-fields tenna-auto-choice-fields">
              <div className="tenna-auto-simple-field" role="group" aria-label="Quantos meses você quer estudar?">
                <span>Quantos meses você quer estudar?</span>
                <div className="tenna-auto-choice-grid tenna-auto-month-choices">
                  {mesesDisponiveis.map((quantidade) => (
                    <button
                      type="button"
                      key={quantidade}
                      className={`tenna-auto-choice ${months === quantidade ? 'is-selected' : ''} ${avaliarPrazoPlanoReal(quantidade, dataVestibulinho).ultrapassa ? 'is-after-exam' : ''}`}
                      aria-pressed={months === quantidade}
                      aria-label={`${quantidade} ${quantidade === 1 ? 'mês' : 'meses'}`}
                      title={avaliarPrazoPlanoReal(quantidade, dataVestibulinho).ultrapassa ? 'Este período ultrapassa a data do Vestibulinho, mas pode ser selecionado.' : undefined}
                      onClick={() => mudarMeses(quantidade)}
                      disabled={syncingPlan}
                    >
                      <strong>{quantidade}</strong>
                      <small>{quantidade === 1 ? 'mês' : 'meses'}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tenna-auto-simple-field" role="group" aria-label="Quantos dias por semana?">
                <span>Quantos dias por semana?</span>
                <div className="tenna-auto-choice-grid tenna-auto-day-choices">
                  {diasDisponiveis.map((quantidade) => (
                    <button
                      type="button"
                      key={quantidade}
                      className={`tenna-auto-choice ${days === quantidade ? 'is-selected' : ''}`}
                      aria-pressed={days === quantidade}
                      aria-label={`${quantidade} ${quantidade === 1 ? 'dia' : 'dias'} por semana`}
                      onClick={() => mudarQuantidadeDias(quantidade)}
                      disabled={syncingPlan}
                    >
                      <strong>{quantidade}</strong>
                      <small>{quantidade === 1 ? 'dia' : 'dias'}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {prazoNovaConfiguracao.conhecido && prazoNovaConfiguracao.ultrapassa && (
              <p className="tenna-auto-simple-date-notice" role="status">Esse período ultrapassa a data do Vestibulinho. Você pode escolher menos meses para concluir a preparação antes da prova.</p>
            )}
            {!combinacaoDisponivel && variacoesDisponiveis.length > 0 && (
              <p className="tenna-auto-simple-date-notice">Não há modelo publicado para {months} {months === 1 ? 'mês' : 'meses'} e {days} {days === 1 ? 'dia' : 'dias'} por semana.</p>
            )}

            <div className="tenna-auto-simple-footer">
                  {plan && editandoPlano && (
                    <button type="button" className="tenna-auto-secondary-button" onClick={cancelarAjuste}>
                      Voltar ao plano
                    </button>
                  )}
                  <button
                    type="button"
                    className="mural-btn primary tenna-auto-simple-submit"
                    onClick={generate}
                    disabled={syncingPlan || diasSemana.length !== days || !combinacaoDisponivel}
                  >
                    {syncingPlan ? 'Preparando...' : plan ? 'Atualizar cronograma' : 'Gerar meu cronograma'}
                  </button>
                </div>

            {syncError ? (
              <p className="tenna-auto-simple-error" role="alert">{syncError}</p>
            ) : null}
          </section>
        </>
      )}
      {plan && !editandoPlano && current && (
        <main className="studyplan-result">
          <section className="studyplan-hero" aria-labelledby="studyplan-title">
            <div className="studyplan-hero-copy">
              <span className="studyplan-eyebrow studyplan-eyebrow-light">
                <span className="studyplan-eyebrow-mark" aria-hidden="true" /> SEU PLANO DE ESTUDOS
              </span>
              <h1 id="studyplan-title">Seu cronograma <span>de estudos.</span></h1>
              <p>Organize sua rotina e acompanhe cada conquista.</p>
              <div className="studyplan-hero-info">
                <span><Icon name="calendar" size={15} /> {months} {months === 1 ? 'mês' : 'meses'}{plan[0]?.inicio ? ` · ${formatarPeriodo(plan[0].inicio, plan[plan.length - 1]?.fim)}` : ''}</span>
                <span><Icon name="clock" size={15} /> {days} {days === 1 ? 'dia' : 'dias'} por semana
                  <button type="button" className="studyplan-custom-days-link" onClick={abrirPersonalizacaoDias} aria-label="Personalizar os dias da semana para estudar">Personalizar dias</button>
                </span>
              </div>
            </div>
            <div className="studyplan-hero-side">
              <div className="studyplan-hero-progress" aria-label={`${progress}% dos conteúdos do plano estudados`}>
                <div className="studyplan-progress-number"><strong>{progress}<small>%</small></strong><span>dos conteúdos estudados</span></div>
                <div className="studyplan-hero-meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Conteúdos estudados no plano">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="studyplan-hero-links">
                <button type="button" className="studyplan-bulk-calendar-button" onClick={abrirAgendamentoCompleto}><Icon name="calendar" size={16} /> Adicionar ao Calendário</button>
                <button type="button" onClick={() => navigate('/cronograma')}><Icon name="calendar" size={16} /> Ver Calendário</button>
                <button type="button" onClick={() => setEditandoPlano(true)}><Icon name="edit" size={16} /> Ajustar plano</button>
              </div>
            </div>
          </section>

          {avisoPlano && <div className="studyplan-calendar-feedback" role="status"><Icon name="check" size={17}/>{avisoPlano}</div>}
          {(pendentesAtrasados || planoSemDatas) && !avisoPlano && (
            <div className="tenna-auto-replan-notice" role="status">
              <span>O cronograma começa no dia 1º do mês e mantém as datas originais, mesmo as que já passaram.</span>
              <button type="button" onClick={abrirAgendamentoCompleto}>Agendar pendentes</button>
            </div>
          )}
          {syncingPlan && <p className="tenna-auto-sync-status" role="status">Preparando sua trilha de estudos...</p>}
          {syncError && <p className="tenna-auto-error" role="alert">{syncError}</p>}
          {prazoSelecionado.conhecido && prazoSelecionado.ultrapassa && (
            <div className="tenna-auto-date-warning" role="status">
              <Icon name="calendar" size={18} />
              <span>Seu plano está previsto para terminar depois do Vestibulinho. Considere ajustar a duração para priorizar os estudos antes da prova.</span>
            </div>
          )}

          <section className="studyplan-next" aria-labelledby="studyplan-next-heading">
            <div className="studyplan-next-main">
              <div className="studyplan-next-label">
                <span className="studyplan-next-icon"><Icon name="target" size={20} /></span>
                <span className="studyplan-eyebrow">SEU PRÓXIMO PASSO</span>
              </div>
              <div className="studyplan-next-copy">
                <span className="studyplan-next-subject">
                  <SubjectIcon materia={focoMateria || 'Outro'} size={16} /> {focoMateria || 'Sua trilha de estudos'}
                </span>
                <h2 id="studyplan-next-heading">{progress === 100 && topicoIdsDoPlano.length > 0 ? 'Você concluiu os conteúdos!' : focoTopico || 'Seu plano está pronto para começar'}</h2>
                <p>
                  {progress === 100 && topicoIdsDoPlano.length > 0
                    ? 'Excelente progresso! Continue revisando os assuntos e praticando.'
                    : focoItem?.topicoId
                      ? `${focoItem.tempoEstimado || 45} min · ${focoAgendado
                        ? `Agendado para ${new Date(`${focoAgendado.data}T12:00:00`).toLocaleDateString('pt-BR')} às ${focoAgendado.horario}`
                        : 'Aguardando agendamento'}`
                      : focoItem?.tipo === 'pratica'
                        ? 'Hora de colocar seu conhecimento em prática.'
                        : 'Siga as etapas para avançar no seu ritmo.'}
                </p>
              </div>
            </div>
            <div className="studyplan-next-action">
              <span className="studyplan-next-action-label">{loadingProgress ? 'Atualizando seu progresso...' : progress === 100 && topicoIdsDoPlano.length > 0 ? 'Continue evoluindo' : 'Pronto para começar?'}</span>
              <button
                type="button"
                className="studyplan-primary-button"
                onClick={() => progress === 100 && topicoIdsDoPlano.length > 0 ? navigate('/conteudos') : focoItem && abrirDestinoItem(focoItem)}
                disabled={!focoItem && progress < 100}
              >
                {progress === 100 && topicoIdsDoPlano.length > 0 ? 'Revisar conteúdos' : focoItem?.tipo === 'pratica' && !focoItem?.topicoId ? 'Praticar agora' : 'Estudar agora'}
              </button>
            </div>
          </section>

          <div className="studyplan-stats" aria-label="Resumo da sua preparação">
            <div className="studyplan-stat">
              <span className="studyplan-stat-icon"><Icon name="check" size={18} /></span>
              <div><strong>{studiedPlanTopics} <small>/ {topicoIdsDoPlano.length}</small></strong><span>conteúdos únicos estudados</span></div>
            </div>
            <div className="studyplan-stat">
              <span className="studyplan-stat-icon"><Icon name="book" size={18} /></span>
              <div><strong>{totalPlanSessions}</strong><span>sessões de estudo previstas</span></div>
            </div>
            <div className="studyplan-stat">
              <span className="studyplan-stat-icon"><Icon name="calendar" size={18} /></span>
              <div><strong>{configSalva.days} <small>/ semana</small></strong><span>dias disponíveis</span></div>
            </div>
          </div>

          <section className="studyplan-journey" aria-labelledby="studyplan-journey-heading">
            <div className="studyplan-section-heading">
              <div>
                <span className="studyplan-eyebrow">SUA JORNADA</span>
                <h2 id="studyplan-journey-heading">Sua trilha de estudos</h2>
                <p>Escolha seu mês e avance uma semana de cada vez.</p>
              </div>
              <span className="studyplan-stage-count"><Icon name="layers" size={15} /> Mês {current.numero} de {plan.length}</span>
            </div>
            <p className="studyplan-counts-hint">Um conteúdo pode aparecer em mais de uma sessão. O progresso conta os conteúdos únicos estudados, enquanto as sessões representam os momentos de estudo planejados.</p>
            {mensagemAgenda && <div className="studyplan-calendar-feedback" role="status"><Icon name="check" size={17}/>{mensagemAgenda}</div>}
            {erroAgenda && <div className="studyplan-calendar-error" role="alert">{erroAgenda} <button type="button" onClick={() => { setCarregandoAgenda(true); carregarAtividadesAgenda().then(() => setErroAgenda('')).catch((erro) => setErroAgenda(erro.message)).finally(() => setCarregandoAgenda(false)); }}>Tentar novamente</button></div>}
            <div className="studyplan-month-tabs" role="tablist" aria-label="Escolher mês do cronograma">
              {plan.map((mes) => {
                const mesTopicos = [...new Set(mes.semanas.flatMap((semana) => semana.days.flatMap((dia) => dia.items.filter((item) => item.topicoId).map((item) => String(item.topicoId)))))];
                const mesConcluido = mesTopicos.length > 0 && mesTopicos.every((id) => studiedTopics[id]);
                return (
                  <button
                    key={mes.numero}
                    type="button"
                    role="tab"
                    aria-selected={mes.numero === current.numero}
                    aria-controls="studyplan-month-panel"
                    id={`studyplan-month-tab-${mes.numero}`}
                    className={`studyplan-month-tab${mes.numero === current.numero ? ' active' : ''}`}
                    onClick={() => {
                      selecionarSemana(mes.numero, 1);
                    }}
                  >
                    <span className="studyplan-month-tab-number">{mesConcluido ? <Icon name="check" size={16} /> : pad(mes.numero)}</span>
                    <span><strong>Mês {mes.numero}</strong><small>{mesConcluido ? 'Concluído' : mes.numero === current.numero ? 'Em destaque' : phases[Math.min(mes.numero - 1, phases.length - 1)]}</small></span>
                  </button>
                );
              })}
            </div>

            <div id="studyplan-month-panel" className="studyplan-month-panel" role="tabpanel" aria-labelledby={`studyplan-month-tab-${current.numero}`}>
              <div className="studyplan-month-heading">
                <div className="studyplan-month-heading-copy">
                  <span className="studyplan-eyebrow">MÊS {pad(current.numero)} · {phases[Math.min(current.numero - 1, phases.length - 1)]}</span>
                  <h3>{current.nome}</h3>
                  
                </div>
                <div className="studyplan-month-metrics">
                  <span><Icon name="calendar" size={15} /> {current.semanas.length} semanas</span>
                  <span><Icon name="book" size={15} /> {current.semanas.reduce((n, semana) => n + semana.days.reduce((s, dia) => s + dia.items.length, 0), 0)} sessões</span>
                </div>
              </div>

              <div className="studyplan-weeks">
                <div className="studyplan-weeks-intro"><strong>Escolha uma semana</strong><span>Visualize apenas as atividades que deseja organizar.</span></div>
                <div className="studyplan-week-picker">
                {current.semanas.map((week) => {
                  const key = `${current.numero}-${week.number}`;
                  const open = openWeeks.has(key);
                  const resumo = resumoSemanaPlano(current, week, atividadesAgenda, studiedTopics);
                  const status = resumo.progresso;
                  return <button key={key} type="button" className={`studyplan-week-choice${open ? ' active' : ''} status-${status === "Concluída" ? "done" : status === "Em andamento" ? "ongoing" : "pending"}`} aria-pressed={open} onClick={() => selecionarSemana(current.numero, week.number)}><span>SEMANA {week.number}</span><small>{configSalva.diasPersonalizados ? formatarPeriodo(week.inicio, week.fim) : 'Dias a definir'}</small><strong>{status}</strong><small className="studyplan-week-calendar-status">{resumo.agendamento}</small></button>;
                })}
                </div>
                {current.semanas.filter(week => openWeeks.has(`${current.numero}-${week.number}`)).map((week) => {
                  const key = `${current.numero}-${week.number}`;
                  const open = openWeeks.has(key);
                  const weekItems = week.days.flatMap((day) => day.items);
                  const weekStudyItems = [...new Set(weekItems.filter((item) => item.topicoId).map((item) => String(item.topicoId)))];
                  const weekDoneCount = weekStudyItems.filter((id) => studiedTopics[id]).length;
                  const weekPercent = weekStudyItems.length ? Math.round(weekDoneCount / weekStudyItems.length * 100) : 0;
                  const resumoSemana = resumoSemanaPlano(current, week, atividadesAgenda, studiedTopics);
                  return (
                    <article className={`studyplan-week${open ? ' open' : ''}`} key={key}>
                      <button
                        type="button"
                        className="studyplan-week-toggle"
                        aria-expanded={open}
                        aria-controls={`studyplan-week-${key}`}
                        onClick={() => setOpenWeeks((prev) => {
                          return prev.has(key) ? new Set() : new Set([key]);
                        })}
                      >
                        <span className="studyplan-week-number">{pad(week.number)}</span>
                        <span className="studyplan-week-title"><strong>Semana {week.number} {configSalva.diasPersonalizados && week.inicio && `· ${formatarPeriodo(week.inicio, week.fim)}`}</strong><small>{week.days.filter((dia) => dia.items.length).length} dias de estudo · {weekDoneCount} de {weekStudyItems.length} conteúdos estudados · {resumoSemana.agendamento.toLowerCase()}</small></span>
                        <span className="studyplan-week-progress" role="progressbar" aria-label={`Semana ${week.number}: ${weekPercent}% concluído`} aria-valuenow={weekPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${weekPercent}%` }} /></span>
                        <span className="studyplan-week-chevron"><Icon name="chevron" size={19} /></span>
                      </button>
                      {open && (
                        <div id={`studyplan-week-${key}`} className="studyplan-week-body">
                          <div className="studyplan-week-organize">
                            <span>Você pode organizar as sessões desta semana sem alterar os conteúdos definidos pelo administrador.</span>
                            <button type="button" aria-pressed={organizandoSemana === key} onClick={() => setOrganizandoSemana((anterior) => anterior === key ? null : key)}>{organizandoSemana === key ? 'Concluir organização' : 'Organizar semana'}</button>
                          </div>
                          {week.days.map((day, i) => day.items.length > 0 && (
                            <div className="studyplan-day" key={`${key}-${day.day}-${i}`}>
                              <div className="studyplan-day-label"><span>{configSalva.diasPersonalizados ? day.day.slice(0, 3).toUpperCase() : `DIA ${i + 1}`}</span><strong>{configSalva.diasPersonalizados ? day.day : `Estudo ${i + 1}`}</strong>{configSalva.diasPersonalizados && day.data && <small>{new Date(`${day.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small>}</div>
                              <div className="studyplan-lessons">
                                {day.items.map((item, itemIndex) => {
                                  const style = corMateriaPlano(item.materia || 'Outro');
                                  const studied = item.topicoId ? Boolean(studiedTopics[String(item.topicoId)]) : false;
                                  const isSaving = savingTopicId === Number(item.topicoId);
                                  const origemSessao = chaveSessaoPlano(item, current, week, i, itemIndex);
                                  const atividadeAgendada = atividadesAgenda.find((a) => a.origem === origemSessao);
                                  const agendada = Boolean(atividadeAgendada);
                                  return (
                                    <article className={`studyplan-lesson${studied ? ' completed' : ''}${agendada ? ' scheduled' : ''}`} key={`${key}-${day.day}-${i}-${itemIndex}`} style={{ '--study-color': style.color, '--study-bg': style.bg }}>
                                      <div className="studyplan-lesson-details">
                                        <span className="studyplan-lesson-subject"><SubjectIcon materia={item.materia || 'Outro'} size={14} /> {item.materia || 'Atividade'}</span>
                                        <h4>{item.topico}</h4>
                                        <span className="studyplan-lesson-meta">
                                          {item.tipo === 'pratica' ? (item.key?.startsWith('revisao:') ? 'Revisão · questões anteriores' : 'Prática e revisão') : `${item.tempoEstimado || 45} min`}
                                        </span>
                                        {agendada && <span className="studyplan-lesson-scheduled"><Icon name="check" size={13} /> No calendário · {new Date(`${atividadeAgendada.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {atividadeAgendada.horario}</span>}
                                      </div>
                                      <div className="studyplan-lesson-actions">
                                        {organizandoSemana === key && (
                                          <label className="studyplan-lesson-move">
                                            <span>Mover para</span>
                                            <select aria-label={`Mover ${item.topico} para outro dia de estudo`}
                                              value={i} disabled={agendada}
                                              title={agendada ? 'Reagende a sessão antes de trocar de dia' : 'Escolha outro dia desta semana'}
                                              onChange={(evento) => moverSessao(item, current.numero, week.number, i, itemIndex, Number(evento.target.value))}>
                                              {week.days.map((destino, posicao) => <option key={posicao} value={posicao}>Dia {posicao + 1} · {destino.day}</option>)}
                                            </select>
                                          </label>
                                        )}
                                        {item.topicoId && (
                                          <button type="button" className={`studyplan-complete-button${studied ? ' active' : ''}`} onClick={() => alternarEstudoItem(item)} disabled={isSaving} aria-label={`${studied ? 'Desmarcar' : 'Marcar'} ${item.topico} como ${studied ? 'pendente' : 'concluído'}`}>
                                            <Icon name="check" size={15} /> {isSaving ? 'Salvando...' : studied ? 'Concluído' : 'Concluir'}
                                          </button>
                                        )}
                                        <button type="button" className={`studyplan-add-calendar${agendada ? ' is-added' : ''}`} onClick={() => abrirAdicionarSessao(item, current, week, day, i, itemIndex)} disabled={carregandoAgenda || Boolean(erroAgenda) || !usuarioId} title={agendada ? 'Alterar data e horário desta sessão' : 'Agendar somente esta sessão'}>
                                          <Icon name={agendada ? 'edit' : 'calendar'} size={15} /> {agendada ? 'Reagendar' : 'Agendar'}
                                        </button>
                                        <button type="button" className="studyplan-open-button" onClick={() => abrirDestinoItem(item)}>
                                          {item.topicoId ? 'Estudar' : 'Praticar'}
                                        </button>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {weekItems.length === 0 && <p className="studyplan-empty-week">Nenhuma atividade planejada nesta semana.</p>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>


        </main>
      )}
      {personalizandoDias && plan && !editandoPlano && (
        <div className="studyplan-schedule-overlay" role="presentation" onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) setPersonalizandoDias(false);
        }}>
          <div className="studyplan-schedule-modal studyplan-days-modal" role="dialog" aria-modal="true"
            aria-labelledby="studyplan-days-title" onKeyDown={(evento) => {
              if (evento.key === 'Escape') setPersonalizandoDias(false);
            }}>
            <button className="studyplan-schedule-close" type="button" aria-label="Fechar" onClick={() => setPersonalizandoDias(false)}><span aria-hidden="true">×</span></button>
            <span className="studyplan-eyebrow"><Icon name="calendar" size={15}/> AJUSTE OPCIONAL</span>
            <h2 id="studyplan-days-title">Personalizar dias de estudo</h2>
            <p className="studyplan-schedule-description">Seu plano continua com {configSalva.days} {configSalva.days === 1 ? 'dia' : 'dias'} por semana. Escolha em quais dias prefere estudar.</p>
            <div className="tenna-auto-weekday-selection" role="group" aria-label="Dias disponíveis para estudo">
              <div className="tenna-auto-weekday-heading">
                <strong>Dias da semana</strong>
                <span>{diasRascunho.length} de {configSalva.days} selecionados</span>
              </div>
              <div className="tenna-auto-weekday-list">
                {[1, 2, 3, 4, 5, 6, 0].map((indice) => (
                  <button key={indice} type="button"
                    className={`tenna-auto-weekday ${diasRascunho.includes(indice) ? 'is-selected' : ''}`}
                    aria-pressed={diasRascunho.includes(indice)}
                    disabled={!diasRascunho.includes(indice) && diasRascunho.length >= configSalva.days}
                    onClick={() => alternarDiaPersonalizado(indice)}>{NOMES_DIAS[indice]}</button>
                ))}
              </div>
              <p className="tenna-auto-weekday-help">Para trocar um dia, desmarque outro primeiro. Os conteúdos do modelo permanecem os mesmos.</p>
            </div>
            {erroPersonalizacao && <p className="tenna-auto-simple-error" role="alert">{erroPersonalizacao}</p>}
            <div className="studyplan-schedule-actions">
              <button type="button" className="studyplan-schedule-cancel" onClick={() => setPersonalizandoDias(false)}>Cancelar</button>
              <button type="button" className="studyplan-schedule-submit" disabled={!validarDiasSemana(diasRascunho, configSalva.days)} onClick={salvarDiasPersonalizados}>Salvar dias</button>
            </div>
          </div>
        </div>
      )}
      {agendandoPlano && plan && !editandoPlano && (
        <div className="studyplan-schedule-overlay" role="presentation" onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget && !salvandoPlanoAgenda) setAgendandoPlano(false);
        }}>
          <div className="studyplan-schedule-modal studyplan-days-modal studyplan-bulk-modal" role="dialog" aria-modal="true" aria-labelledby="studyplan-bulk-title"
            onKeyDown={(evento) => { if (evento.key === 'Escape' && !salvandoPlanoAgenda) setAgendandoPlano(false); }}>
            <button className="studyplan-schedule-close" type="button" aria-label="Fechar" disabled={salvandoPlanoAgenda} onClick={() => setAgendandoPlano(false)}><span aria-hidden="true">×</span></button>
            <span className="studyplan-eyebrow"><Icon name="calendar" size={15}/> ORGANIZE SUA ROTINA</span>
            <h2 id="studyplan-bulk-title">Adicionar cronograma ao Calendário</h2>
            <p className="studyplan-schedule-description">Escolha os {configSalva.days} dias em que você pode estudar e o horário de início. Só serão agendadas sessões pendentes; atividades já agendadas serão mantidas.</p>
            <div className="tenna-auto-weekday-selection" role="group" aria-label="Dias para agendar no Calendário">
              <div className="tenna-auto-weekday-heading"><strong>Em quais dias você vai estudar?</strong><span>{diasAgendaPlano.length} de {configSalva.days} selecionados</span></div>
              <div className="tenna-auto-weekday-list">
                {[1, 2, 3, 4, 5, 6, 0].map((dia) => (
                  <button key={dia} type="button" className={`tenna-auto-weekday ${diasAgendaPlano.includes(dia) ? 'is-selected' : ''}`}
                    aria-pressed={diasAgendaPlano.includes(dia)}
                    disabled={salvandoPlanoAgenda || (!diasAgendaPlano.includes(dia) && diasAgendaPlano.length >= configSalva.days)}
                    onClick={() => alternarDiaDaAgenda(dia)}>{NOMES_DIAS[dia]}</button>
                ))}
              </div>
              <p className="tenna-auto-weekday-help">Se houver mais de um conteúdo no mesmo dia, cada um receberá um horário próprio, com intervalo de uma hora.</p>
            </div>
            <div className="studyplan-bulk-time">
              <label htmlFor="studyplan-bulk-time">Horário de início</label>
              <input id="studyplan-bulk-time" type="time" value={horaAgendaPlano} onChange={(evento) => {setHoraAgendaPlano(evento.target.value);setErroPlanoAgenda('');}} disabled={salvandoPlanoAgenda}/>
              <div className="studyplan-bulk-time-options" aria-label="Sugestões de horário">
                {['08:00','14:00','19:00'].map((hora) => <button key={hora} type="button" className={horaAgendaPlano === hora ? 'active' : ''} disabled={salvandoPlanoAgenda} onClick={() => setHoraAgendaPlano(hora)}>{hora}</button>)}
              </div>
            </div>
            {previaAgendamentoCompleto && !previaAgendamentoCompleto.erro && (
              <div className="studyplan-bulk-summary" role="status">
                <strong>{previaAgendamentoCompleto.atividades.length} {previaAgendamentoCompleto.atividades.length === 1 ? 'atividade para agendar' : 'atividades para agendar'}</strong>
                <span>{previaAgendamentoCompleto.jaAgendadas} já agendadas · {previaAgendamentoCompleto.concluidas} conteúdos estudados serão ignorados</span>
                <small>Primeira sessão: {new Date(`${previaAgendamentoCompleto.inicio}T12:00:00`).toLocaleDateString('pt-BR')}. {previaAgendamentoCompleto.anteriores > 0 ? `${previaAgendamentoCompleto.anteriores} sessões de datas anteriores a hoje serão registradas nas datas originais.` : 'Todas as sessões mantêm as datas do cronograma.'}</small>
              </div>
            )}
            {(erroPlanoAgenda || (diasAgendaPlano.length === configSalva.days && previaAgendamentoCompleto?.erro)) && (
              <p className="studyplan-calendar-error" role="alert">{erroPlanoAgenda || previaAgendamentoCompleto.erro}</p>
            )}
            <div className="studyplan-schedule-actions">
              <button type="button" className="studyplan-schedule-cancel" disabled={salvandoPlanoAgenda} onClick={() => setAgendandoPlano(false)}>Cancelar</button>
              <button type="button" className="studyplan-schedule-submit" onClick={confirmarAgendamentoCompleto}
                disabled={salvandoPlanoAgenda || !validarDiasSemana(diasAgendaPlano, configSalva.days) || Boolean(previaAgendamentoCompleto?.erro) || !previaAgendamentoCompleto?.atividades.length || !usuarioId}>
                <Icon name="calendar" size={16}/>{salvandoPlanoAgenda ? 'Adicionando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
      {sessaoSelecionada && (
        <div className="studyplan-schedule-overlay" role="presentation" onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget && !salvandoAgenda) setSessaoSelecionada(null);
        }}>
          <div className="studyplan-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="studyplan-schedule-title">
            <button className="studyplan-schedule-close" type="button" aria-label="Fechar" disabled={salvandoAgenda} onClick={() => setSessaoSelecionada(null)}><span aria-hidden="true">×</span></button>
            <span className="studyplan-eyebrow"><Icon name="calendar" size={15}/> AGENDAMENTO INDIVIDUAL</span>
            <h2 id="studyplan-schedule-title">{sessaoSelecionada.atividade ? 'Reagendar sessão' : 'Adicionar ao calendário'}</h2>
            <p className="studyplan-schedule-description">{sessaoSelecionada.atividade
              ? 'Altere a data ou o horário desta sessão. Para reagendar, escolha um horário futuro; a atividade original continuará identificada no Calendário.'
              : 'Somente esta sessão será adicionada. Você pode manter a data prevista pelo cronograma, mesmo que já tenha passado.'}</p>
            <div className="studyplan-schedule-topic">
              <span>{sessaoSelecionada.item.materia || 'Atividade'} · {sessaoSelecionada.dia}</span>
              <strong>{sessaoSelecionada.item.topico}</strong>
              <small>{sessaoSelecionada.item.tempoEstimado || 45} minutos previstos</small>
            </div>
            <form onSubmit={confirmarAdicionarSessao}>
              <div className="studyplan-schedule-fields">
                <label>Data<input type="date" autoFocus required value={dataAgenda} onChange={(evento) => setDataAgenda(evento.target.value)} /></label>
                <label>Horário<input type="time" required value={horarioAgenda} onChange={(evento) => setHorarioAgenda(evento.target.value)} /></label>
              </div>
              {erroSalvarAgenda && <p className="studyplan-calendar-error" role="alert">{erroSalvarAgenda}</p>}
              <div className="studyplan-schedule-actions">
                <button type="button" className="studyplan-schedule-cancel" onClick={() => setSessaoSelecionada(null)} disabled={salvandoAgenda}>Cancelar</button>
                <button type="submit" className="studyplan-schedule-submit" disabled={salvandoAgenda || !(sessaoSelecionada.atividade
                  ? ((sessaoSelecionada.atividade.data === dataAgenda && sessaoSelecionada.atividade.horario === horarioAgenda) || agendamentoNoFuturo(dataAgenda, horarioAgenda))
                  : dataPermitidaSessaoPlano(dataAgenda, horarioAgenda, sessaoSelecionada.dataPrevista))}><Icon name="calendar" size={16}/>{salvandoAgenda ? 'Salvando...' : sessaoSelecionada.atividade ? 'Salvar novo horário' : 'Confirmar atividade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}