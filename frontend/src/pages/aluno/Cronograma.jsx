import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/aluno/Cronograma.css';
import { useGamification } from '../../context/GamificationContext.jsx';
import { getSubjectStyle } from '../../utils/subjects.js';
import SubjectIcon from '../../components/SubjectIcon.jsx';
import Icon from '../../components/Icon.jsx';
import { request } from '../../services/api.js';
import { eventosVisiveisDia, resumirDia, resumirMes } from '../../utils/calendarioResumo.js';

const STORAGE_KEY =
  'tenna_calendario_atividades';

const WEEK_DAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado'
];

const MATERIAS = [
  'Português',
  'Matemática',
  'História',
  'Geografia',
  'Ciências',
  'Simulado',
  'Prova Anterior',
  'Outro'
];

const POSTIT_MATERIA_STYLES = {
  'Português': { bg: '#BFE3FA', color: '#25658A' },
  'Língua Portuguesa': { bg: '#BFE3FA', color: '#25658A' },
  'Matemática': { bg: '#F7B8B4', color: '#9C3D39' },
  'História': { bg: '#D8B98A', color: '#704E2B' },
  'Geografia': { bg: '#BEE3B4', color: '#3F6F3A' },
  'Ciências': { bg: '#D6BEF0', color: '#644493' },
  'Ciências da Natureza': { bg: '#D6BEF0', color: '#644493' },
};

function getPostItMateriaStyle(materia = '') {
  const direct = POSTIT_MATERIA_STYLES[materia];
  if (direct) return direct;

  const normalized = String(materia).trim().toLowerCase();
  const found = Object.keys(POSTIT_MATERIA_STYLES).find(
    (key) => {
      const keyNormalized = key.toLowerCase();
      return (
        normalized.includes(keyNormalized) ||
        keyNormalized.includes(normalized)
      );
    }
  );

  return found
    ? POSTIT_MATERIA_STYLES[found]
    : { bg: '#EAF0F6', color: '#52616B' };
}

const pad = (n) =>
  String(n).padStart(2, '0');

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;

const todayKey = dateKey(new Date());

