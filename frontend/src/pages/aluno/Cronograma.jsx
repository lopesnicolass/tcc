import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import '../../styles/aluno/Cronograma.css';
import Icon from '../../components/Icon.jsx';
import { request } from '../../services/api.js';

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

// Cores mais vivas para os marcadores, sem alterar a paleta dos conteúdos.
const CALENDAR_DOT_COLORS = {
  'Português': '#1595E6',
  'Língua Portuguesa': '#1595E6',
  'Matemática': '#F05260',
  'História': '#CF8731',
  'Geografia': '#48AF58',
  'Ciências': '#9960D9',
  'Ciências da Natureza': '#9960D9',
  'Simulado': '#1479D4',
  'Prova Anterior': '#64748B',
  'Outro': '#64748B',
};

function getCalendarDotColor(materia) {
  if (CALENDAR_DOT_COLORS[materia]) return CALENDAR_DOT_COLORS[materia];
  const normalized = String(materia || '').trim().toLowerCase();
  const found = Object.keys(CALENDAR_DOT_COLORS).find((key) =>
    normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)
  );
  return found ? CALENDAR_DOT_COLORS[found] : '#64748B';
}

const pad = (n) =>
  String(n).padStart(2, '0');

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;

const getTodayKey = () => dateKey(new Date());

// Compara data e hora no fuso local do navegador (não em UTC).
function isPastDate(data, now = new Date()) {
  return data < dateKey(now);
}

function suggestedTimeForDay(data, now = new Date()) {
  if (isPastDate(data, now)) return null;
  if (data !== dateKey(now)) return '08:00';

  // O horário inicial sempre deve estar adiante do relógio atual.
  const next = new Date(now.getTime() + 60_000);
  next.setSeconds(0, 0);
  return dateKey(next) === data
    ? `${pad(next.getHours())}:${pad(next.getMinutes())}`
    : null;
}

function canScheduleOnDate(data, now = new Date()) {
  return Boolean(suggestedTimeForDay(data, now));
}

// Sugestões práticas: três momentos do dia em datas futuras ou os próximos
// horários disponíveis (em intervalos de 15 minutos) quando for hoje.
function quickTimesForDate(data, now = new Date()) {
  if (isPastDate(data, now)) return [];
  if (data !== dateKey(now)) return ['08:00', '14:00', '19:00'];

  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(Math.ceil((next.getMinutes() + 1) / 15) * 15);

  return [0, 30, 60]
    .map((delta) => new Date(next.getTime() + delta * 60_000))
    .filter((time) => dateKey(time) === data)
    .map((time) => `${pad(time.getHours())}:${pad(time.getMinutes())}`);
}

function isPastDateTime(data, horario, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) return false;
  const dateTime = new Date(`${data}T${horario}:00`);
  return Number.isNaN(dateTime.getTime()) || dateTime < now;
}

function hasUnchangedSchedule(editing, form) {
  return Boolean(editing && editing.data === form.data && editing.horario === form.horario);
}

