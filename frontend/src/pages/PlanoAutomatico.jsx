import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../context/GamificationContext.jsx';
import { getSubjectStyle } from '../utils/subjects.js';
import SubjectIcon from '../components/cu.jsx';
import Icon from '../components/Icon.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DAYS_BY_COUNT = {
  1: ['Quarta'],
  2: ['Terça', 'Quinta'],
  3: ['Segunda', 'Quarta', 'Sexta'],
  4: ['Segunda', 'Terça', 'Quinta', 'Sexta'],
  5: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
  6: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  7: [
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
    'Domingo'
  ]
};

const DAY_INDEX = {
  Domingo: 0,
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6
};

const PLAN_STORAGE_KEY =
  'tenna_plano_automatico';

const CALENDAR_STORAGE_KEY =
  'tenna_calendario_atividades';

const pad = (n) =>
  String(n).padStart(2, '0');

function getUserKey() {
  try {
    const usuario =
      JSON.parse(
        localStorage.getItem(
          'etecamp_usuario'
        ) || '{}'
      );

    return String(
      usuario.id ||
        usuario.usuarioId ||
        'anonimo'
    );
  } catch {
    return 'anonimo';
  }
}

function formatMonth(date) {
  const text =
    date.toLocaleDateString(
      'pt-BR',
      {
        month: 'long',
        year: 'numeric'
      }
    );

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}

function getDateForWeekDay(
  year,
  month,
  weekNumber,
  dayName
) {
  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const firstDayIndex =
    firstDay.getDay();

  const targetIndex =
    DAY_INDEX[dayName];

  let offset =
    targetIndex -
    firstDayIndex;

  if (offset < 0) {
    offset += 7;
  }

  const date =
    1 +
    offset +
    (weekNumber - 1) * 7;

  const result =
    new Date(
      year,
      month,
      date
    );

  if (
    result.getMonth() !==
    month
  ) {
    return null;
  }

  return result;
}

/*
 * Gera o plano usando as matérias e tópicos
 * vindos do banco de dados.
 */
function generatePlan(
  months,
  days,
  materias
) {
  const daysList =
    DAYS_BY_COUNT[days] ||
    DAYS_BY_COUNT[3];

  const materiasAtivas =
  (materias || [])
    .filter(
      (materia) =>
        Number(materia.ativa) === 1
    )
    .map(
      (materia) => ({
        ...materia,
        topicos:
          (materia.topicos || [])
            .filter(
              (topico) =>
                Number(topico.ativo) === 1
            )
      })
    )
    .filter(
      (materia) =>
        materia.topicos.length > 0
    );

  if (!materiasAtivas.length) {
    return [];
  }

  let materiaIndex = 0;

  const topicPositions =
    Object.fromEntries(
      materiasAtivas.map(
        (materia) => [
          materia.id,
          0
        ]
      )
    );

  const now =
    new Date();

  return Array.from(
    {
      length: months
    },
    (_, monthIndex) => {
      const monthDate =
        new Date(
          now.getFullYear(),
          now.getMonth() +
            monthIndex,
          1
        );

      const semanas =
        Array.from(
          {
            length: 4
          },
          (_, weekIndex) => {
            const weekNumber =
              weekIndex + 1;

            const daysData =
              daysList.map(
                (day) => {
                  const materia =
                    materiasAtivas[
                      materiaIndex %
                        materiasAtivas.length
                    ];

                  materiaIndex++;

                  const position =
                    topicPositions[
                      materia.id
                    ] || 0;

                  const topics =
                    materia.topicos;

                  const topic =
                    topics[
                      position %
                        topics.length
                    ];

                  topicPositions[
                    materia.id
                  ] =
                    position + 1;

                  const date =
                    getDateForWeekDay(
                      monthDate.getFullYear(),
                      monthDate.getMonth(),
                      weekNumber,
                      day
                    );

                  return {
                    day,
                    materia:
                      materia.nome,
                    materiaId:
                      materia.id,
                    topico:
                      topic.nome,
                    topicoId:
                      topic.id,
                    descricao:
                      topic.descricao ||
                      '',
                    key:
                      `${materia.id}::${topic.id}`,
                    data:
                      date
                        ? `${date.getFullYear()}-${pad(
                            date.getMonth() + 1
                          )}-${pad(
                            date.getDate()
                          )}`
                        : null
                  };
                }
              );

            return {
              number:
                weekNumber,
              days:
                daysData
            };
          }
        );

      return {
        numero:
          monthIndex + 1,
        nome:
          formatMonth(
            monthDate
          ),
        ano:
          monthDate.getFullYear(),
        mes:
          monthDate.getMonth(),
        semanas
      };
    }
  );
}