function getUsuario() {
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

function getUserId() {
  const usuario = getUsuario();

  return Number(
    usuario.id ||
      usuario.usuarioId ||
      0
  );
}

function getLegacyActivities() {
  try {
    const userId =
      getUserId();

    const raw =
      localStorage.getItem(
        `${STORAGE_KEY}_${userId || 'anonimo'}`
      );

    if (!raw) {
      return [];
    }

    const activities =
      JSON.parse(raw);

    return Array.isArray(
      activities
    )
      ? activities
      : [];
  } catch {
    return [];
  }
}

const emptyForm = {
  nome: '',
  materia: 'Matemática',
  data: todayKey,
  horario: '08:00'
};

export default function Cronograma() {
  const { addXP } =
    useGamification();

  const usuarioId =
    getUserId();

  const [activities, setActivities] =
    useState([]);

  const [datasImportantes, setDatasImportantes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [currentMonth, setCurrentMonth] =
    useState(
      () =>
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        )
    );

  const [selectedDate, setSelectedDate] =
    useState(todayKey);

  const [showCreate, setShowCreate] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [showDeletePlanConfirm, setShowDeletePlanConfirm] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  async function carregarCronograma() {
    if (!usuarioId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data =
        await request(
          `/cronograma/${usuarioId}`
        );

      const atividades =
        Array.isArray(
          data.atividades
        )
          ? data.atividades
          : [];

      /*
       * Migra atividades antigas do localStorage
       * somente se o banco ainda estiver vazio.
       */
      if (
        atividades.length === 0
      ) {
        const antigas =
          getLegacyActivities();

        const antigasValidas =
          antigas.filter(
            (atividade) =>
              atividade &&
              atividade.nome &&
              atividade.materia &&
              atividade.data &&
              atividade.horario
          );

        if (
          antigasValidas.length
        ) {
          const resposta =
            await request(
              `/cronograma/${usuarioId}/lote`,
              {
                method: 'POST',
                body: JSON.stringify({
                  atividades:
                    antigasValidas.map(
                      (atividade) => ({
                        nome:
                          atividade.nome,
                        materia:
                          atividade.materia,
                        data:
                          atividade.data,
                        horario:
                          atividade.horario ||
                          '08:00',
                        done:
                          Boolean(
                            atividade.done
                          ),
                        origem:
                          atividade.origem ||
                          null,
                        topicoId:
                          atividade.topicoId ||
                          null
                      })
                    )
                })
              }
            );

          setActivities(
            Array.isArray(
              resposta.atividades
            )
              ? resposta.atividades
              : []
          );

          return;
        }
      }

      setActivities(
        atividades
      );
    } catch (erro) {
      console.error(
        'Erro ao carregar cronograma:',
        erro
      );

      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  async function carregarDatasImportantes() {
    try {
      const data = await request('/calendario/datas-importantes');

      setDatasImportantes(
        Array.isArray(data?.datas)
          ? data.datas
          : []
      );
    } catch (erro) {
      console.error(
        'Erro ao carregar datas importantes:',
        erro
      );

      setDatasImportantes([]);
    }
  }

  useEffect(() => {
    carregarCronograma();
    carregarDatasImportantes();
  }, [usuarioId]);

  const monthTitle =
    currentMonth.toLocaleDateString(
      'pt-BR',
      {
        month: 'long',
        year: 'numeric'
      }
    );

  const monthLabel =
    monthTitle.charAt(0).toUpperCase() +
    monthTitle.slice(1);

  const calendarDays =
    useMemo(() => {
      const first =
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1
        );

      const start =
        new Date(first);

      start.setDate(
        1 - first.getDay()
      );

      return Array.from(
        { length: 42 },
        (_, i) => {
          const d =
            new Date(start);

          d.setDate(
            start.getDate() + i
          );

          return d;
        }
      );
    }, [currentMonth]);

  const selectedActivities =
    activities
      .filter(
        (a) =>
          a.data === selectedDate
      )
      .sort((a, b) =>
        (
          a.horario || ''
        ).localeCompare(
          b.horario || ''
        )
      );

  const selectedImportantDates =
    datasImportantes.filter(
      (item) => item.data === selectedDate
    );

  const monthPrefix =
    `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}`;

  const resumoMes = resumirMes(activities, monthPrefix);
  const resumoDia = resumirDia(selectedActivities);

  function changeMonth(delta) {
    const proximoMes = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    // Mantém o painel do dia sincronizado com o mês visualizado.
    const diaAnterior = Number(selectedDate.slice(-2)) || 1;
    const ultimoDia = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 0).getDate();
    const diaSelecionado = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), Math.min(diaAnterior, ultimoDia));
    setCurrentMonth(proximoMes);
    setSelectedDate(dateKey(diaSelecionado));
  }
  function goToday() {
    const today =
      new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(
      dateKey(today)
    );
  }

  function openCreate(
    date = selectedDate
  ) {
    setEditing(null);

    setForm({
      ...emptyForm,
      data: date
    });

    setShowCreate(true);
  }

  function openEdit(activity) {
    setEditing(activity);

    setForm({
      nome:
        activity.nome || '',
      materia:
        activity.materia ||
        'Matemática',
      data:
        activity.data ||
        todayKey,
      horario:
        activity.horario ||
        '08:00'
    });

    setShowCreate(true);
  }

  async function saveActivity(e) {
    e.preventDefault();

    if (
      !form.nome.trim() ||
      !form.data ||
      !form.horario
    ) {
      return;
    }

    if (!usuarioId) {
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        const data =
          await request(
            `/cronograma/${usuarioId}/${editing.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                nome:
                  form.nome.trim(),
                materia:
                  form.materia,
                data:
                  form.data,
                horario:
                  form.horario
              })
            }
          );

        if (
          data.atividade
        ) {
          setActivities(
            (prev) =>
              prev.map(
                (a) =>
                  a.id ===
                  editing.id
                    ? data.atividade
                    : a
              )
          );
        } else {
          await carregarCronograma();
        }
      } else {
        const data =
          await request(
            `/cronograma/${usuarioId}`,
            {
              method: 'POST',
              body: JSON.stringify({
                nome:
                  form.nome.trim(),
                materia:
                  form.materia,
                data:
                  form.data,
                horario:
                  form.horario,
                done: false
              })
            }
          );

        if (
          data.atividade
        ) {
          setActivities(
            (prev) => [
              ...prev,
              data.atividade
            ]
          );
        } else {
          await carregarCronograma();
        }

        addXP(
          5,
          'atividade adicionada ao calendário'
        );
      }

      setSelectedDate(
        form.data
      );

      const d =
        new Date(
          `${form.data}T12:00:00`
        );

      setCurrentMonth(
        new Date(
          d.getFullYear(),
          d.getMonth(),
          1
        )
      );

      setShowCreate(false);
      setEditing(null);
    } catch (erro) {
      console.error(
        'Erro ao salvar atividade:',
        erro
      );

      window.alert(
        erro.message ||
          'Não foi possível salvar a atividade.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteActivity() {
    if (
      !editing ||
      !usuarioId
    ) {
      return;
    }

    try {
      setSaving(true);

      await request(
        `/cronograma/${usuarioId}/${editing.id}`,
        {
          method: 'DELETE'
        }
      );

      setActivities(
        (prev) =>
          prev.filter(
            (a) =>
              a.id !==
              editing.id
          )
      );

      setShowCreate(false);
      setEditing(null);
    } catch (erro) {
      console.error(
        'Erro ao excluir atividade:',
        erro
      );

      window.alert(
        erro.message ||
          'Não foi possível excluir a atividade.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(activity) {
    if (
      !usuarioId ||
      !activity?.id
    ) {
      return;
    }

    const novoStatus =
      !activity.done;

    setActivities(
      (prev) =>
        prev.map(
          (a) =>
            a.id ===
            activity.id
              ? {
                  ...a,
                  done:
                    novoStatus
                }
              : a
        )
    );

    try {
      const data =
        await request(
          `/cronograma/${usuarioId}/${activity.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              done:
                novoStatus
            })
          }
        );

      if (
        data.atividade
      ) {
        setActivities(
          (prev) =>
            prev.map(
              (a) =>
                a.id ===
                activity.id
                  ? data.atividade
                  : a
            )
        );
      }
    } catch (erro) {
      console.error(
        'Erro ao atualizar conclusão:',
        erro
      );

      setActivities(
        (prev) =>
          prev.map(
            (a) =>
              a.id ===
              activity.id
                ? {
                    ...a,
                    done:
                      activity.done
                  }
                : a
          )
      );
    }
  }

  function requestDeleteAutomaticPlan() {
    const hasAutomaticPlan =
      activities.some(
        (activity) =>
          activity.origem ===
          'plano-automatico'
      );

    if (!hasAutomaticPlan) {
      return;
    }

    setShowDeletePlanConfirm(
      true
    );
  }

  async function confirmDeleteAutomaticPlan() {
    if (!usuarioId) {
      return;
    }

    try {
      setSaving(true);

      await request(
        `/cronograma/${usuarioId}/origem/plano-automatico`,
        {
          method: 'DELETE'
        }
      );

      setActivities(
        (prev) =>
          prev.filter(
            (activity) =>
              activity.origem !==
              'plano-automatico'
          )
      );

      setShowDeletePlanConfirm(
        false
      );
    } catch (erro) {
      console.error(
        'Erro ao excluir plano automático:',
        erro
      );

      window.alert(
        erro.message ||
          'Não foi possível apagar o plano automático.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="calendar-page">

        <section className="tenna-auto-intro">

          <div className="tenna-auto-intro-copy">

            <span className="tenna-auto-kicker">
              MINHA ROTINA
            </span>

            <h2>
              Seu{' '}
              <span>
                calendário de estudos
              </span>
            </h2>

            <p>
              Carregando seu cronograma...
            </p>

          </div>

        </section>

      </div>
    );
  }

  return (
    <div className="calendar-page">

      <section className="tenna-auto-intro">

        <div className="tenna-auto-intro-copy">

          <span className="tenna-auto-kicker">
            MINHA ROTINA
          </span>

          <h2>
            Organize seu{' '}
            <span>
              calendário de estudos
            </span>
          </h2>

          <p>
            Organize suas atividades, acompanhe seu ritmo e mantenha seus estudos em dia.
          </p>

        </div>

        <div className="calendar-hero-actions">

          <Link
            className="calendar-hero-link"
            to="/plano-automatico"
            title="Abrir plano automático"
          >
            <Icon
              name="calendar"
              size={21}
              color="#fff"
            />
            <span>
              <small>
                Sua rotina
              </small>
              <strong>
                Ajustar plano
              </strong>
            </span>
          </Link>

          <button
            className="calendar-hero-new"
            onClick={() => openCreate()}
          >
            + Nova atividade
          </button>

        </div>

      </section>

      <div className="calendar-layout">

        <section className="calendar-card">

          <div className="calendar-toolbar">

            <div className="calendar-toolbar-left">
              <div className="calendar-month-nav">

                <button
                  onClick={() =>
                    changeMonth(-1)
                  }
                  aria-label="Mês anterior"
                >
                  ‹
                </button>

                <h2>
                  {monthLabel}
                </h2>

                <button
                  onClick={() =>
                    changeMonth(1)
                  }
                  aria-label="Próximo mês"
                >
                  ›
                </button>

              </div>

              <div className="calendar-toolbar-stats">
                <span>
                  <strong>{resumoMes.atividades}</strong> atividades
                </span>
                <span>
                  <strong>{resumoMes.concluidas}</strong> concluídas
                </span>
                <span>
                  <strong>{resumoMes.diasPlanejados}</strong> dias planejados
                </span>
              </div>
            </div>

            <div className="calendar-toolbar-actions">
              <button
                className="calendar-today"
                onClick={goToday}
              >
                Hoje
              </button>

              <button
                className="calendar-delete-plan calendar-delete-compact"
                onClick={requestDeleteAutomaticPlan}
                disabled={
                  saving ||
                  !activities.some(
                    (activity) =>
                      activity.origem ===
                      'plano-automatico'
                  )
                }
              >
                Apagar plano
              </button>
            </div>

          </div>

          <p className="calendar-mobile-help">Toque em uma data para ver suas atividades abaixo.</p>

          <div className="calendar-weekdays">

            {WEEK_DAYS.map(
              (day) => (
                <span
                  key={day}
                >
                  {day.slice(0, 3)}
                </span>
              )
            )}

          </div>

          <div className="calendar-grid">

            {calendarDays.map(
              (day) => {

                const key =
                  dateKey(day);

                const dayActivities =
                  activities.filter(
                    (a) =>
                      a.data ===
                      key
                  );

                const dayImportantDates =
                  datasImportantes.filter(
                    (item) =>
                      item.data ===
                      key
                  );

                const eventosDia = eventosVisiveisDia(dayActivities, dayImportantDates, 2);

                const inMonth =
                  day.getMonth() ===
                  currentMonth.getMonth();

                const selected =
                  key ===
                  selectedDate;

                const isToday =
                  key ===
                  todayKey;

                return (

                  <button
                    key={key}
                    className={
                      `calendar-day ${
                        !inMonth
                          ? 'outside'
                          : ''
                      } ${
                        selected
                          ? 'selected'
                          : ''
                      } ${
                        isToday
                          ? 'today'
                          : ''
                      }`
                    }
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${day.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}: ${eventosDia.total} ${eventosDia.total === 1 ? 'evento' : 'eventos'}`}
                    onClick={() => {
                      setSelectedDate(key);
                      if (!inMonth) {
                        setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                      }
                    }}
                  >

                    <span className="calendar-day-number">
                      {day.getDate()}
                    </span>

                    {eventosDia.visiveis.map(({ tipo, item }) => {
                      if (tipo === 'importante') {
                        return (
                          <span
                            key={`important-${item.id}`}
                            className="calendar-event calendar-important-event"
                            title={item.titulo}
                          >
                            <span className="calendar-event-icon" aria-hidden="true">📌</span>
                            <span className="calendar-event-text">{item.titulo}</span>
                          </span>
                        );
                      }

                      const cor = getPostItMateriaStyle(item.materia);
                      return (
                        <span
                          key={`activity-${item.id}`}
                          className={`calendar-event ${item.done ? 'done' : ''}`}
                          title={`${item.horario || ''} · ${item.nome}`}
                          style={{
                            background: cor.bg,
                            borderLeftColor: cor.color,
                            color: cor.color,
                          }}
                        >
                          <span className="calendar-event-icon" aria-hidden="true">
                            <SubjectIcon materia={item.materia} size={11} />
                          </span>
                          <span className="calendar-event-text">{item.nome}</span>
                        </span>
                      );
                    })}
                    {eventosDia.restantes > 0 && (
                      <span className="calendar-more">+{eventosDia.restantes} mais</span>
                    )}

                  </button>

                );
              }
            )}

          </div>

        </section>

        <aside className="calendar-sidebar-card">

          <div className="calendar-selected-head">

            <div>

              <span>
                ATIVIDADES DO DIA
              </span>

              <h2>
                {new Date(
                  `${selectedDate}T12:00:00`
                ).toLocaleDateString(
                  'pt-BR',
                  {
                    weekday:
                      'long',
                    day:
                      'numeric',
                    month:
                      'long'
                  }
                )}
              </h2>

            </div>

            <button
              type="button"
              aria-label="Adicionar atividade neste dia"
              title="Adicionar atividade neste dia"
              className="calendar-add-small"
              onClick={() =>
                openCreate()
              }
            >
              +
            </button>

          </div>

          {selectedImportantDates.length > 0 && (
            <div className="calendar-important-list">
              <span className="calendar-important-list-label">
                DATAS IMPORTANTES
              </span>

              {selectedImportantDates.map((item) => (
                <article
                  className="calendar-important-card"
                  key={item.id}
                >
                  <span className="calendar-important-pin">📌</span>
                  <div>
                    <strong>{item.titulo}</strong>
                    {item.tipo && <span>{item.tipo}</span>}
                    {item.descricao && <p>{item.descricao}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {resumoDia.total > 0 && (
            <div className="calendar-day-progress" aria-label={`${resumoDia.concluidas} de ${resumoDia.total} atividades concluídas`}>
              <div className="calendar-day-progress-text">
                <strong>Progresso do dia</strong>
                <span>{resumoDia.concluidas} de {resumoDia.total} concluídas</span>
              </div>
              <div className="calendar-day-progress-track" role="progressbar" aria-valuenow={resumoDia.concluidas} aria-valuemin={0} aria-valuemax={resumoDia.total}>
                <span style={{ width: `${Math.round((resumoDia.concluidas / resumoDia.total) * 100)}%` }} />
              </div>
            </div>
          )}

          <div className="calendar-task-list">

            {selectedActivities.length ===
            0 ? (

              <div className="calendar-empty-day">

                <span
                  style={{
                    color:
                      'var(--muted)',
                    display:
                      'flex',
                    justifyContent:
                      'center'
                  }}
                >
                  <Icon
                    name="calendar"
                    size={30}
                  />
                </span>

                <strong>
                  Nada planejado ainda
                </strong>

                <p>
                  Adicione uma atividade
                  para organizar este dia.
                </p>

                <button
                  onClick={() =>
                    openCreate()
                  }
                >
                  Adicionar atividade
                </button>

              </div>

            ) : (

              selectedActivities.map(
                (activity) => {

                  const style =
                    getSubjectStyle(
                      activity.materia
                    );

                  return (

                    <article
                      className={
                        `calendar-task ${
                          activity.done
                            ? 'done'
                            : ''
                        }`
                      }
                      key={activity.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Editar atividade ${activity.nome}`}
                      onClick={() => openEdit(activity)}
                      onKeyDown={(evento) => {
                        if (evento.target !== evento.currentTarget) return;
                        if (evento.key === 'Enter' || evento.key === ' ') {
                          evento.preventDefault();
                          openEdit(activity);
                        }
                      }}
                      style={{
                        background: getPostItMateriaStyle(activity.materia).bg,
                        borderColor: getPostItMateriaStyle(activity.materia).color
                      }}
                    >

                      <button
                        className="calendar-check"
                        type="button"
                        aria-label={activity.done ? `Marcar ${activity.nome} como pendente` : `Concluir ${activity.nome}`}
                        aria-pressed={Boolean(activity.done)}
                        onClick={(e) => {
                          e.stopPropagation();

                          toggleDone(
                            activity
                          );
                        }}
                      >
                        {activity.done
                          ? '✓'
                          : ''}
                      </button>

                      <span
                        className="calendar-task-subject-icon"
                        style={{
                          background:
                            getPostItMateriaStyle(activity.materia).bg,
                          color:
                            getPostItMateriaStyle(activity.materia).color
                        }}
                      >
                        <SubjectIcon
                          materia={
                            activity.materia
                          }
                          size={15}
                        />
                      </span>

                      <div className="calendar-task-info">

                        <span>
                          {activity.horario}
                          {' · '}
                          {activity.materia}
                        </span>

                        <strong>
                          {activity.nome}
                        </strong>

                      </div>

                      <span className="calendar-task-arrow">
                        ›
                      </span>

                    </article>

                  );
                }
              )

            )}

          </div>

          <button
            className="calendar-full-add"
            onClick={() =>
              openCreate()
            }
          >
            + Adicionar atividade neste dia
          </button>

        </aside>

      </div>

      {showCreate && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget &&
              !saving
            ) {
              setShowCreate(false);
              setEditing(null);
            }
          }}
        >

          <form
            className="modal-card calendar-modal"
            onSubmit={saveActivity}
          >

            <div className="modal-header">

              <h2>
                {editing
                  ? 'Editar atividade'
                  : 'Nova atividade'}
              </h2>

              <p>
                Defina quando e o que
                você pretende estudar.
              </p>

            </div>

            <div className="modal-input-group">

              <label>
                Atividade
              </label>

              <input
                autoFocus
                value={form.nome}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nome:
                      e.target.value
                  })
                }
                placeholder="Ex.: Equação do 2º grau"
                disabled={saving}
              />

            </div>

            <div className="modal-two-col">

              <div className="modal-input-group">

                <label>
                  Matéria
                </label>

                <select
                  value={form.materia}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      materia:
                        e.target.value
                    })
                  }
                  disabled={saving}
                >

                  {MATERIAS.map(
                    (m) => (
                      <option
                        key={m}
                        value={m}
                      >
                        {m}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="modal-input-group">

                <label>
                  Data
                </label>

                <input
                  type="date"
                  value={form.data}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      data:
                        e.target.value
                    })
                  }
                  disabled={saving}
                />

              </div>

            </div>

            <div className="modal-input-group">

              <label>
                Horário
              </label>

              <input
                type="time"
                value={form.horario}
                onChange={(e) =>
                  setForm({
                    ...form,
                    horario:
                      e.target.value
                  })
                }
                disabled={saving}
              />

            </div>

            <div className="modal-actions">

              {editing && (

                <button
                  type="button"
                  className="modal-delete"
                  onClick={
                    deleteActivity
                  }
                  disabled={saving}
                >
                  Excluir
                </button>

              )}

              <button
                type="button"
                className="mural-btn secondary"
                onClick={() => {
                  if (
                    !saving
                  ) {
                    setShowCreate(
                      false
                    );
                    setEditing(
                      null
                    );
                  }
                }}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className="mural-btn primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Salvando...'
                  : editing
                    ? 'Salvar alterações'
                    : 'Adicionar'}
              </button>

            </div>

          </form>

        </div>

      )}

      {showDeletePlanConfirm && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
                e.currentTarget &&
              !saving
            ) {
              setShowDeletePlanConfirm(
                false
              );
            }
          }}
        >

          <div className="modal-card calendar-delete-modal">

            <div className="modal-header">

              <div className="calendar-delete-icon">

                <Icon
                  name="calendar"
                  size={26}
                />

              </div>

              <h2>
                Apagar plano automático?
              </h2>

              <p>
                Todas as atividades geradas
                pelo plano automático serão
                removidas do seu calendário.
                Suas atividades adicionadas
                manualmente continuarão salvas.
              </p>

            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="mural-btn secondary"
                onClick={() =>
                  setShowDeletePlanConfirm(
                    false
                  )
                }
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="calendar-confirm-delete"
                onClick={
                  confirmDeleteAutomaticPlan
                }
                disabled={saving}
              >
                {saving
                  ? 'Apagando...'
                  : 'Sim, apagar plano'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}