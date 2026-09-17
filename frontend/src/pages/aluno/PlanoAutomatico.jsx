import '../../styles/aluno/PlanoAutomatico.css';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPICS_BANK } from './Conteudos.jsx';
import { useGamification } from "../../context/GamificationContext.jsx";
import { getSubjectStyle } from "../../utils/subjects.js";
import SubjectIcon from "../../components/cu.jsx";
import Icon from "../../components/Icon.jsx";

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

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

const SUBJECTS =
  Object.keys(TOPICS_BANK);

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

function getToken() {
  return (
    localStorage.getItem(
      'etecamp_token'
    ) ||
    localStorage.getItem('token') ||
    localStorage.getItem(
      'accessToken'
    ) ||
    ''
  );
}

function generatePlan(
  months,
  days
) {
  const daysList =
    DAYS_BY_COUNT[days] ||
    DAYS_BY_COUNT[3];

  let subjectIndex = 0;

  const positions =
    Object.fromEntries(
      SUBJECTS.map((s) => [
        s,
        0
      ])
    );

  const now =
    new Date();

  return Array.from(
    {
      length: months
    },
    (_, mi) => {

      const d =
        new Date(
          now.getFullYear(),
          now.getMonth() + mi,
          1
        );

      const semanas =
        Array.from(
          {
            length: 4
          },
          (_, wi) => ({
            number:
              wi + 1,

            days:
              daysList.map(
                (day) => {

                  const subject =
                    SUBJECTS[
                      subjectIndex++ %
                        SUBJECTS.length
                    ];

                  const pos =
                    positions[
                      subject
                    ]++;

                  const topics =
                    TOPICS_BANK[
                      subject
                    ];

                  const topico =
                    topics[
                      pos %
                        topics.length
                    ];

                  return {
                    day,
                    materia:
                      subject,
                    topico,
                    key:
                      `${subject}::${topico}`
                  };
                }
              )
          })
        );

      return {
        numero:
          mi + 1,

        nome:
          d.toLocaleDateString(
            'pt-BR',
            {
              month:
                'long',
              year:
                'numeric'
            }
          ),

        semanas
      };
    }
  );
}