function savePlan(plan) {
  localStorage.setItem(
    `${PLAN_STORAGE_KEY}_${getUserKey()}`,
    JSON.stringify(plan)
  );
}

function getCalendarActivities() {
  try {
    return JSON.parse(
      localStorage.getItem(
        `${CALENDAR_STORAGE_KEY}_${getUserKey()}`
      ) || '[]'
    );
  } catch {
    return [];
  }
}

function saveCalendarActivities(
  activities
) {
  localStorage.setItem(
    `${CALENDAR_STORAGE_KEY}_${getUserKey()}`,
    JSON.stringify(
      activities
    )
  );
}

function addPlanToCalendar(plan) {
  const existing =
    getCalendarActivities();

  const generated = [];

  plan.forEach(
    (month) => {
      month.semanas.forEach(
        (week) => {
          week.days.forEach(
            (day, index) => {
              if (!day.data) {
                return;
              }

              generated.push({
                id:
                  `plano-${month.numero}-${week.number}-${index}-${Date.now()}-${Math.random()}`,
                data:
                  day.data,
                horario:
                  '08:00',
                nome:
                  day.topico,
                materia:
                  day.materia,
                topicoId:
                  day.topicoId,
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

  const oldActivities =
    existing.filter(
      (item) =>
        item.origem !==
        'plano-automatico'
    );

  saveCalendarActivities([
    ...oldActivities,
    ...generated
  ]);
}

export default function PlanoAutomatico() {
  const navigate =
    useNavigate();

  const { addXP } =
    useGamification();

  const [months, setMonths] =
    useState(6);

  const [days, setDays] =
    useState(3);

  const [plan, setPlan] =
    useState(null);

  const [selected, setSelected] =
    useState(1);

  const [openWeeks, setOpenWeeks] =
    useState(
      new Set(['1-1'])
    );

  const [
    materiasData,
    setMateriasData
  ] = useState([]);

  const [
    carregandoConteudos,
    setCarregandoConteudos
  ] = useState(true);

  const [
    erroConteudos,
    setErroConteudos
  ] = useState('');

  const phases = [
    'Fundamentos',
    'Construção de conhecimento',
    'Aprofundamento',
    'Prática',
    'Revisão',
    'Simulados'
  ];

  /*
   * BUSCA OS CONTEÚDOS DIRETAMENTE DO BANCO
   */
  useEffect(() => {
    let ativo = true;

    async function carregarConteudos() {
      try {
        setCarregandoConteudos(true);
        setErroConteudos('');

        const resposta =
          await fetch(
            `${API_URL}/conteudos/publico`
          );

        const dados =
          await resposta
            .json()
            .catch(() => ({}));

        if (!resposta.ok) {
          throw new Error(
            dados.erro ||
              dados.mensagem ||
              'Não foi possível carregar os conteúdos.'
          );
        }

        const materias =
          Array.isArray(dados)
            ? dados
            : dados.materias || [];

        if (!ativo) {
          return;
        }

        const materiasValidas =
          materias
            .filter(
              (materia) =>
                Number(
                  materia.ativa
                ) === 1
            )
            .map(
              (materia) => ({
                ...materia,
                topicos:
                  (
                    materia.topicos ||
                    []
                  ).filter(
                    (topico) =>
                      Number(
                        topico.ativo
                      ) === 1
                  )
              })
            )
            .filter(
              (materia) =>
                materia.topicos.length > 0
            );

        setMateriasData(
          materiasValidas
        );

      } catch (error) {
        console.error(
          'Erro ao carregar conteúdos do plano:',
          error
        );

        if (ativo) {
          setErroConteudos(
            error.message ||
              'Não foi possível carregar os conteúdos.'
          );
        }
      } finally {
        if (ativo) {
          setCarregandoConteudos(
            false
          );
        }
      }
    }

    carregarConteudos();

    return () => {
      ativo = false;
    };
  }, []);

  const current =
    plan?.find(
      (m) =>
        m.numero === selected
    ) ||
    plan?.[0];

  /*
   * PROGRESSO AGORA USA OS IDs DOS TÓPICOS
   * DO BANCO.
   */
  const [estudados, setEstudados] =
    useState({});

  useEffect(() => {
    async function carregarProgresso() {
      const token =
        localStorage.getItem(
          'etecamp_token'
        );

      if (!token) {
        return;
      }

      try {
        const resposta =
          await fetch(
            `${API_URL}/conteudos/progresso`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const dados =
          await resposta
            .json()
            .catch(() => ({}));

        if (
          resposta.ok &&
          Array.isArray(
            dados.topicos
          )
        ) {
          const mapa = {};

          dados.topicos.forEach(
            (item) => {
              mapa[
                String(
                  item.topico_id
                )
              ] =
                Boolean(
                  item.estudado
                );
            }
          );

          setEstudados(mapa);
        }
      } catch (error) {
        console.error(
          'Erro ao carregar progresso do plano:',
          error
        );
      }
    }

    carregarProgresso();
  }, []);

  const progress =
    useMemo(() => {
      if (!plan) {
        return 0;
      }

      const topicIds = [
        ...new Set(
          plan.flatMap(
            (month) =>
              month.semanas.flatMap(
                (week) =>
                  week.days
                    .filter(
                      (day) =>
                        day.topicoId
                    )
                    .map(
                      (day) =>
                        String(
                          day.topicoId
                        )
                    )
              )
          )
        )
      ];

      if (!topicIds.length) {
        return 0;
      }

      const concluidos =
        topicIds.filter(
          (id) =>
            estudados[id]
        ).length;

      return Math.round(
        (concluidos /
          topicIds.length) *
          100
      );
    }, [
      plan,
      estudados
    ]);

  async function generate() {
    if (
      carregandoConteudos
    ) {
      return;
    }

    if (!materiasData.length) {
      setErroConteudos(
        'Não existem matérias e tópicos ativos suficientes para gerar o plano.'
      );
      return;
    }

    const newPlan =
      generatePlan(
        months,
        days,
        materiasData
      );

    if (!newPlan.length) {
      setErroConteudos(
        'Não foi possível gerar o plano com os conteúdos cadastrados.'
      );
      return;
    }

    setPlan(newPlan);

    setSelected(1);

    setOpenWeeks(
      new Set(['1-1'])
    );

    savePlan(newPlan);

    /*
     * SALVA O PLANO INTEIRO NO CALENDÁRIO
     */
    addPlanToCalendar(
      newPlan
    );

    addXP(
      20,
      'plano automático gerado'
    );
  }

  function addWeek(
    month,
    week
  ) {
    const existing =
      getCalendarActivities();

    const newActivities =
      [];

    week.days.forEach(
      (day, index) => {
        if (!day.data) {
          return;
        }

        newActivities.push({
          id:
            `semana-${month.numero}-${week.number}-${index}-${Date.now()}-${Math.random()}`,
          data:
            day.data,
          horario:
            '08:00',
          nome:
            day.topico,
          materia:
            day.materia,
          topicoId:
            day.topicoId,
          done:
            false,
          origem:
            'plano-automatico'
        });
      }
    );

    saveCalendarActivities([
      ...existing,
      ...newActivities
    ]);

    addXP(
      10,
      'semana adicionada ao calendário'
    );

    navigate(
      '/cronograma'
    );
  }

  const focoMateria =
    current
      ?.semanas[0]
      ?.days[0]
      ?.materia;

  const focoTopico =
    current
      ?.semanas[0]
      ?.days[0]
      ?.topico;

  const focoStyle =
    getSubjectStyle(
      focoMateria
    );

  return (
    <div className="tenna-auto-plan">
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
            O Tenna organiza os conteúdos
            cadastrados para o Vestibulinho
            em uma jornada de estudos.
            Você escolhe seu ritmo e recebe
            um caminho personalizado.
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

      {erroConteudos && (
        <div
          style={{
            marginBottom: '18px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#fff1f0',
            border:
              '1px solid #ffc9c5',
            color: '#b42318',
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          {erroConteudos}
        </div>
      )}

      <section className="tenna-auto-config">
        <div className="tenna-auto-config-head">
          <div>
            <span className="tenna-auto-step">
              01
            </span>

            <div>
              <h3>
                Monte seu plano
              </h3>

              <p>
                Escolha quanto tempo
                você tem e quantos dias
                consegue estudar.
              </p>
            </div>
          </div>

          {plan && (
            <span className="tenna-auto-ready">
              ✓ Plano criado
            </span>
          )}
        </div>

        <div className="tenna-auto-options">
          <div className="tenna-auto-option-group">
            <span className="tenna-auto-label">
              Tempo até a prova
            </span>

            <div className="tenna-auto-pills">
              {[12, 9, 6, 5, 4, 3, 2, 1].map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    className={
                      `tenna-auto-pill ${
                        months === m
                          ? 'selected'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setMonths(m)
                    }
                  >
                    <strong>
                      {m}
                    </strong>

                    <span>
                      {m === 1
                        ? 'mês'
                        : 'meses'}
                    </span>
                  </button>
                )
              )}
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

        <div className="tenna-auto-config-bottom">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              color: 'var(--muted)'
            }}
          >
            <Icon
              name="book"
              size={14}
              color="var(--accent-dark)"
            />

            {carregandoConteudos
              ? 'Carregando conteúdos cadastrados...'
              : `${materiasData.length} matéria(s) disponível(is) no banco.`}
          </span>

          <button
            className="mural-btn primary"
            onClick={
              generate
            }
            disabled={
              carregandoConteudos ||
              !materiasData.length
            }
          >
            {carregandoConteudos
              ? 'Carregando...'
              : 'Gerar meu plano'}
          </button>
        </div>
      </section>

      {plan && (
        <div className="tenna-auto-result">
          <section className="tenna-auto-next">
            <div
              className="tenna-auto-next-icon"
              style={{
                background:
                  focoStyle.bg,
                color:
                  focoStyle.color
              }}
            >
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
                      : 'meses'}{' '}
                    ·{' '}
                    {months *
                      4 *
                      days}{' '}
                    sessões
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
                  (month) => (
                    <button
                      key={
                        month.numero
                      }
                      className={
                        `tenna-auto-timeline-item ${
                          month.numero ===
                          selected
                            ? 'active'
                            : ''
                        }`
                      }
                      onClick={() =>
                        setSelected(
                          month.numero
                        )
                      }
                    >
                      <span className="tenna-auto-timeline-dot">
                        {month.numero}
                      </span>

                      <strong>
                        Mês {month.numero}
                      </strong>

                      <small>
                        {month.numero ===
                        1
                          ? 'Começo'
                          : month.numero ===
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
                    MÊS {current.numero}{' '}
                    ·{' '}
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
                      (total, week) =>
                        total +
                        week.days.length,
                      0
                    )}{' '}
                    dias de estudo organizados
                  </p>
                </div>
              </div>

              <div className="tenna-auto-month-count">
                <strong>
                  {
                    current.semanas.length
                  }
                </strong>

                <span>
                  semanas
                </span>
              </div>
            </div>

            <div className="tenna-auto-weeks">
              {current.semanas.map(
                (week) => {
                  const key =
                    `${current.numero}-${week.number}`;

                  const open =
                    openWeeks.has(
                      key
                    );

                  return (
                    <article
                      className={
                        `tenna-auto-week ${
                          open
                            ? 'open'
                            : ''
                        }`
                      }
                      key={key}
                    >
                      <button
                        className="tenna-auto-week-head"
                        onClick={() =>
                          setOpenWeeks(
                            (prev) => {
                              const next =
                                new Set(
                                  prev
                                );

                              if (
                                next.has(
                                  key
                                )
                              ) {
                                next.delete(
                                  key
                                );
                              } else {
                                next.add(
                                  key
                                );
                              }

                              return next;
                            }
                          )
                        }
                      >
                        <span className="tenna-auto-week-number">
                          {pad(
                            week.number
                          )}
                        </span>

                        <span className="tenna-auto-week-title">
                          <strong>
                            Semana{' '}
                            {week.number}
                          </strong>

                          <small>
                            {
                              week.days.length
                            }{' '}
                            dias de estudo
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
                            {week.days.map(
                              (
                                day,
                                index
                              ) => {
                                const dayStyle =
                                  getSubjectStyle(
                                    day.materia
                                  );

                                const estudado =
                                  Boolean(
                                    estudados[
                                      String(
                                        day.topicoId
                                      )
                                    ]
                                  );

                                return (
                                  <div
                                    className="tenna-auto-day"
                                    key={
                                      `${day.topicoId}-${index}`
                                    }
                                    style={
                                      estudado
                                        ? {
                                            opacity: 0.58
                                          }
                                        : undefined
                                    }
                                  >
                                    <div className="tenna-auto-day-name">
                                      {day.day
                                        .slice(
                                          0,
                                          3
                                        )
                                        .toUpperCase()}
                                    </div>

                                    <div
                                      className="tenna-auto-day-icon"
                                      style={{
                                        background:
                                          dayStyle.bg,
                                        color:
                                          dayStyle.color
                                      }}
                                    >
                                      <SubjectIcon
                                        materia={
                                          day.materia
                                        }
                                        size={
                                          16
                                        }
                                      />
                                    </div>

                                    <div className="tenna-auto-day-content">
                                      <strong>
                                        {day.materia}
                                      </strong>

                                      <span>
                                        {day.topico}
                                      </span>

                                      {day.descricao && (
                                        <small
                                          style={{
                                            display:
                                              'block',
                                            marginTop:
                                              '3px',
                                            color:
                                              'var(--muted)'
                                          }}
                                        >
                                          {
                                            day.descricao
                                          }
                                        </small>
                                      )}
                                    </div>

                                    {estudado && (
                                      <span
                                        style={{
                                          fontSize:
                                            '11px',
                                          fontWeight:
                                            700,
                                          color:
                                            dayStyle.color
                                        }}
                                      >
                                        ✓
                                      </span>
                                    )}
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
                                week
                              )
                            }
                          >
                            + Adicionar semana ao meu calendário
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

const cardStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '22px',
  boxShadow:
    '0 8px 28px rgba(21,72,125,0.07)'
};