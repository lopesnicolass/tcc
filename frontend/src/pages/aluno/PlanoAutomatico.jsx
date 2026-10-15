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
import { API_URL, request } from '../../services/api.js';
import { gerarPlanoProgramado } from '../../utils/planoProgramado.js';
import { avaliarPrazo } from '../../utils/prazoVestibulinho.js';
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
    if (!valor?.modeloId || !Array.isArray(plano) || plano.length === 0 || !plano.every((mes) =>
      Array.isArray(mes?.semanas) && mes.semanas.every((semana) =>
        Array.isArray(semana?.days) && semana.days.every((dia) => Array.isArray(dia?.items))
      )
    )) return null;
    return {
      plan: plano,
      months: Array.isArray(valor) ? plano.length : Number(valor.months || plano.length),
      days: Number(valor.days || 3),
      modeloId: Number(valor.modeloId),
      modeloAtualizadoEm: valor.modeloAtualizadoEm || null,
    };
  } catch {
    return null;
  }
}
function savePlan(plan, months, days, modeloId, modeloAtualizadoEm) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${getUserKey()}`, JSON.stringify({ plan, months, days, modeloId, modeloAtualizadoEm }));
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
  const [, setCronogramaModelo] = useState(null);
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
  const [variacoesDisponiveis, setVariacoesDisponiveis] = useState([]);
  const [dataVestibulinho, setDataVestibulinho] = useState(null);
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
    return () => { ativo = false; };
  }, []);

  const prazoSelecionado = avaliarPrazo(months, dataVestibulinho);

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
            Number(c.meses) === planoAnterior?.months && Number(c.dias) === planoAnterior?.days &&
            c.atualizadoEm === planoAnterior?.modeloAtualizadoEm);
          const padrao = salvo || opcoes[0];
          setMonths(Number(padrao.meses));
          setDays(Number(padrao.dias));
          if (planoAnterior?.plan && !salvo) {
            setPlan(null);
          }
        } else {
          setCronogramaModelo(null);
          setPlan(null);
          setModeloError('O administrador ainda não publicou nenhum cronograma de estudos.');
        }
      } catch (error) {
        if (ativo) {
          setCronogramaModelo(null);
          setPlan(null);
          setModeloError(error.message || 'Não foi possível carregar as programações.');
        }
      } finally {
        if (ativo) setCarregandoModelo(false);
      }
    }
    carregarProgramacoes();
    return () => { ativo = false; };
  }, []);

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

  const combinacaoDisponivel = variacoesDisponiveis.find((c) =>
    Number(c.meses) === months && Number(c.dias) === days);

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
    if (!combinacaoDisponivel) {
      setSyncError('Ainda não há um cronograma disponível para essa combinação.');
      return;
    }
    const mesesDoPlano = Number(months);
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
    const planoGerado = gerarPlanoProgramado(programacao);
    if (!planoGerado.length) {
      setSyncError('A programação escolhida não possui conteúdos válidos.');
      setSyncingPlan(false);
      return;
    }
    setCronogramaModelo(programacao);
    setSyncError('');
    setMonths(mesesDoPlano);
    setPlan(planoGerado);
    setSelected(1);
    setOpenWeeks(new Set(['1-1']));
    savePlan(planoGerado, mesesDoPlano, days, programacao.id, programacao.atualizado_em);
    setEditandoPlano(false);
    const usuarioId = Number(getUser().id || getUser().usuarioId || 0);
    if (!usuarioId) { setSyncingPlan(false); return; }
    const atividades = montarAtividadesDoPlano(planoGerado);
    if (!atividades.length) { setSyncingPlan(false); return; }
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
    setMonths(quantidade);
    setSyncError('');
  }
  const mostrandoConfig = !plan || editandoPlano;
  const mesesDisponiveis = Array.from({ length: 12 }, (_, index) => 12 - index);
  const diasDisponiveis = Array.from({ length: 7 }, (_, index) => index + 1);
  const existeProgramacao = Boolean(combinacaoDisponivel);


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
                      className={`tenna-auto-choice ${months === quantidade ? 'is-selected' : ''} ${avaliarPrazo(quantidade, dataVestibulinho).ultrapassa ? 'is-after-exam' : ''}`}
                      aria-pressed={months === quantidade}
                      aria-label={`${quantidade} ${quantidade === 1 ? 'mês' : 'meses'}`}
                      title={avaliarPrazo(quantidade, dataVestibulinho).ultrapassa ? 'Este período ultrapassa a data do Vestibulinho, mas pode ser selecionado.' : undefined}
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
                      onClick={() => { setDays(quantidade); setSyncError(''); }}
                      disabled={syncingPlan}
                    >
                      <strong>{quantidade}</strong>
                      <small>{quantidade === 1 ? 'dia' : 'dias'}</small>
                    </button>
                  ))}
                </div>

              </div>
            </div>

            <div className="tenna-auto-simple-footer">
                  {plan && editandoPlano && (
                    <button type="button" className="tenna-auto-secondary-button" onClick={() => setEditandoPlano(false)}>
                      Voltar ao plano
                    </button>
                  )}
                  <button
                    type="button"
                    className="mural-btn primary tenna-auto-simple-submit"
                    onClick={generate}
                    disabled={syncingPlan}
                  >
                    {syncingPlan ? 'Salvando...' : plan ? 'Atualizar cronograma' : 'Gerar meu cronograma'}
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
                                          {item.tipo === 'pratica' ? (item.key?.startsWith('revisao:') ? 'Revisão · questões anteriores' : 'Prática e revisão') : `${item.tempoEstimado || 45} min · Conteúdo programado`}
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

          <p className="tenna-auto-admin-note">Esta programação foi definida pelo administrador para {months} {months === 1 ? 'mês' : 'meses'} e {days} {days === 1 ? 'dia' : 'dias'} por semana.</p>
        </main>
      )}
    </div>
  );
}