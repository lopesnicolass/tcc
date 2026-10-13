import '../../styles/aluno/PlanoAutomatico.css';
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
import { gerarPlanoPrioritario, resumirPrioridades, rotuloFrequencia } from '../../utils/planoPrioridade.js';
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
                  {Array.from({ length: maxMonths }, (_, indice) => indice + 1).map((quantidade) => {
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
                {dataVestibulinho && (
                  <div className="tenna-auto-month-legend">
                    <span className="tenna-auto-legend-dot" aria-hidden="true" />
                    <span>Cada mês equivale a 4 semanas. Os meses cinzas terminam após a prova, mas podem ser escolhidos.</span>
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
            {modeloError && cronogramaModelo && <p className="tenna-auto-info-note">{modeloError}</p>}
            {syncError && <p className="tenna-auto-error" role="alert">{syncError}</p>}
          </section>
        </>
      )}
      {plan && !editandoPlano && (
        <div className="tenna-auto-result">
          <section className="tenna-auto-generated-hero">
            <div className="tenna-auto-generated-hero-copy">
              <span className="tenna-auto-config-kicker">✦ SUA TRILHA DE ESTUDOS</span>
              <h2>Seu caminho até o Vestibulinho</h2>
              <p>{months} {months === 1 ? 'mês' : 'meses'} de preparação · {days} {days === 1 ? 'dia' : 'dias'} por semana</p>
              <div className="tenna-auto-generated-chips">
                <span><Icon name="book" size={14} /> {topicoIdsDoPlano.length} conteúdos</span>
                <span><Icon name="calendar" size={14} /> {totalPlanSessions} sessões de estudo</span>
                {prazoSelecionado.conhecido && (
                  <span className={prazoSelecionado.ultrapassa ? 'warn' : 'ok'}>
                    {prazoSelecionado.ultrapassa ? 'Termina após a prova' : 'Termina antes da prova'}
                  </span>
                )}
              </div>
            </div>
            <div className="tenna-auto-generated-hero-actions">
              <button type="button" className="tenna-auto-secondary-button" onClick={() => navigate('/cronograma')}>
                <Icon name="calendar" size={16} /> Ver calendário
              </button>
              <button type="button" className="mural-btn primary" onClick={() => setEditandoPlano(true)}>
                <Icon name="edit" size={16} /> Ajustar plano
              </button>
            </div>
          </section>

          {syncingPlan && <p className="tenna-auto-sync-status" role="status">Salvando as atividades no calendário...</p>}
          {syncError && <p className="tenna-auto-error" role="alert">{syncError}</p>}
          {prazoSelecionado.conhecido && prazoSelecionado.ultrapassa && (
            <div className="tenna-auto-date-warning" role="status">
              <Icon name="calendar" size={18} />
              <span>Este plano vai além da data do Vestibulinho. Você ainda pode usar o cronograma, mas uma parte dos estudos ficará para depois da prova.</span>
            </div>
          )}

          <section className="tenna-auto-overview-grid">
            <article className="tenna-auto-overview-card tenna-auto-overview-focus">
              <div className="tenna-auto-focus-glow" aria-hidden="true"><Icon name="target" size={134} /></div>
              <div className="tenna-auto-overview-head">
                <span className="tenna-auto-overview-icon"><SubjectIcon materia={focoMateria || 'Outro'} size={18} /></span>
                <div>
                  <small>COMECE POR AQUI</small>
                  <strong>{focoMateria || 'Seu próximo estudo'}</strong>
                </div>
              </div>
              <h3>{focoTopico || 'Seu plano já está organizado.'}</h3>
              <p>
                {focoItem?.topicoId
                  ? `Mês ${focoItem.monthNumber} · Semana ${focoItem.weekNumber} · ${focoItem.dayLabel}`
                  : focoItem?.tipo === 'pratica'
                    ? 'Bloco de prática para revisar e consolidar o conteúdo.'
                    : 'Abra o plano e comece pelo primeiro bloco recomendado.'}
              </p>
              <div className="tenna-auto-overview-actions">
                <button
                  type="button"
                  className="mural-btn primary"
                  onClick={() => focoItem && abrirDestinoItem(focoItem)}
                  disabled={!focoItem}
                >
                  {focoItem?.topicoId ? 'Estudar agora' : focoItem?.tipo === 'pratica' ? 'Ir para prática' : 'Começar agora'}
                  <Icon name="arrowRight" size={16} />
                </button>
              </div>
            </article>

            <article className="tenna-auto-overview-card">
              <div className="tenna-auto-overview-head">
                <span className="tenna-auto-overview-icon"><Icon name="chart" size={18} /></span>
                <div>
                  <small>PROGRESSO GERAL</small>
                  <strong>{progress}% concluído</strong>
                </div>
              </div>
              <div className="tenna-auto-progress-main">
                <div className="tenna-auto-progress-ring" style={{ '--progress': `${progress}%` }} role="img" aria-label={`${progress}% dos conteúdos estudados`}>
                  <div><strong>{progress}%</strong><small>concluído</small></div>
                </div>
                <div className="tenna-auto-progress-details">
                  <strong>{studiedPlanTopics} <span>de {topicoIdsDoPlano.length}</span></strong>
                  <p>conteúdos estudados</p>
                  <small>Todo assunto concluído aproxima você da prova.</small>
                </div>
              </div>
            </article>

            <article className="tenna-auto-overview-card">
              <div className="tenna-auto-overview-head">
                <span className="tenna-auto-overview-icon"><Icon name="calendar" size={18} /></span>
                <div>
                  <small>SEU RITMO</small>
                  <strong>Um passo de cada vez</strong>
                </div>
              </div>
              <div className="tenna-auto-rhythm-stats">
                <div><strong>{days}<small>x</small></strong><span>por semana</span></div>
                <div><strong>{months}</strong><span>{months === 1 ? 'mês' : 'meses'}</span></div>
                <div><strong>{totalPlanSessions}</strong><span>sessões</span></div>
              </div>
              <p className="tenna-auto-rhythm-message">{loadingProgress ? 'Sincronizando seu progresso...' : 'Sua rotina está pronta. Comece pelo primeiro assunto!'}</p>
            </article>
          </section>

          {prioritySummary && (
            <details className="tenna-auto-plan-details">
              <summary>Como os conteúdos foram priorizados</summary>
              <p>{prioritySummary.totalSelecionados} de {prioritySummary.totalDisponiveis} tópicos selecionados, em {prioritySummary.materiasDisponiveis} matérias.</p>
              {prioritySummary.foraDoPlano > 0 && <p>{prioritySummary.foraDoPlano} tópico(s) ficaram fora do plano pela duração escolhida.</p>}
              {prioritySummary.materiasFaltantes.length > 0 && <p>Matérias não contempladas: {prioritySummary.materiasFaltantes.join(', ')}.</p>}
            </details>
          )}

          <section className="tenna-auto-journey">
            <div className="tenna-auto-journey-head">
              <div>
                <span className="tenna-auto-step">02</span>
                <div>
                  <h3>Escolha sua etapa</h3>
                  <p>Acompanhe mês a mês e abra as semanas para estudar.</p>
                </div>
              </div>
              <div className="tenna-auto-journey-status">
                <Icon name="layers" size={17} /> Etapa {current?.numero || 1} de {months}
              </div>
            </div>
            <div className="tenna-auto-timeline-wrap">
              <div className="tenna-auto-timeline-line" />
              <div className="tenna-auto-timeline">
                {plan.map((m) => (
                  <button
                    key={m.numero}
                    type="button"
                    className={`tenna-auto-timeline-item ${m.numero === selected ? 'active' : ''}`}
                    aria-pressed={m.numero === selected}
                    onClick={() => {
                      setSelected(m.numero);
                      setOpenWeeks((prev) => new Set([...prev, `${m.numero}-1`]));
                    }}
                  >
                    <span className="tenna-auto-timeline-dot">{pad(m.numero)}</span>
                    <span className="tenna-auto-timeline-labels">
                      <strong>Mês {m.numero}</strong>
                      <small>{m.numero === 1 ? 'Ponto de partida' : m.numero === months ? 'Reta final' : 'Em preparação'}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="tenna-auto-month tenna-auto-month-updated">
            <div className="tenna-auto-month-head">
              <div className="tenna-auto-month-title">
                <div className="tenna-auto-month-icon" style={{ color: 'var(--accent-dark)' }}>
                  <Icon name="calendar" size={22} />
                </div>
                <div>
                  <span>MÊS {current.numero} · {phases[Math.min(current.numero - 1, phases.length - 1)]}</span>
                  <h3>{current.nome}</h3>
                  <p>
                    {current.semanas.reduce((n, w) => n + w.days.filter((day) => day.items.length).length, 0)} dias planejados. Abra uma semana e escolha o que estudar.
                  </p>
                </div>
              </div>
              <div className="tenna-auto-month-badges">
                <span>{current.semanas.length} semanas</span>
                <span>{current.semanas.reduce((n, w) => n + w.days.reduce((acc, day) => acc + day.items.length, 0), 0)} sessões</span>
              </div>
            </div>
            <div className="tenna-auto-weeks">
              {current.semanas.map((w) => {
                const key = `${current.numero}-${w.number}`;
                const open = openWeeks.has(key);
                const weekItems = w.days.flatMap((day) => day.items);
                const weekStudyItems = weekItems.filter((item) => item.topicoId);
                const weekDoneCount = weekStudyItems.filter((item) => studiedTopics[String(item.topicoId)]).length;
                return (
                  <article className={`tenna-auto-week ${open ? 'open' : ''}`} key={key}>
                    <button
                      type="button"
                      className="tenna-auto-week-head"
                      onClick={() =>
                        setOpenWeeks((prev) => {
                          const n = new Set(prev);
                          n.has(key) ? n.delete(key) : n.add(key);
                          return n;
                        })
                      }
                    >
                      <span className="tenna-auto-week-number">{pad(w.number)}</span>
                      <span className="tenna-auto-week-title">
                        <strong>Semana {w.number}</strong>
                        <small>
                          {w.days.filter((day) => day.items.length).length} dias de estudo · {weekDoneCount} de {weekStudyItems.length} concluídos
                        </small>
                        <span className="tenna-auto-week-meter" aria-hidden="true">
                          <span style={{ width: `${weekStudyItems.length ? Math.round(weekDoneCount / weekStudyItems.length * 100) : 0}%` }} />
                        </span>
                      </span>
                      <span className="tenna-auto-week-status">{open ? 'Fechar' : 'Ver semana'}<b>›</b></span>
                    </button>

                    {open && (
                      <div className="tenna-auto-week-body">
                        <div className="tenna-auto-days-grid-plan">
                          {w.days.map((d, i) => (
                            <section className={`tenna-auto-day-card ${d.items.length ? '' : 'empty'}`} key={i}>
                              <div className="tenna-auto-day-card-head">
                                <span className="tenna-auto-day-card-chip">{d.day.slice(0, 3).toUpperCase()}</span>
                                <div>
                                  <strong>{d.day}</strong>
                                  <span>{d.items.length ? `${d.items.length} ${d.items.length === 1 ? 'conteúdo planejado' : 'conteúdos planejados'}` : 'Dia reservado para respiro ou ajuste'}</span>
                                </div>
                              </div>

                              <div className="tenna-auto-day-items-enhanced">
                                {d.items.length ? (
                                  d.items.map((item, itemIndex) => {
                                    const style = corMateriaPlano(item.materia || 'Outro');
                                    const studied = item.topicoId ? Boolean(studiedTopics[String(item.topicoId)]) : false;
                                    const isSaving = savingTopicId === Number(item.topicoId);
                                    return (
                                      <article
                                        className={`tenna-auto-study-card ${studied ? 'done' : ''}`}
                                        key={`${key}-${i}-${itemIndex}`}
                                        style={{ '--study-color': style.color, '--study-bg': style.bg }}
                                      >
                                        <div className="tenna-auto-study-card-top">
                                          <span className="tenna-auto-study-subject"><SubjectIcon materia={item.materia} size={13} /> {item.materia}</span>
                                          {item.topicoId && (
                                            <button
                                              type="button"
                                              className={`tenna-auto-study-toggle ${studied ? 'done' : ''}`}
                                              onClick={() => alternarEstudoItem(item)}
                                              disabled={isSaving}
                                            >
                                              {isSaving ? 'Salvando...' : studied ? '✓ Estudado' : '✓ Concluir'}
                                            </button>
                                          )}
                                        </div>

                                        <h4>{item.topico}</h4>

                                        <div className="tenna-auto-study-meta">
                                          {item.tipo === 'pratica' ? (
                                            <span className="tenna-auto-item-priority pratica">
                                              {item.key?.startsWith('revisao:') ? 'Revisão mensal · questões de provas anteriores' : 'Prática e revisão de erros'}
                                            </span>
                                          ) : (
                                            <span className={`tenna-auto-item-priority prioridade-${item.prioridade || 2}`} title={rotuloFrequencia(item.frequenciaProvas)}>
                                              {item.prioridadeLabel || 'Importante'} · {item.tempoEstimado || 45} min
                                            </span>
                                          )}
                                          {item.topicoId && <span className={`tenna-auto-study-state ${studied ? 'done' : ''}`}>{studied ? 'Concluído' : 'Pendente'}</span>}
                                        </div>

                                        <div className="tenna-auto-study-actions">
                                          <button type="button" className="tenna-auto-study-open" onClick={() => abrirDestinoItem(item)}>
                                            {item.topicoId ? 'Estudar conteúdo' : item.tipo === 'pratica' ? 'Praticar agora' : 'Abrir'}
                                            <Icon name="arrowRight" size={14} />
                                          </button>
                                        </div>
                                      </article>
                                    );
                                  })
                                ) : (
                                  <div className="tenna-auto-day-empty-enhanced">
                                    <Icon name="calendar" size={16} />
                                    <span>Sem conteúdo obrigatório neste dia.</span>
                                  </div>
                                )}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}