function savePlan(plan) {
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

  const [addingWeek, setAddingWeek] =
    useState(null);

  const [syncingPlan, setSyncingPlan] =
    useState(false);

  const [syncError, setSyncError] =
    useState('');

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
    useMemo(() => {
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
                    w.days.map(
                      (d) =>
                        d.key
                    )
                )
            )
          )
        ];

        return keys.length
          ? Math.round(
              keys.filter(
                (k) =>
                  done[k]
              ).length /
                keys.length *
                100
            )
          : 0;

      } catch {
        return 0;
      }
    }, [plan]);

  function montarAtividadesDoPlano(p) {

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
      new Date(hoje);

    domingo.setDate(
      hoje.getDate() -
        hoje.getDay()
    );

    const atividades =
      [];

    p.forEach((month) => {

      month.semanas.forEach(
        (week) => {

          week.days.forEach(
            (day) => {

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
                    (month.numero - 1) +
                  7 *
                    (week.number - 1)
              );

              const dataFinal =
                day.data ||
                `${alvo.getFullYear()}-${pad(
                  alvo.getMonth() + 1
                )}-${pad(
                  alvo.getDate()
                )}`;

              atividades.push({
                data:
                  dataFinal,
                horario:
                  '08:00',
                nome:
                  day.topico,
                materia:
                  day.materia,
                topicoId:
                  day.topicoId ||
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
    });

    return atividades;
  }

  async function generate() {
    const p =
      generatePlan(
        months,
        days
      );

    setPlan(p);

    setSelected(1);

    setOpenWeeks(
      new Set(['1-1'])
    );

    savePlan(p);

    addXP(
      20,
      'plano automático gerado'
    );

    const usuarioId =
      Number(
        getUser().id ||
          getUser().usuarioId ||
          0
      );

    const token =
      getToken();

    if (!usuarioId) {
      return;
    }

    const atividades =
      montarAtividadesDoPlano(p);

    if (!atividades.length) {
      return;
    }

    try {

      setSyncingPlan(true);

      setSyncError('');

      const response =
        await fetch(
          `${API_URL}/cronograma/${usuarioId}/lote`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`
                  }
                : {})
            },

            body:
              JSON.stringify({
                atividades,

                substituirOrigem:
                  'plano-automatico'
              })
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
            'Não foi possível salvar o plano no cronograma.'
        );
      }

    } catch (erro) {

      console.error(
        'Erro ao salvar plano no cronograma:',
        erro
      );

      setSyncError(
        erro.message ||
        'O plano foi gerado, mas não foi possível salvá-lo no cronograma.'
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

    const token =
      getToken();

    if (!usuarioId) {
      return;
    }

    const atividades =
      [];

    week.days.forEach(
      (day, index) => {

        const data =
          day.data ||
          null;

        /*
         * Como o plano atual já trabalha
         * por dias da semana, calculamos
         * a próxima ocorrência daquela
         * data a partir do início da semana.
         */

        const hoje =
          new Date();

        const alvo =
          new Date(
            hoje
          );

        const nomesDias = [
          'Domingo',
          'Segunda',
          'Terça',
          'Quarta',
          'Quinta',
          'Sexta',
          'Sábado'
        ];

        const indiceDia =
          nomesDias.indexOf(
            day.day
          );

        const domingo =
          new Date(
            hoje
          );

        domingo.setDate(
          hoje.getDate() -
            hoje.getDay()
        );

        alvo.setTime(
          domingo.getTime()
        );

        alvo.setDate(
          domingo.getDate() +
            indiceDia +
            7 *
              (month.numero - 1) +
            7 *
              (week.number - 1)
        );

        const dataFinal =
          data ||
          `${alvo.getFullYear()}-${pad(
            alvo.getMonth() + 1
          )}-${pad(
            alvo.getDate()
          )}`;

        atividades.push({
          data:
            dataFinal,
          horario:
            '08:00',
          nome:
            day.topico,
          materia:
            day.materia,
          topicoId:
            day.topicoId ||
            null,
          done:
            false,
          origem:
            'plano-automatico'
        });
      }
    );

    try {
      setAddingWeek(
        `${month.numero}-${week.number}`
      );

      const response =
        await fetch(
          `${API_URL}/cronograma/${usuarioId}/lote`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`
                  }
                : {})
            },

            body:
              JSON.stringify({
                atividades,

                substituirOrigem:
                  null
              })
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
            'Não foi possível adicionar a semana ao calendário.'
        );
      }

      addXP(
        10,
        'semana adicionada ao calendário'
      );

      navigate(
        '/cronograma'
      );

    } catch (erro) {
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
            para o Vestibulinho em etapas.
            Você escolhe seu ritmo e recebe
            um caminho de estudo simples.
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

          <div>

            <span className="tenna-auto-step">
              01
            </span>

            <div>

              <h3>
                Monte seu plano
              </h3>

              <p>
                Escolha quanto tempo você tem
                e quantos dias consegue estudar.
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

          <span className="tenna-auto-config-note">

            <Icon
              name="book"
              size={14}
              color="var(--accent-dark)"
            />

            A base de conteúdos é a mesma
            da área <strong>Conteúdos</strong>.

          </span>

          <button
            className="mural-btn primary"
            onClick={generate}
            disabled={syncingPlan}
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
                      : 'meses'}
                    {' · '}
                    {months * 4 * days}
                    {' sessões'}

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
                        {m.numero === 1
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
                      (n, w) =>
                        n +
                        w.days.length,
                      0
                    )}
                    {' dias de estudo organizados'}
                  </p>

                </div>

              </div>

              <div className="tenna-auto-month-count">

                <strong>
                  {current.semanas.length}
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
                      key={key}
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
                            {w.days.length}
                            {' dias de estudo'}
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
                              (d, i) => {

                                const dStyle =
                                  getSubjectStyle(
                                    d.materia
                                  );

                                return (

                                  <div
                                    className="tenna-auto-day"
                                    key={i}
                                  >

                                    <div className="tenna-auto-day-name">
                                      {d.day
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
                                          dStyle.bg,
                                        color:
                                          dStyle.color
                                      }}
                                    >
                                      <SubjectIcon
                                        materia={
                                          d.materia
                                        }
                                        size={16}
                                      />
                                    </div>

                                    <div className="tenna-auto-day-content">

                                      <strong>
                                        {d.materia}
                                      </strong>

                                      <span>
                                        {d.topico}
                                      </span>

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
                            disabled={adding}
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