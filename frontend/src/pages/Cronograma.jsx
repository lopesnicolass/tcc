import { useEffect, useMemo, useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const STORAGE_KEY = 'tenna_calendario_atividades';
const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MATERIAS = ['Português', 'Matemática', 'História', 'Geografia', 'Ciências', 'Simulado', 'Prova Anterior', 'Outro'];

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayKey = dateKey(new Date());

function getUserKey() {
  try {
    const raw = localStorage.getItem('etecamp_usuario');
    if (!raw) return 'anonimo';
    const user = JSON.parse(raw);
    return String(user.id || user.usuarioId || 'anonimo');
  } catch { return 'anonimo'; }
}

function loadActivities() {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${getUserKey()}`);
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return [
    { id: 1, data: todayKey, horario: '08:00', nome: 'Revisar conteúdo', materia: 'Matemática', done: false },
    { id: 2, data: todayKey, horario: '14:00', nome: 'Interpretação de texto', materia: 'Português', done: false },
  ];
}

const emptyForm = { nome: '', materia: 'Matemática', data: todayKey, horario: '08:00' };

export default function Cronograma() {
  const { addXP } = useGamification();
  const [activities, setActivities] = useState(loadActivities);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_${getUserKey()}`, JSON.stringify(activities));
  }, [activities]);

  const monthTitle = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthLabel = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const calendarDays = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentMonth]);

  const selectedActivities = activities
    .filter((a) => a.data === selectedDate)
    .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

  const monthActivities = activities.filter((a) => a.data?.startsWith(`${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}`));
  const doneCount = monthActivities.filter((a) => a.done).length;
  const totalHours = monthActivities.reduce((sum, a) => {
    const [h, m] = (a.horario || '0:00').split(':').map(Number);
    return sum + (Number.isFinite(h) ? h : 0) + (Number.isFinite(m) ? m / 60 : 0);
  }, 0);

  function changeMonth(delta) {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function goToday() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(dateKey(today));
  }

  function openCreate(date = selectedDate) {
    setEditing(null);
    setForm({ ...emptyForm, data: date });
    setShowCreate(true);
  }

  function openEdit(activity) {
    setEditing(activity);
    setForm({ nome: activity.nome, materia: activity.materia, data: activity.data, horario: activity.horario });
    setShowCreate(true);
  }

  function saveActivity(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    if (editing) {
      setActivities((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form, nome: form.nome.trim() } : a));
    } else {
      setActivities((prev) => [...prev, { id: Date.now(), ...form, nome: form.nome.trim(), done: false }]);
      addXP(5, 'atividade adicionada ao calendário');
    }
    setSelectedDate(form.data);
    const d = new Date(`${form.data}T12:00:00`);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setShowCreate(false);
  }

  function deleteActivity() {
    if (!editing) return;
    setActivities((prev) => prev.filter((a) => a.id !== editing.id));
    setShowCreate(false);
  }

  function toggleDone(activity) {
    setActivities((prev) => prev.map((a) => a.id === activity.id ? { ...a, done: !a.done } : a));
  }

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <span className="calendar-kicker">MINHA ROTINA</span>
          <h1>Meu calendário</h1>
          <p>Organize seus estudos, acompanhe sua rotina e não deixe o conteúdo acumular.</p>
        </div>
        <div className="page-actions">
          <button className="mural-btn primary" onClick={() => openCreate()}>+ Nova atividade</button>
        </div>
      </div>

      <section className="calendar-overview">
        <div><span>Atividades no mês</span><strong>{monthActivities.length}</strong></div>
        <div><span>Concluídas</span><strong>{doneCount}</strong></div>
        <div><span>Horas planejadas</span><strong>{totalHours.toFixed(1)}h</strong></div>
        <div className="calendar-overview-tip"><span>💡</span><p>Use o <strong>Plano automático</strong> para receber uma sugestão de rotina e depois trazer as semanas para cá.</p></div>
      </section>

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-toolbar">
            <div className="calendar-month-nav">
              <button onClick={() => changeMonth(-1)} aria-label="Mês anterior">‹</button>
              <h2>{monthLabel}</h2>
              <button onClick={() => changeMonth(1)} aria-label="Próximo mês">›</button>
            </div>
            <button className="calendar-today" onClick={goToday}>Hoje</button>
          </div>

          <div className="calendar-weekdays">
            {WEEK_DAYS.map((day) => <span key={day}>{day.slice(0, 3)}</span>)}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const key = dateKey(day);
              const dayActivities = activities.filter((a) => a.data === key);
              const inMonth = day.getMonth() === currentMonth.getMonth();
              const selected = key === selectedDate;
              const isToday = key === todayKey;
              return (
                <button key={key} className={`calendar-day ${!inMonth ? 'outside' : ''} ${selected ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDate(key)}>
                  <span className="calendar-day-number">{day.getDate()}</span>
                  {dayActivities.slice(0, 3).map((a) => <span key={a.id} className={`calendar-event ${a.done ? 'done' : ''}`}>{a.materia} · {a.nome}</span>)}
                  {dayActivities.length > 3 && <span className="calendar-more">+{dayActivities.length - 3} mais</span>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="calendar-sidebar-card">
          <div className="calendar-selected-head">
            <div>
              <span>ATIVIDADES DO DIA</span>
              <h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            </div>
            <button className="calendar-add-small" onClick={() => openCreate()}>+</button>
          </div>

          <div className="calendar-task-list">
            {selectedActivities.length === 0 ? (
              <div className="calendar-empty-day">
                <span>📚</span>
                <strong>Nada planejado ainda</strong>
                <p>Adicione uma atividade para organizar este dia.</p>
                <button onClick={() => openCreate()}>Adicionar atividade</button>
              </div>
            ) : selectedActivities.map((activity) => (
              <article className={`calendar-task ${activity.done ? 'done' : ''}`} key={activity.id} onClick={() => openEdit(activity)}>
                <button className="calendar-check" onClick={(e) => { e.stopPropagation(); toggleDone(activity); }}>{activity.done ? '✓' : ''}</button>
                <div className="calendar-task-info">
                  <span>{activity.horario} · {activity.materia}</span>
                  <strong>{activity.nome}</strong>
                </div>
                <span className="calendar-task-arrow">›</span>
              </article>
            ))}
          </div>

          <button className="calendar-full-add" onClick={() => openCreate()}>+ Adicionar atividade neste dia</button>
        </aside>
      </div>

      {showCreate && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <form className="modal-card calendar-modal" onSubmit={saveActivity}>
            <div className="modal-header">
              <h2>{editing ? 'Editar atividade' : 'Nova atividade'}</h2>
              <p>Defina quando e o que você pretende estudar.</p>
            </div>
            <div className="modal-input-group"><label>Atividade</label><input autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Equação do 2º grau" /></div>
            <div className="modal-two-col">
              <div className="modal-input-group"><label>Matéria</label><select value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })}>{MATERIAS.map((m) => <option key={m}>{m}</option>)}</select></div>
              <div className="modal-input-group"><label>Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            </div>
            <div className="modal-input-group"><label>Horário</label><input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} /></div>
            <div className="modal-actions">
              {editing && <button type="button" className="modal-delete" onClick={deleteActivity}>Excluir</button>}
              <button type="button" className="mural-btn secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="mural-btn primary" type="submit">{editing ? 'Salvar alterações' : 'Adicionar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
