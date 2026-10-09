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
function savePlan(
  plan
) {
  localStorage.setItem(
    `${STORAGE_KEY}_${getUserKey()}`,
    JSON.stringify(plan)
  );
}
export default function PlanoAutomatico() {
  const navigate =
    useNavigate();
  const { addXP } =
    useGamification();
  const [
    months,
    setMonths
  ] =
    useState(6);
  const [
    maxMonths,
    setMaxMonths
  ] =
    useState(12);
  const [
    days,
    setDays
  ] =
    useState(3);
  const [
    plan,
    setPlan
  ] =
    useState(null);
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
  useEffect(() => {
    async function carregarCronogramaModelo() {
      setCarregandoModelo(true);
      setModeloError('');
      setCronogramaModelo(null);
      setPlan(null);
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
        setMonths((atual) => Math.min(Math.max(1, atual), limiteMeses));
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
                    7 *
                      (
                        month.numero -
                        1
                      ) +
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
    savePlan(planoGerado);
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
            7 *
              (
                month.numero -
                1
              ) +
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
  return (
    <div className="tenna-auto-plan page-shell">
      <section className="tenna-auto-intro">
        <div className="tenna-auto-intro-copy">
          <span className="tenna-auto-kicker">
            PLANO AUTOMÁTICO
          </span>
          <h2>
            Uma jornada para você saber{' '}
            <span>
              o que estudar
            </span>
          </h2>
          <p>
            O Tenna organiza sua preparação para o Vestibulinho
            de acordo com o tempo que você tem, priorizando conteúdos essenciais
            e reservando momentos para praticar com provas anteriores.
          </p>
        </div>
        <div className="tenna-auto-intro-badge">
          <Icon
            name="target"
            size={26}
            color="#fff"
          />
          <small>
            Seu foco
          </small>
        </div>
      </section>
      <section className="tenna-auto-config">
        <div className="tenna-auto-config-head">
          <div className="tenna-auto-config-title">
            <div>
              <h3>
                Monte seu plano
              </h3>
              <p>
                Escolha quantos meses e dias por semana você consegue estudar. O plano seleciona os conteúdos pela prioridade cadastrada.
              </p>
              {plan && (
                <span className="tenna-auto-ready">
                  ✓ Plano criado
                </span>
              )}
            </div>
          </div>
          <div className="tenna-auto-personalized">
            <div className="tenna-auto-personalized-icon">
              <Icon
                name="target"
                size={27}
                color="var(--accent-dark)"
              />
            </div>
            <div className="tenna-auto-personalized-copy">
              <strong>
                Seu plano será adaptado ao seu ritmo
              </strong>
              <span>
                ✓ Prioriza os conteúdos essenciais em planos curtos
              </span>
              <span>
                ✓ Usa a recorrência observada nas provas quando ela foi cadastrada
              </span>
              <span>
                ✓ Reserva uma sessão mensal para revisão e questões anteriores
              </span>
            </div>
            <div
              className="tenna-auto-personalized-deco"
              aria-hidden="true"
            >
              ✦
            </div>
          </div>
        </div>
        <div className="tenna-auto-options">
          <div className="tenna-auto-option-group">
            <span className="tenna-auto-label">
              Tempo disponível para estudar
            </span>
            <div className="tenna-auto-pills">
              {Array.from({ length: maxMonths }, (_, indice) => indice + 1).map((quantidade) => (
                <button
                  key={quantidade}
                  type="button"
                  className={`tenna-auto-pill ${months === quantidade ? 'selected' : ''}`}
                  onClick={() => setMonths(quantidade)}
                  aria-pressed={months === quantidade}
                >
                  <strong>{quantidade}</strong>
                  <span>{quantidade === 1 ? 'mês' : 'meses'}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="tenna-auto-option-group">
            <span className="tenna-auto-label">
              Dias de estudo por semana
            </span>
            <div className="tenna-auto-pills days">
              {[1, 2, 3, 4, 5, 6, 7].map(
                (d) => (
                  <button
                    key={d}
                    type="button"
                    className={
                      `tenna-auto-pill ${
                        days === d
                          ? 'selected'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setDays(d)
                    }
                  >
                    <strong>
                      {d}x
                    </strong>
                    <span>
                      por semana
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        {plan && prioritySummary && (
          <div className="tenna-auto-priority-summary" role="status">
            <strong>Como o plano priorizou os conteúdos</strong>
            <div className="tenna-auto-priority-counts">
              <span><b>{prioritySummary.essenciais}</b> essenciais</span>
              <span><b>{prioritySummary.importantes}</b> importantes</span>
              <span><b>{prioritySummary.complementares}</b> complementares</span>
            </div>
            <p>
              O plano selecionou {prioritySummary.totalSelecionados} de {prioritySummary.totalDisponiveis} tópicos ativos, distribuídos em {prioritySummary.materiasDisponiveis} matérias cadastradas. A seleção só cobre os conteúdos que já existem no catálogo.
            </p>
            {prioritySummary.foraDoPlano > 0 && (
              <p>
                {prioritySummary.foraDoPlano} tópico(s) não entraram neste plano por falta de tempo. Aumente os meses ou os dias semanais para ampliar a cobertura.
              </p>
            )}
            {prioritySummary.materiasFaltantes.length > 0 && (
              <p>
                Este plano não conseguiu incluir tópicos de: {prioritySummary.materiasFaltantes.join(', ')}. Com tão poucas sessões, não é possível cobrir todas as matérias; aumente o tempo disponível para ampliar a cobertura.
              </p>
            )}
            {prioritySummary.recorrenciaNaoAnalisada > 0 && (
              <p>
                A recorrência de {prioritySummary.recorrenciaNaoAnalisada} tópico(s) ainda não foi analisada. Até isso ser preenchido no cadastro administrativo, o plano usa a prioridade pedagógica como critério principal.
              </p>
            )}
          </div>
        )}
        <div className="tenna-auto-config-bottom">
          <div className="tenna-auto-config-note-wrap">
            {carregandoModelo ? (
              <span className="tenna-auto-config-note">
                <Icon
                  name="book"
                  size={14}
                  color="var(--accent-dark)"
                />
                Carregando o cronograma definido pelo administrador...
              </span>
            ) : cronogramaModelo ? (
              <span className="tenna-auto-config-note">
                <Icon
                  name="book"
                  size={14}
                  color="var(--accent-dark)"
                />
                {cronogramaModelo.modeloAdministradorConfigurado
                  ? 'Modelo de referência:'
                  : 'Base do cronograma:'}{' '}
                <strong>
                  {cronogramaModelo.nome}
                </strong>
                {' · '}
                {cronogramaModelo.meses}{' '}
                {cronogramaModelo.meses === 1
                  ? 'mês'
                  : 'meses'}
                {' · '}
                {
                  cronogramaModelo.sessoes_preenchidas
                }{' '}
                tópicos ativos no catálogo para personalizar o plano
              </span>
            ) : (
              <span className="tenna-auto-config-note error">
                <Icon
                  name="book"
                  size={14}
                  color="var(--accent-dark)"
                />
                {
                  modeloError ||
                  'O administrador ainda não configurou um cronograma automático.'
                }
              </span>
            )}
          </div>
          <button
            className="mural-btn primary"
            onClick={
              generate
            }
            disabled={
              syncingPlan ||
              carregandoModelo ||
              !cronogramaModelo
            }
          >
            {syncingPlan
              ? 'Gerando e salvando...'
              : 'Gerar meu plano'}
          </button>
          {syncError && (
            <span className="tenna-auto-error">
              {syncError}
            </span>
          )}
        </div>
      </section>
      {plan && (
        <div className="tenna-auto-result">
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