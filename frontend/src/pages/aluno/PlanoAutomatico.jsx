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
  const progress =
    useMemo(
      () => {
        if (!plan) {
          return 0;
        }
        try {
          const done =
            JSON.parse(
              localStorage.getItem(
                `conteudosEstudados_${getUserKey()}`
              ) || '{}'
            );
          const keys = [
            ...new Set(
              plan.flatMap(
                (m) =>
                  m.semanas.flatMap(
                    (w) =>
                      w.days.flatMap(
                        (d) =>
                          d.items
                            .filter((item) => item.tipo !== 'pratica' && item.topicoId)
                            .map((item) => item.key)
                      )
                  )
              )
            )
          ];
          return keys.length
            ? Math.round(
                (
                  keys.filter(
                    (k) =>
                      done[k]
                  ).length /
                  keys.length
                ) *
                100
              )
            : 0;
        } catch {
          return 0;
        }
      },
      [plan]
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
  const focoItem =
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
          <section className="tenna-auto-generated-head">
            <div>
              <span className="tenna-auto-config-kicker">SEU CRONOGRAMA ESTÁ PRONTO</span>
              <h2>Seu plano de estudos</h2>
              <p>{months} {months === 1 ? 'mês' : 'meses'} · {days} {days === 1 ? 'dia' : 'dias'} por semana</p>
            </div>
            <button type="button" className="tenna-auto-secondary-button" onClick={() => setEditandoPlano(true)}>
              Ajustar planejamento
            </button>
          </section>
          {syncingPlan && <p className="tenna-auto-sync-status" role="status">Salvando as atividades no calendário...</p>}
          {syncError && <p className="tenna-auto-error" role="alert">{syncError}</p>}
          {prazoSelecionado.conhecido && prazoSelecionado.ultrapassa && (
            <div className="tenna-auto-date-warning" role="status">
              <Icon name="calendar" size={18} />
              <span>Este plano vai além da data do Vestibulinho. Se quiser concluir antes, use “Ajustar planejamento”.</span>
            </div>
          )}
          {prioritySummary && (
            <details className="tenna-auto-plan-details">
              <summary>Como os conteúdos foram priorizados</summary>
              <p>{prioritySummary.totalSelecionados} de {prioritySummary.totalDisponiveis} tópicos selecionados, em {prioritySummary.materiasDisponiveis} matérias.</p>
              {prioritySummary.foraDoPlano > 0 && <p>{prioritySummary.foraDoPlano} tópico(s) ficaram fora do plano pela duração escolhida.</p>}
              {prioritySummary.materiasFaltantes.length > 0 && <p>Matérias não contempladas: {prioritySummary.materiasFaltantes.join(', ')}.</p>}
            </details>
          )}
          <section className="tenna-auto-next">
            <div className="tenna-auto-next-icon">
              <SubjectIcon
                materia={
                  focoMateria
                }
                size={20}
              />
            </div>
            <div className="tenna-auto-next-info">
              <span>
                PRÓXIMO FOCO
              </span>
              <strong>
                {focoMateria}
              </strong>
              <p>
                {focoTopico}
              </p>
            </div>
            <button
              className="tenna-auto-next-button"
              onClick={() =>
                navigate(
                  '/conteudos'
                )
              }
            >
              Estudar conteúdo
              <Icon
                name="arrowRight"
                size={14}
              />
            </button>
          </section>
          <section className="tenna-auto-journey">
            <div className="tenna-auto-journey-head">
              <div>
                <span className="tenna-auto-step">
                  02
                </span>
                <div>
                  <h3>
                    Sua jornada
                  </h3>
                  <p>
                    {months}{' '}
                    {months === 1
                      ? 'mês'
                      : 'meses'}
                    {' · '}
                    {days}x por semana
                  </p>
                </div>
              </div>
              <div className="tenna-auto-progress-value">
                <strong>
                  {progress}%
                </strong>
                <span>
                  concluído
                </span>
              </div>
            </div>
            <div className="tenna-auto-progress-track">
              <span
                style={{
                  width:
                    `${progress}%`
                }}
              />
            </div>
            <div className="tenna-auto-timeline-wrap">
              <div className="tenna-auto-timeline-line" />
              <div className="tenna-auto-timeline">
                {plan.map(
                  (m) => (
                    <button
                      key={
                        m.numero
                      }
                      className={
                        `tenna-auto-timeline-item ${
                          m.numero ===
                          selected
                            ? 'active'
                            : ''
                        }`
                      }
                      onClick={() =>
                        setSelected(
                          m.numero
                        )
                      }
                    >
                      <span className="tenna-auto-timeline-dot">
                        {m.numero}
                      </span>
                      <strong>
                        Mês {m.numero}
                      </strong>
                      <small>
                        {m.numero ===
                        1
                          ? 'Começo'
                          : m.numero ===
                              months
                            ? 'Reta final'
                            : 'Preparação'}
                      </small>
                    </button>
                  )
                )}
              </div>
            </div>
          </section>
          <section className="tenna-auto-month">
            <div className="tenna-auto-month-head">
              <div className="tenna-auto-month-title">
                <div
                  className="tenna-auto-month-icon"
                  style={{
                    color:
                      'var(--accent-dark)'
                  }}
                >
                  <Icon
                    name="calendar"
                    size={22}
                  />
                </div>
                <div>
                  <span>
                    MÊS {current.numero}
                    {' · '}
                    {
                      phases[
                        Math.min(
                          current.numero -
                            1,
                          phases.length -
                            1
                        )
                      ]
                    }
                  </span>
                  <h3>
                    {current.nome}
                  </h3>
                  <p>
                    {current.semanas.reduce(
                      (
                        n,
                        w
                      ) =>
                        n +
                        w.days.filter(
                          (
                            day
                          ) =>
                            day.items
                              .length
                        ).length,
                      0
                    )}
                    {' dias de estudo organizados'}
                  </p>
                </div>
              </div>
              <div className="tenna-auto-month-count">
                <strong>
                  {
                    current.semanas
                      .length
                  }
                </strong>
                <span>
                  semanas
                </span>
              </div>
            </div>
            <div className="tenna-auto-weeks">
              {current.semanas.map(
                (w) => {
                  const key =
                    `${current.numero}-${w.number}`;
                  const open =
                    openWeeks.has(
                      key
                    );
                  const adding =
                    addingWeek ===
                    key;
                  return (
                    <article
                      className={
                        `tenna-auto-week ${
                          open
                            ? 'open'
                            : ''
                        }`
                      }
                      key={
                        key
                      }
                    >
                      <button
                        className="tenna-auto-week-head"
                        onClick={() =>
                          setOpenWeeks(
                            (prev) => {
                              const n =
                                new Set(
                                  prev
                                );
                              n.has(
                                key
                              )
                                ? n.delete(
                                    key
                                  )
                                : n.add(
                                    key
                                  );
                              return n;
                            }
                          )
                        }
                      >
                        <span className="tenna-auto-week-number">
                          {pad(
                            w.number
                          )}
                        </span>
                        <span className="tenna-auto-week-title">
                          <strong>
                            Semana {w.number}
                          </strong>
                          <small>
                            {
                              w.days.filter(
                                (
                                  day
                                ) =>
                                  day.items
                                    .length
                              ).length
                            }
                            {' dias com conteúdo'}
                          </small>
                        </span>
                        <span className="tenna-auto-week-status">
                          {open
                            ? 'Fechar'
                            : 'Ver semana'}
                          <b>
                            ›
                          </b>
                        </span>
                      </button>
                      {open && (
                        <div className="tenna-auto-week-body">
                          <div className="tenna-auto-day-list">
                            {w.days.map(
                              (
                                d,
                                i
                              ) => {
                                const primeiroItem =
                                  d.items[0];
                                return (
                                  <div
                                    className={
                                      `tenna-auto-day ${
                                        d.items.length
                                          ? ''
                                          : 'empty'
                                      }`
                                    }
                                    key={i}
                                  >
                                    <div className="tenna-auto-day-name">
                                      {
                                        d.day
                                          .slice(
                                            0,
                                            3
                                          )
                                          .toUpperCase()
                                      }
                                    </div>
                                    <div className="tenna-auto-day-icon">
                                      <SubjectIcon
                                        materia={
                                          primeiroItem?.materia ||
                                          'Estudo'
                                        }
                                        size={16}
                                      />
                                    </div>
                                    <div className="tenna-auto-day-content">
                                      {d.items.length ? (
                                        d.items.map(
                                          (
                                            item,
                                            itemIndex
                                          ) => (
                                            <div
                                              className="tenna-auto-day-item"
                                              key={
                                                itemIndex
                                              }
                                            >
                                              <strong>
                                                {
                                                  item.materia
                                                }
                                              </strong>
                                              <span>
                                                {item.topico}
                                              </span>
                                              {item.tipo === 'pratica' ? (
                                                <small className="tenna-auto-item-priority pratica">
                                                  {item.key?.startsWith('revisao:')
                                                    ? 'Revisão mensal · questões de provas anteriores'
                                                    : 'Prática e revisão de erros'}
                                                </small>
                                              ) : (
                                                <small className={`tenna-auto-item-priority prioridade-${item.prioridade || 2}`} title={rotuloFrequencia(item.frequenciaProvas)}>
                                                  {item.prioridadeLabel || 'Importante'} · {item.tempoEstimado || 45} min
                                                </small>
                                              )}
                                            </div>
                                          )
                                        )
                                      ) : (
                                        <div className="tenna-auto-day-item vazio">
                                          <strong>
                                            Dia reservado
                                          </strong>
                                          <span>
                                            Nenhum conteúdo foi distribuído para este dia.
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <button
                            className="mural-btn primary"
                            onClick={() =>
                              addWeek(
                                current,
                                w
                              )
                            }
                            disabled={
                              adding
                            }
                          >
                            {adding
                              ? 'Adicionando...'
                              : '+ Adicionar semana ao meu calendário'}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}