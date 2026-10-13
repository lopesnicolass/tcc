import '../../styles/aluno/PlanoAutomatico.css';
import '../../styles/aluno/PlanoAutomaticoRedesign.css';
import {
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  useNavigate
} from 'react-router-dom';
import {
  useGamification
} from '../../context/GamificationContext.jsx';
import SubjectIcon
  from '../../components/SubjectIcon.jsx';
import Icon
  from '../../components/Icon.jsx';
import { request } from '../../services/api.js';
import { gerarPlanoPrioritario, resumirPrioridades } from '../../utils/planoPrioridade.js';
import { avaliarPrazo, mesesAntesDaProva, dataFormatadaPtBr } from '../../utils/prazoVestibulinho.js';
import { getSubjectStyle } from '../../utils/subjects.js';
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
function carregarPlanoSalvo() {
  try {
    const valor = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${getUserKey()}`) || 'null');
    const plano = Array.isArray(valor) ? valor : valor?.plan;
    if (!Array.isArray(plano) || plano.length === 0 || !plano.every((mes) =>
      Array.isArray(mes?.semanas) && mes.semanas.every((semana) =>
        Array.isArray(semana?.days) && semana.days.every((dia) => Array.isArray(dia?.items))
      )
    )) return null;
    return {
      plan: plano,
      months: Array.isArray(valor) ? plano.length : Number(valor.months || plano.length),
      days: Array.isArray(valor) ? 3 : Number(valor.days || 3),
    };
  } catch {
    return null;
  }
}
function savePlan(plan, months, days) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${getUserKey()}`, JSON.stringify({ plan, months, days }));
  } catch (erro) {
    console.warn('Não foi possível salvar o plano neste navegador.', erro);
  }
}
export default function PlanoAutomatico() {
  const navigate =
    useNavigate();
  const { addXP } =
    useGamification();
  const planoAnterior = useMemo(carregarPlanoSalvo, []);
  const [
    months,
    setMonths
  ] =
    useState(planoAnterior?.months || 6);
  const [
    maxMonths,
    setMaxMonths
  ] =
    useState(12);
  const [
    days,
    setDays
  ] =
    useState(planoAnterior?.days || 3);
  const [
    plan,
    setPlan
  ] =
    useState(planoAnterior?.plan || null);
  const [
    selected,
    setSelected
  ] =
    useState(1);
  const [
    openWeeks,
    setOpenWeeks
  ] =
    useState(
      new Set(
        ['1-1']
      )
    );
  const [
    addingWeek,
    setAddingWeek
  ] =
    useState(null);
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
  const [
    cronogramaModelo,
    setCronogramaModelo
  ] =
    useState(null);
  const [
    carregandoModelo,
    setCarregandoModelo
  ] =
    useState(true);
  const [
    modeloError,
    setModeloError
  ] =
    useState('');
  const [editandoPlano, setEditandoPlano] = useState(false);
  const [mostrarDuracoesExtras, setMostrarDuracoesExtras] = useState(false);
  const [dataVestibulinho, setDataVestibulinho] = useState(null);
  const [consultandoVestibulinho, setConsultandoVestibulinho] = useState(true);
  const [mesesAlterados, setMesesAlterados] = useState(false);
  const [studiedTopics, setStudiedTopics] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [savingTopicId, setSavingTopicId] = useState(null);

  useEffect(() => {
    let ativo = true;
    request('/calendario/vestibulinho')
      .then((resposta) => {
        if (ativo) setDataVestibulinho(resposta?.data || null);
      })
      .catch(() => {
        if (ativo) setDataVestibulinho(null);
      })
      .finally(() => {
        if (ativo) setConsultandoVestibulinho(false);
      });
    return () => { ativo = false; };
  }, []);

  const prazoRecomendado = useMemo(
    () => mesesAntesDaProva(maxMonths, dataVestibulinho),
    [maxMonths, dataVestibulinho]
  );
  const prazoSelecionado = avaliarPrazo(months, dataVestibulinho);

  useEffect(() => {
    if (prazoRecomendado === null || mesesAlterados || plan || planoAnterior?.plan) return;
    setMonths(prazoRecomendado > 0 ? prazoRecomendado : 1);
  }, [prazoRecomendado, mesesAlterados, plan, planoAnterior]);

  useEffect(() => {
    async function carregarCronogramaModelo() {
      setCarregandoModelo(true);
      setModeloError('');
      setCronogramaModelo(null);
      try {
        let modeloAdmin = null;
        try {
          const respostaModelo = await request(
            '/cronogramas-modelos/ativo',
            {},
            'Modelo de cronograma não configurado.'
          );
          modeloAdmin = respostaModelo.cronograma || null;
        } catch (erroModelo) {
          // O catálogo ativo é suficiente para gerar um plano priorizado.
          // Se o administrador ainda não criou um modelo, usamos 12 meses como limite padrão.
          if (erroModelo.status !== 404) throw erroModelo;
        }
        const respostaConteudos = await request(
          '/conteudos/publico',
          {},
          'Não foi possível carregar os conteúdos ativos.'
        );
        const materias = Array.isArray(respostaConteudos.materias)
          ? respostaConteudos.materias
          : [];
        const topicos = materias.flatMap((materia) =>
          (Array.isArray(materia.topicos) ? materia.topicos : [])
            .filter((topico) => Number(topico.ativo) === 1)
            .map((topico, indice) => ({
              id: topico.id,
              topico_id: topico.id,
              topico: topico.nome,
              topico_descricao: topico.descricao || '',
              materia: materia.nome,
              materia_id: materia.id,
              prioridade: Number(topico.prioridade || 2),
              frequencia_provas: Number(topico.frequencia_provas || 0),
              tempo_estimado_minutos: Number(topico.tempo_estimado_minutos || 45),
              justificativa_prioridade: topico.justificativa_prioridade || '',
              fonte_frequencia: topico.fonte_frequencia || '',
              ordem: Number(topico.ordem ?? indice),
            }))
        );
        if (!topicos.length) {
          throw new Error('Ainda não existem tópicos ativos no catálogo. Peça ao administrador para cadastrar os conteúdos do Vestibulinho.');
        }
        const limiteMeses = Math.max(
          1,
          Math.min(12, Number(modeloAdmin?.meses || 12))
        );
        setMaxMonths(limiteMeses);
        if (!planoAnterior?.plan) {
          setMonths((atual) => Math.min(Math.max(1, atual), limiteMeses));
        }
        setCronogramaModelo({
          ...(modeloAdmin || {}),
          nome: modeloAdmin?.nome || 'Plano priorizado para o Vestibulinho ETEC',
          modeloAdministradorConfigurado: Boolean(modeloAdmin),
          meses: limiteMeses,
          sessoes: topicos,
          sessoes_preenchidas: topicos.length,
        });
        if (!modeloAdmin) {
          setModeloError('O administrador ainda não configurou um período próprio; o plano usará o limite padrão de 12 meses.');
        }
      } catch (error) {
        console.error('Erro ao carregar conteúdos do plano automático:', error);
        setCronogramaModelo(null);
        setModeloError(
          error.message || 'Não foi possível carregar os conteúdos para montar o plano.'
        );
      } finally {
        setCarregandoModelo(false);
      }
    }
    carregarCronogramaModelo();
  }, []);

  async function carregarProgressoPlano() {
    const token = localStorage.getItem('token');
    if (!token) {
      setStudiedTopics({});
      return;
    }

    try {
      setLoadingProgress(true);
      const resposta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/conteudos/progresso`, {
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
    carregarProgressoPlano();
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
    const novoStatus = !Boolean(studiedTopics[String(topicoId)]);

    try {
      setSavingTopicId(topicoId);
      const resposta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/conteudos/progresso/${topicoId}`, {
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
            }))
          )
        )
      );

      return (
        allItems.find((item) => item.topicoId && !studiedTopics[String(item.topicoId)]) ||
        allItems.find((item) => item.topicoId) ||
        allItems.find(Boolean) ||
        null
      );
    },
    [plan, studiedTopics]
  );

  const prioritySummary = useMemo(
    () => plan && cronogramaModelo
      ? resumirPrioridades(plan, cronogramaModelo.sessoes)
      : null,
    [plan, cronogramaModelo]
  );
  function montarAtividadesDoPlano(
    p
  ) {
    const hoje =
      new Date();
    const nomesDias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];
    const domingo =
      new Date(
        hoje
      );
    domingo.setDate(
      hoje.getDate() -
      hoje.getDay()
    );
    const atividades =
      [];
    p.forEach(
      (month) => {
        month.semanas.forEach(
          (week) => {
            week.days.forEach(
              (day) => {
                if (
                  !day.items.length
                ) {
                  return;
                }
                const indiceDia =
                  nomesDias.indexOf(
                    day.day
                  );
                const alvo =
                  new Date(
                    domingo
                  );
                alvo.setDate(
                  domingo.getDate() +
                    indiceDia +
                    28 * (month.numero - 1) +
                    7 *
                      (
                        week.number -
                        1
                      )
                );
                const dataFinal =
                  day.data ||
                  `${alvo.getFullYear()}-${pad(
                    alvo.getMonth() + 1
                  )}-${pad(
                    alvo.getDate()
                  )}`;
                day.items.forEach(
                  (item) => {
                    atividades.push({
                      data:
                        dataFinal,
                      horario:
                        '08:00',
                      nome:
                        item.topico,
                      materia:
                        item.materia,
                      topicoId:
                        item.topicoId ||
                        null,
                      done:
                        false,
                      origem:
                        'plano-automatico'
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
    return atividades;
  }
  async function generate() {
    if (!cronogramaModelo || !cronogramaModelo.sessoes?.length) {
      setSyncError('Não há conteúdos ativos suficientes para gerar um plano.');
      return;
    }
    const mesesDoPlano = Math.max(1, Math.min(maxMonths, Number(months) || 1));
    const planoGerado = gerarPlanoPrioritario(
      mesesDoPlano,
      days,
      cronogramaModelo.sessoes
    );
    if (!planoGerado.length) {
      setSyncError('Não foi possível montar o plano. Confira se existem tópicos ativos no catálogo.');
      return;
    }
    setSyncError('');
    setMonths(mesesDoPlano);
    setPlan(planoGerado);
    setSelected(1);
    setOpenWeeks(new Set(['1-1']));
    savePlan(planoGerado, mesesDoPlano, days);
    setEditandoPlano(false);
    const usuarioId = Number(getUser().id || getUser().usuarioId || 0);
    if (!usuarioId) return;
    const atividades = montarAtividadesDoPlano(planoGerado);
    if (!atividades.length) return;
    try {
      setSyncingPlan(true);
      await request(
        `/cronograma/${usuarioId}/lote`,
        {
          method: 'POST',
          body: JSON.stringify({
            atividades,
            substituirOrigem: 'plano-automatico'
          })
        },
        'Não foi possível salvar o plano no cronograma.'
      );
      addXP(20, 'plano automático gerado');
    } catch (erro) {
      console.error('Erro ao salvar plano no cronograma:', erro);
      setSyncError(
        erro.message || 'O plano foi gerado, mas não foi possível salvá-lo no cronograma.'
      );
    } finally {
      setSyncingPlan(false);
    }
  }
  async function addWeek(
    month,
    week
  ) {
    const usuarioId =
      Number(
        getUser().id ||
        getUser().usuarioId ||
        0
      );
    if (
      !usuarioId
    ) {
      return;
    }
    const hoje =
      new Date();
    const nomesDias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];
    const domingo =
      new Date(
        hoje
      );
    domingo.setDate(
      hoje.getDate() -
      hoje.getDay()
    );
    const atividades =
      [];
    week.days.forEach(
      (day) => {
        if (
          !day.items.length
        ) {
          return;
        }
        const indiceDia =
          nomesDias.indexOf(
            day.day
          );
        const alvo =
          new Date(
            domingo
          );
        alvo.setDate(
          domingo.getDate() +
            indiceDia +
            28 * (month.numero - 1) +
            7 *
              (
                week.number -
                1
              )
        );
        const dataFinal =
          day.data ||
          `${alvo.getFullYear()}-${pad(
            alvo.getMonth() + 1
          )}-${pad(
            alvo.getDate()
          )}`;
        day.items.forEach(
          (item) => {
            atividades.push({
              data:
                dataFinal,
              horario:
                '08:00',
              nome:
                item.topico,
              materia:
                item.materia,
              topicoId:
                item.topicoId ||
                null,
              done:
                false,
              origem:
                'plano-automatico'
            });
          }
        );
      }
    );
    if (
      !atividades.length
    ) {
      return;
    }
    try {
      setAddingWeek(
        `${month.numero}-${week.number}`
      );
      await request(
        `/cronograma/${usuarioId}/lote`,
        {
          method: 'POST',
          body: JSON.stringify({
            atividades,
            substituirOrigem:
              null
          })
        },
        'Não foi possível adicionar a semana ao calendário.'
      );
      addXP(
        10,
        'semana adicionada ao calendário'
      );
      navigate(
        '/cronograma'
      );
    } catch (
      erro
    ) {
      console.error(
        'Erro ao adicionar semana:',
        erro
      );
      window.alert(
        erro.message ||
        'Não foi possível adicionar a semana ao calendário.'
      );
    } finally {
      setAddingWeek(
        null
      );
    }
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
  function mudarMeses(quantidade) {
    setMesesAlterados(true);
    setMonths(quantidade);
  }
  const mostrandoConfig = !plan || editandoPlano;
  // Durações após a prova continuam disponíveis, mas não ocupam a primeira tela.
  const limiteMesesIniciais = Math.min(maxMonths, Math.max(
    months,
    prazoRecomendado !== null && prazoRecomendado > 0 ? prazoRecomendado : dataVestibulinho ? 2 : 6,
    2
  ));
  const duracoesExpandidas = mostrarDuracoesExtras;
  const quantidadeMesesVisiveis = duracoesExpandidas ? maxMonths : limiteMesesIniciais;
  return (
    <div className="tenna-auto-plan page-shell">
      {mostrandoConfig && (
        <>
          <section className="tenna-auto-intro tenna-auto-intro-new">
            <div className="tenna-auto-intro-copy">
              <span className="tenna-auto-kicker">PLANEJAMENTO INTELIGENTE</span>
              <h2>Um plano feito para <span>seu tempo</span></h2>
              <p>Escolha até quando você quer estudar e quantos dias terá disponíveis. O Tenna organiza os assuntos e as revisões.</p>
            </div>
            <div className="tenna-auto-deadline" aria-live="polite">
              <Icon name="calendar" size={21} color="#fff" />
              <div>
                <small>PRÓXIMO VESTIBULINHO</small>
                <strong>{dataFormatadaPtBr(dataVestibulinho) || (consultandoVestibulinho ? 'Consultando data...' : 'Data não cadastrada')}</strong>
              </div>
            </div>
          </section>
          <section className="tenna-auto-config tenna-auto-config-new">
            <div className="tenna-auto-config-simple-head">
              <div>
                <span className="tenna-auto-config-kicker">PERSONALIZE SEUS ESTUDOS</span>
                <h3>Monte seu cronograma</h3>
                <p>Escolha sua duração em blocos de quatro semanas e os dias de estudo. Você poderá ajustar tudo depois.</p>
              </div>
              <span className="tenna-auto-config-simple-icon" aria-hidden="true">
                <Icon name="target" size={24} color="var(--accent-dark)" />
              </span>
            </div>
            <div className="tenna-auto-choices">
              <div className="tenna-auto-choice-block">
                <div className="tenna-auto-choice-heading">
                  <div>
                    <span className="tenna-auto-config-kicker">01 / DURAÇÃO</span>
                    <h4>Quantos meses você quer estudar?</h4>
                  </div>
                  {prazoRecomendado !== null && (
                    <span className="tenna-auto-recommended">
                      {prazoRecomendado === 0 ? 'Prova em menos de 1 mês' : `Até ${prazoRecomendado} ${prazoRecomendado === 1 ? 'mês' : 'meses'} antes da prova`}
                    </span>
                  )}
                </div>
                <div className="tenna-auto-months-grid" role="group" aria-label="Duração do plano em meses">
                  {Array.from({ length: quantidadeMesesVisiveis }, (_, indice) => indice + 1).map((quantidade) => {
                    const ultrapassa = avaliarPrazo(quantidade, dataVestibulinho).ultrapassa;
                    return (
                      <button
                        type="button"
                        key={quantidade}
                        className={`tenna-auto-month-choice${months === quantidade ? ' selected' : ''}${ultrapassa ? ' beyond-exam' : ''}`}
                        onClick={() => mudarMeses(quantidade)}
                        aria-pressed={months === quantidade}
                        aria-label={`${quantidade} ${quantidade === 1 ? 'mês' : 'meses'}${ultrapassa ? ', termina depois do Vestibulinho' : ''}`}
                        disabled={carregandoModelo || !cronogramaModelo || syncingPlan}
                      >
                        <strong>{quantidade}</strong>
                        <span>{quantidade === 1 ? 'mês' : 'meses'}</span>
                        {ultrapassa && <small>Após a prova</small>}
                      </button>
                    );
                  })}
                </div>
                {maxMonths > limiteMesesIniciais && (
                  <button
                    type="button"
                    className="studyplan-more-months"
                    onClick={() => setMostrarDuracoesExtras((atual) => !atual)}
                    aria-expanded={duracoesExpandidas}
                    disabled={syncingPlan}
                  >
                    {duracoesExpandidas ? 'Mostrar menos opções' : `Ver todas as ${maxMonths} opções de duração`}
                    <Icon name="chevron" size={15} />
                  </button>
                )}
                {dataVestibulinho && (
                  <div className="tenna-auto-month-legend">
                    <span className="tenna-auto-legend-dot" aria-hidden="true" />
                    <span>Cada mês representa quatro semanas. As opções em cinza terminam depois da prova.</span>
                  </div>
                )}
                {prazoSelecionado.conhecido && prazoSelecionado.ultrapassa && (
                  <div className="tenna-auto-date-warning" role="status">
                    <Icon name="calendar" size={18} />
                    <span>Esse período ultrapassa a data do Vestibulinho. Você pode gerar o plano mesmo assim, mas parte dos estudos ficará para depois da prova.</span>
                  </div>
                )}
                {!consultandoVestibulinho && !dataVestibulinho && (
                  <p className="tenna-auto-date-unknown">A data da prova não está disponível. Todas as durações continuam liberadas.</p>
                )}
              </div>
              <div className="tenna-auto-choice-block">
                <div className="tenna-auto-choice-heading">
                  <div>
                    <span className="tenna-auto-config-kicker">02 / FREQUÊNCIA</span>
                    <h4>Quantos dias por semana?</h4>
                  </div>
                </div>
                <div className="tenna-auto-days-grid" role="group" aria-label="Dias de estudo por semana">
                  {[1, 2, 3, 4, 5, 6, 7].map((quantidade) => (
                    <button
                      type="button"
                      key={quantidade}
                      className={`tenna-auto-day-choice${days === quantidade ? ' selected' : ''}`}
                      onClick={() => setDays(quantidade)}
                      aria-pressed={days === quantidade}
                      disabled={syncingPlan}
                    >
                      <strong>{quantidade}x</strong>
                      <span>semana</span>
                    </button>
                  ))}
                </div>
                <p className="tenna-auto-choice-help">O planejamento distribui os conteúdos pelos dias que você escolher.</p>
              </div>
            </div>
            <div className="tenna-auto-config-action">
              <div className="tenna-auto-choice-summary">
                <strong>Seu plano</strong>
                <span>{months} {months === 1 ? 'mês' : 'meses'} de preparação · {days} {days === 1 ? 'dia' : 'dias'} por semana</span>
                <small>
                  {carregandoModelo
                    ? 'Carregando conteúdos disponíveis...'
                    : cronogramaModelo
                      ? `${cronogramaModelo.sessoes_preenchidas} tópicos disponíveis para organizar`
                      : modeloError || 'Catálogo indisponível'}
                </small>
              </div>
              <div className="tenna-auto-config-buttons">
                {plan && editandoPlano && (
                  <button type="button" className="tenna-auto-secondary-button" onClick={() => setEditandoPlano(false)}>
                    Voltar ao plano
                  </button>
                )}
                <button
                  type="button"
                  className="mural-btn primary"
                  onClick={generate}
                  disabled={syncingPlan || carregandoModelo || !cronogramaModelo}
                >
                  {syncingPlan ? 'Salvando...' : plan ? 'Atualizar meu plano' : 'Gerar meu plano'}
                  {!syncingPlan && <Icon name="arrowRight" size={16} />}
                </button>
              </div>
            </div>
            {modeloError && cronogramaModelo && <details className="studyplan-config-info"><summary>Informações sobre o planejamento</summary><p>{modeloError}</p></details>}
            {syncError && <p className="tenna-auto-error" role="alert">{syncError}</p>}
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
              <h1 id="studyplan-title">Seu caminho até o <span>Vestibulinho.</span></h1>
              <p>Um passo de cada vez. Nós organizamos o caminho, você conquista cada etapa.</p>
              <div className="studyplan-hero-info">
                <span><Icon name="calendar" size={15} /> {months} {months === 1 ? 'mês' : 'meses'} de preparação</span>
                <span><Icon name="clock" size={15} /> {days} {days === 1 ? 'dia' : 'dias'} por semana</span>
              </div>
            </div>
            <div className="studyplan-hero-side">
              <div className="studyplan-hero-progress" aria-label={`${progress}% do plano concluído`}>
                <div className="studyplan-progress-number"><strong>{progress}<small>%</small></strong><span>do plano concluído</span></div>
                <div className="studyplan-hero-meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do plano">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="studyplan-hero-links">
                <button type="button" onClick={() => navigate('/cronograma')}><Icon name="calendar" size={16} /> Calendário</button>
                <button type="button" onClick={() => setEditandoPlano(true)}><Icon name="edit" size={16} /> Ajustar plano</button>
              </div>
            </div>
          </section>

          {syncingPlan && <p className="tenna-auto-sync-status" role="status">Salvando as atividades no calendário...</p>}
          {syncError && <p className="tenna-auto-error" role="alert">{syncError}</p>}
          {prazoSelecionado.conhecido && prazoSelecionado.ultrapassa && (
            <div className="tenna-auto-date-warning" role="status">
              <Icon name="calendar" size={18} />
              <span>Este plano termina depois da prova. Você ainda pode estudar normalmente, mas parte das atividades ficará para depois do Vestibulinho.</span>
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
                      ? `Mês ${focoItem.monthNumber} · Semana ${focoItem.weekNumber} · ${focoItem.dayLabel} · ${focoItem.tempoEstimado || 45} min`
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
                <Icon name="arrowRight" size={18} />
              </button>
            </div>
          </section>

          <div className="studyplan-stats" aria-label="Resumo da sua preparação">
            <div className="studyplan-stat">
              <span className="studyplan-stat-icon"><Icon name="check" size={18} /></span>
              <div><strong>{studiedPlanTopics} <small>/ {topicoIdsDoPlano.length}</small></strong><span>conteúdos concluídos</span></div>
            </div>
            <div className="studyplan-stat">
              <span className="studyplan-stat-icon"><Icon name="book" size={18} /></span>
              <div><strong>{totalPlanSessions}</strong><span>sessões planejadas</span></div>
            </div>
            <div className="studyplan-stat">
              <span className="studyplan-stat-icon"><Icon name="calendar" size={18} /></span>
              <div><strong>{days}x <small>/ semana</small></strong><span>seu ritmo de estudos</span></div>
            </div>
          </div>

          <section className="studyplan-journey" aria-labelledby="studyplan-journey-heading">
            <div className="studyplan-section-heading">
              <div>
                <span className="studyplan-eyebrow">SUA JORNADA</span>
                <h2 id="studyplan-journey-heading">Sua trilha de estudos</h2>
                <p>Explore um mês de cada vez. A semana atual já começa aberta para você.</p>
              </div>
              <span className="studyplan-stage-count"><Icon name="layers" size={15} /> Mês {current.numero} de {plan.length}</span>
            </div>
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
                      setSelected(mes.numero);
                      setOpenWeeks((prev) => new Set([...prev, `${mes.numero}-1`]));
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
                  <p>Organize seus estudos por semana e avance no seu tempo.</p>
                </div>
                <div className="studyplan-month-metrics">
                  <span><Icon name="calendar" size={15} /> {current.semanas.length} semanas</span>
                  <span><Icon name="book" size={15} /> {current.semanas.reduce((n, semana) => n + semana.days.reduce((s, dia) => s + dia.items.length, 0), 0)} sessões</span>
                </div>
              </div>

              <div className="studyplan-weeks">
                {current.semanas.map((week) => {
                  const key = `${current.numero}-${week.number}`;
                  const open = openWeeks.has(key);
                  const weekItems = week.days.flatMap((day) => day.items);
                  const weekStudyItems = weekItems.filter((item) => item.topicoId);
                  const weekDoneCount = weekStudyItems.filter((item) => studiedTopics[String(item.topicoId)]).length;
                  const weekPercent = weekStudyItems.length ? Math.round(weekDoneCount / weekStudyItems.length * 100) : 0;
                  return (
                    <article className={`studyplan-week${open ? ' open' : ''}`} key={key}>
                      <button
                        type="button"
                        className="studyplan-week-toggle"
                        aria-expanded={open}
                        aria-controls={`studyplan-week-${key}`}
                        onClick={() => setOpenWeeks((prev) => {
                          const updated = new Set(prev);
                          updated.has(key) ? updated.delete(key) : updated.add(key);
                          return updated;
                        })}
                      >
                        <span className="studyplan-week-number">{pad(week.number)}</span>
                        <span className="studyplan-week-title"><strong>Semana {week.number}</strong><small>{week.days.filter((dia) => dia.items.length).length} dias de estudo <span aria-hidden="true">·</span> {weekDoneCount} de {weekStudyItems.length} concluídos</small></span>
                        <span className="studyplan-week-progress" role="progressbar" aria-label={`Semana ${week.number}: ${weekPercent}% concluído`} aria-valuenow={weekPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${weekPercent}%` }} /></span>
                        <span className="studyplan-week-chevron"><Icon name="chevron" size={19} /></span>
                      </button>
                      {open && (
                        <div id={`studyplan-week-${key}`} className="studyplan-week-body">
                          {week.days.filter((day) => day.items.length > 0).map((day, i) => (
                            <div className="studyplan-day" key={`${key}-${day.day}-${i}`}>
                              <div className="studyplan-day-label"><span>{day.day.slice(0, 3).toUpperCase()}</span><strong>{day.day}</strong></div>
                              <div className="studyplan-lessons">
                                {day.items.map((item, itemIndex) => {
                                  const style = corMateriaPlano(item.materia || 'Outro');
                                  const studied = item.topicoId ? Boolean(studiedTopics[String(item.topicoId)]) : false;
                                  const isSaving = savingTopicId === Number(item.topicoId);
                                  return (
                                    <article className={`studyplan-lesson${studied ? ' completed' : ''}`} key={`${key}-${day.day}-${i}-${itemIndex}`} style={{ '--study-color': style.color, '--study-bg': style.bg }}>
                                      <div className="studyplan-lesson-details">
                                        <span className="studyplan-lesson-subject"><SubjectIcon materia={item.materia || 'Outro'} size={14} /> {item.materia || 'Atividade'}</span>
                                        <h4>{item.topico}</h4>
                                        <span className="studyplan-lesson-meta">
                                          {item.tipo === 'pratica' ? (item.key?.startsWith('revisao:') ? 'Revisão · questões anteriores' : 'Prática e revisão') : `${item.tempoEstimado || 45} min · ${item.prioridadeLabel || 'Conteúdo importante'}`}
                                        </span>
                                      </div>
                                      <div className="studyplan-lesson-actions">
                                        {item.topicoId && (
                                          <button type="button" className={`studyplan-complete-button${studied ? ' active' : ''}`} onClick={() => alternarEstudoItem(item)} disabled={isSaving} aria-label={`${studied ? 'Desmarcar' : 'Marcar'} ${item.topico} como ${studied ? 'pendente' : 'concluído'}`}>
                                            <Icon name="check" size={15} /> {isSaving ? 'Salvando...' : studied ? 'Concluído' : 'Concluir'}
                                          </button>
                                        )}
                                        <button type="button" className="studyplan-open-button" onClick={() => abrirDestinoItem(item)}>
                                          {item.topicoId ? 'Estudar' : 'Praticar'} <Icon name="arrowRight" size={15} />
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

          {prioritySummary && (
            <details className="studyplan-method">
              <summary><Icon name="bulb" size={17} /> Como os conteúdos foram organizados <Icon name="chevron" size={16} /></summary>
              <div>
                <p>Selecionamos {prioritySummary.totalSelecionados} de {prioritySummary.totalDisponiveis} tópicos disponíveis, distribuídos entre {prioritySummary.materiasDisponiveis} matérias.</p>
                {prioritySummary.foraDoPlano > 0 && <p>{prioritySummary.foraDoPlano} tópico(s) ficaram fora da duração escolhida.</p>}
                {prioritySummary.materiasFaltantes.length > 0 && <p>Matérias não contempladas: {prioritySummary.materiasFaltantes.join(', ')}.</p>}
              </div>
            </details>
          )}
        </main>
      )}
    </div>
  );
}