// Sem menus flutuantes: as duas partes podem ser digitadas ou ajustadas pelas setas.
function TimePartInput({ label, value, max, disabled, onChange }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  function commit(raw = draft) {
    if (!raw) {
      setDraft(value);
      return;
    }
    const number = Math.min(max, Math.max(0, Number(raw)));
    const formatted = pad(number);
    setDraft(formatted);
    onChange(formatted);
  }

  function step(amount) {
    const next = pad((Number(value) + amount + max + 1) % (max + 1));
    setDraft(next);
    onChange(next);
  }

  return (
    <div className="tenna-time-part">
      <span className="tenna-time-part-label">{label}</span>
      <div className="tenna-time-part-entry">
        <input
          className="tenna-time-part-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          aria-label={label}
          autoComplete="off"
          value={draft}
          disabled={disabled}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, '').slice(0, 2);
            setDraft(next);
            if (next.length === 2 && Number(next) <= max) onChange(next);
          }}
          onBlur={() => commit()}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              step(event.key === 'ArrowUp' ? 1 : -1);
            } else if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        <div className="tenna-time-step-buttons">
          <button type="button" className="tenna-time-step" disabled={disabled}
            aria-label={`Aumentar ${label.toLowerCase()}`} onClick={() => step(1)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
          </button>
          <button type="button" className="tenna-time-step" disabled={disabled}
            aria-label={`Diminuir ${label.toLowerCase()}`} onClick={() => step(-1)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

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
  data: getTodayKey(),
  horario: '08:00'
};

export default function Cronograma() {

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
    useState(getTodayKey);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const [showCreate, setShowCreate] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [showDeletePlanConfirm, setShowDeletePlanConfirm] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);
  const [scheduleError, setScheduleError] = useState('');
  const validFormTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(form.horario);
  const scheduleIsInPast = validFormTime &&
    !hasUnchangedSchedule(editing, form) &&
    isPastDateTime(form.data, form.horario, now);
  const selectedDayAllowsCreation = canScheduleOnDate(selectedDate, now);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  function updateTimePart(part, value) {
    setScheduleError('');
    setForm((current) => {
      const [hour, minute] = (current.horario || '08:00').split(':');
      return { ...current, horario: part === 'hours' ? `${value}:${minute}` : `${hour}:${value}` };
    });
  }

  const [pickerMonth, setPickerMonth] = useState(() => new Date());

  const pickerDays = useMemo(() => {
    const first = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [pickerMonth]);

  function openPickerForDate(value) {
    const d = new Date(`${value || getTodayKey()}T12:00:00`);
    setPickerMonth(Number.isNaN(d.getTime()) ? new Date() : new Date(d.getFullYear(), d.getMonth(), 1));
    setDatePickerOpen((previous) => !previous);
    setSubjectPickerOpen(false);
  }


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

  const carregarCronogramaNoEfeito = useEffectEvent(() => carregarCronograma());

  useEffect(() => {
    const iniciar = setTimeout(() => {
      void carregarCronogramaNoEfeito();
      void carregarDatasImportantes();
    }, 0);
    return () => clearTimeout(iniciar);
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
  const selectedDateObject = new Date(`${selectedDate}T12:00:00`);


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

  function openCreate(date = selectedDate) {
    const currentNow = new Date();
    const nextTime = suggestedTimeForDay(date, currentNow);
    if (!nextTime) return;

    setNow(currentNow);
    setEditing(null);
    setScheduleError('');
    setForm({ ...emptyForm, data: date, horario: nextTime });
    setSubjectPickerOpen(false);
    setDatePickerOpen(false);
    setShowCreate(true);
  }

  function changeFormDate(date) {
    const currentNow = new Date();
    if (!canScheduleOnDate(date, currentNow) && date !== editing?.data) return;

    setNow(currentNow);
    setScheduleError('');
    setForm((previous) => {
      if (previous.data === date) return previous;
      const horario = isPastDateTime(date, previous.horario, currentNow)
        ? suggestedTimeForDay(date, currentNow) || previous.horario
        : previous.horario;
      return { ...previous, data: date, horario };
    });
    setDatePickerOpen(false);
  }

  function openEdit(activity) {
    setScheduleError('');
    setEditing(activity);

    setForm({
      nome:
        activity.nome || '',
      materia:
        activity.materia ||
        'Matemática',
      data:
        activity.data ||
        getTodayKey(),
      horario:
        activity.horario ||
        '08:00'
    });

    setSubjectPickerOpen(false);
    setDatePickerOpen(false);
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

    // Validação final com a hora atual, inclusive se a janela ficou aberta.
    if (!hasUnchangedSchedule(editing, form) &&
        isPastDateTime(form.data, form.horario, new Date())) {
      setScheduleError('Não é possível agendar atividades em datas ou horários que já passaram.');
      return;
    }

    setScheduleError('');
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

        // Criar atividade não rende XP até existir evento verificado no servidor.
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

        <header className="calendar-simple-header">
          <div>
            <span className="calendar-simple-eyebrow">MINHA ROTINA</span>
            <h1>Meu calendário</h1>
            <p>Carregando suas atividades...</p>
          </div>
        </header>

      </div>
    );
  }

  return (
    <div className="calendar-page">

      <section className="tenna-auto-intro calendar-restored-banner">
        <div className="tenna-auto-intro-copy">
          <span className="tenna-auto-kicker">MINHA ROTINA</span>
          <h2>Seu calendário, <span>seu ritmo.</span></h2>
          <p>Visualize seus compromissos, celebre cada tarefa concluída e siga firme até o Vestibulinho.</p>
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

          <p className="calendar-mobile-help">Selecione um dia para ver ou editar suas atividades.</p>

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

                const materiasDoDia = [...new Set(dayActivities.map((activity) => activity.materia || 'Outro'))];
                const quantidadeEventos = dayActivities.length + dayImportantDates.length;
                const temDatasImportantes = dayImportantDates.length > 0;

                const inMonth =
                  day.getMonth() ===
                  currentMonth.getMonth();

                const selected =
                  key ===
                  selectedDate;

                const isToday =
                  key === dateKey(now);
                const hasEvents = quantidadeEventos > 0;
                const allDone = dayActivities.length > 0 && dayActivities.every((activity) => activity.done);

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
                      } ${hasEvents ? 'has-events' : ''} ${allDone ? 'all-done' : ''}`
                    }
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${day.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}: ${quantidadeEventos} ${quantidadeEventos === 1 ? 'evento' : 'eventos'}`}
                    onClick={() => {
                      setSelectedDate(key);
                      if (!inMonth) {
                        setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                      }
                    }}
                  >

                    <span className="calendar-day-topline">
                      <span className="calendar-day-number">{day.getDate()}</span>
                      {isToday && <span className="calendar-today-label">HOJE</span>}

                    </span>

                    {hasEvents && (
                      <span className="calendar-subject-dots" aria-hidden="true">
                        {materiasDoDia.map((materia) => (
                          <span
                            key={materia}
                            className="calendar-subject-dot"
                            style={{ backgroundColor: getCalendarDotColor(materia), borderColor: getCalendarDotColor(materia) }}
                            title={materia}
                          />
                        ))}
                        {temDatasImportantes && (
                          <span className="calendar-subject-dot calendar-important-dot" title="Data importante" />
                        )}
                      </span>
                    )}

                  </button>

                );
              }
            )}

          </div>

        </section>

        <div className="calendar-bottom-cards">
        <aside className="calendar-sidebar-card">

          <div className="calendar-selected-head">
            <div className="calendar-selected-copy">
              <span className="calendar-selected-date">
                {selectedDateObject.toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </span>
              <h2>Atividades do dia</h2>
            </div>
            <button
              type="button"
              aria-label="Adicionar atividade neste dia"
              className="calendar-add-small"
              disabled={!selectedDayAllowsCreation || saving}
              title={selectedDayAllowsCreation
                ? 'Adicionar atividade neste dia'
                : 'Não é possível agendar atividades em datas ou horários que já passaram'}
              onClick={() => openCreate()}
            >
              <Icon name="plus" size={19} />
            </button>
          </div>

          {!selectedDayAllowsCreation && (
            <p className="calendar-past-day-hint">
              Não é possível adicionar atividades em datas ou horários que já passaram.
            </p>
          )}

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

          <div className="calendar-task-list">

            {selectedActivities.length ===
            0 ? (

              <div className="calendar-empty-day">
                <span className="calendar-empty-day-icon" aria-hidden="true"><Icon name="calendar" size={23} /></span>
                <strong>Nenhuma atividade neste dia</strong>
                <p>{selectedDayAllowsCreation
                  ? 'Use o botão + para planejar seus estudos.'
                  : 'Esta data já passou. Você ainda pode consultar suas atividades.'}</p>
              </div>

            ) : (

              selectedActivities.map(
                (activity) => {

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
                        '--calendar-subject-bg': getPostItMateriaStyle(activity.materia).bg,
                        '--calendar-subject-color': getPostItMateriaStyle(activity.materia).color
                      }}
                    >

                      <span
                        className="calendar-task-subject-dot"
                        style={{ backgroundColor: getCalendarDotColor(activity.materia) }}
                        aria-hidden="true"
                      />

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


                    </article>

                  );
                }
              )

            )}

          </div>

        </aside>

        </div>

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

          <form className="modal-card calendar-modal tenna-activity-modal" onSubmit={saveActivity}>
            <div className="tenna-activity-header">
              <div>
                <h2>{editing ? 'Editar atividade' : 'Adicionar atividade'}</h2>
              </div>
              <button type="button" className="tenna-activity-close" aria-label="Fechar" disabled={saving}
                onClick={() => { setShowCreate(false); setEditing(null); }}>×</button>
            </div>

            <div className="tenna-activity-body">
              <label className="tenna-activity-field">
                <span>Nome da atividade</span>
                <input autoFocus required maxLength={160} value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex.: Revisar equações do 2º grau" disabled={saving} />
              </label>

              <div className="tenna-activity-two-col">
                <div className="tenna-activity-field tenna-picker-wrap">
                  <label id="tenna-subject-label">Matéria</label>
                  <button type="button" className="tenna-activity-control tenna-subject-trigger"
                    aria-labelledby="tenna-subject-label" aria-expanded={subjectPickerOpen}
                    disabled={saving} onClick={() => { setSubjectPickerOpen(!subjectPickerOpen); setDatePickerOpen(false); }}>
                    <span className="tenna-subject-dot" style={{ backgroundColor: getCalendarDotColor(form.materia) }} />
                    <span>{form.materia}</span><Icon name="chevronDown" size={16} />
                  </button>
                  {subjectPickerOpen && (
                    <div className="tenna-picker-popover tenna-subject-options" role="listbox" aria-label="Selecionar matéria">
                      {MATERIAS.map((materia) => (
                        <button key={materia} type="button" role="option" aria-selected={form.materia === materia}
                          className={form.materia === materia ? 'active' : ''}
                          onClick={() => { setForm({ ...form, materia }); setSubjectPickerOpen(false); }}>
                          <span className="tenna-subject-dot" style={{ backgroundColor: getCalendarDotColor(materia) }} />
                          {materia}
                          {form.materia === materia && <span className="tenna-option-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="tenna-activity-field tenna-picker-wrap">
                  <label id="tenna-date-label">Data</label>
                  <button type="button" className="tenna-activity-control tenna-date-trigger"
                    aria-labelledby="tenna-date-label" aria-expanded={datePickerOpen}
                    disabled={saving} onClick={() => openPickerForDate(form.data)}>
                    <Icon name="calendar" size={17} />
                    <span>{new Date(`${form.data}T12:00:00`).toLocaleDateString('pt-BR')}</span>
                    <Icon name="chevronDown" size={16} />
                  </button>
                  {datePickerOpen && (
                    <div className="tenna-picker-popover tenna-date-popover">
                      <div className="tenna-date-nav">
                        <strong>{pickerMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                        <div>
                          <button type="button" aria-label="Mês anterior" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}>‹</button>
                          <button type="button" aria-label="Próximo mês" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}>›</button>
                        </div>
                      </div>
                      <div className="tenna-date-grid">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="tenna-date-weekday">{d}</span>)}
                        {pickerDays.map((day) => {
                          const key = dateKey(day);
                          return (
                            <button key={key} type="button"
                              className={[day.getMonth() !== pickerMonth.getMonth() ? 'outside' : '', key === form.data ? 'selected' : '', key === dateKey(now) ? 'today' : ''].join(' ')}
                              aria-label={day.toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                              aria-pressed={key === form.data}
                              disabled={!canScheduleOnDate(key, now) && key !== editing?.data}
                              onClick={() => changeFormDate(key)}>
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" className="tenna-date-today"
                        disabled={!canScheduleOnDate(dateKey(now), now) && editing?.data !== dateKey(now)}
                        onClick={() => changeFormDate(getTodayKey())}>Selecionar hoje</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="tenna-activity-field">
                <label id="tenna-activity-time-label">Horário</label>
                <div className="tenna-time-control" role="group" aria-labelledby="tenna-activity-time-label">
                  <span className="tenna-time-icon" aria-hidden="true"><Icon name="clock" size={19} /></span>
                  <TimePartInput label="Horas" max={23} disabled={saving}
                    value={(form.horario || '08:00').split(':')[0]}
                    onChange={(value) => updateTimePart('hours', value)} />
                  <span className="tenna-time-separator" aria-hidden="true">:</span>
                  <TimePartInput label="Minutos" max={59} disabled={saving}
                    value={(form.horario || '08:00').split(':')[1]}
                    onChange={(value) => updateTimePart('minutes', value)} />
                  <span className="tenna-time-hint">24h</span>
                </div>
                {quickTimesForDate(form.data, now).length > 0 && (
                  <div className="tenna-time-suggestions" aria-label="Sugestões de horário">
                    <span>Sugestões:</span>
                    {quickTimesForDate(form.data, now).map((time) => (
                      <button key={time} type="button" disabled={saving}
                        className={time === form.horario ? 'active' : ''}
                        aria-pressed={time === form.horario}
                        onClick={() => {
                          setScheduleError('');
                          setForm((current) => ({ ...current, horario: time }));
                        }}>{time}</button>
                    ))}
                  </div>
                )}
                {(scheduleError || scheduleIsInPast) && (
                  <p className="tenna-schedule-error" role="alert">
                    {scheduleError || 'Escolha uma data e um horário que ainda não passaram.'}
                  </p>
                )}
              </div>
            </div>

            <div className="tenna-activity-footer">
              {editing && <button type="button" className="tenna-activity-delete" onClick={deleteActivity} disabled={saving}>Excluir atividade</button>}
              <button type="button" className="tenna-activity-cancel" disabled={saving}
                onClick={() => { setShowCreate(false); setEditing(null); }}>Cancelar</button>
              <button type="submit" className="tenna-activity-submit"
                disabled={saving || !form.nome.trim() || !validFormTime || scheduleIsInPast}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar atividade'}
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