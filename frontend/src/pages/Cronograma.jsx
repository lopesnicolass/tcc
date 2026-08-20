import { useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MATERIAS = ['Português', 'Simulado', 'Matemática', 'Prova Anterior', 'História', 'Outro', 'Geografia', 'Ciências'];

const INITIAL_ACTIVITIES = [
  { id: 1, dia: 'Segunda', horario: '08:00 - 09:00', nome: 'Equação 2º Grau', materia: 'Matemática', done: false },
  { id: 2, dia: 'Segunda', horario: '14:00 - 15:00', nome: 'Equação 2º Grau', materia: 'Matemática', done: false },
  { id: 3, dia: 'Terça', horario: '10:00 - 11:00', nome: 'Interpretação de texto', materia: 'Português', done: false },
  { id: 4, dia: 'Quinta', horario: '09:00 - 10:00', nome: 'Vestibulinho 2025', materia: 'Prova Anterior', done: false },
  { id: 5, dia: 'Quinta', horario: '14:00 - 15:00', nome: 'Equação 2º Grau', materia: 'Matemática', done: false },
  { id: 6, dia: 'Sexta', horario: '14:00 - 16:00', nome: 'Simulado', materia: 'Simulado', done: false },
];

const emptyForm = { nome: '', materia: MATERIAS[0], horario: '', dia: WEEK_DAYS[0] };

export default function Cronograma() {
const { addXP } = useGamification();

  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekLabel = weekOffset === 0 ? 'Semana Atual' : weekOffset > 0 ? `${weekOffset} semana(s) à frente` : `${Math.abs(weekOffset)} semana(s) atrás`;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function openCreate() {
    setCreateForm(emptyForm);
    setShowCreate(true);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!createForm.nome.trim() || !createForm.horario.trim()) return;
    setActivities((prev) => [...prev, { id: Date.now(), ...createForm, done: false }]);
    addXP(15, 'atividade concluída');
    setShowCreate(false);
  }

  function openEdit(activity) {
    setEditing(activity);
    setEditForm({ nome: activity.nome, materia: activity.materia, horario: activity.horario, dia: activity.dia });
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    setActivities((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...editForm } : a)));
    setEditing(null);
  }

  function handleComplete() {
    setActivities((prev) => prev.map((a) => (a.id === editing.id ? { ...a, done: true } : a)));
    setEditing(null);
  }

  function handleDelete() {
    setActivities((prev) => prev.filter((a) => a.id !== editing.id));
    setEditing(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cronograma de estudos</h1>
          <p>Organize seu tempo e maximize seu aprendizado</p>
        </div>
        <div className="page-actions">
          <button className="mural-btn primary" onClick={openCreate}>+ Adicionar Atividade</button>
        </div>
      </div>

      <div className="week-nav">
        <button onClick={() => setWeekOffset((v) => v - 1)} aria-label="Semana anterior">‹</button>
        <span className="week-label">{weekLabel}</span>
        <button onClick={() => setWeekOffset((v) => v + 1)} aria-label="Próxima semana">›</button>
      </div>

      <div className="week-grid">
        {WEEK_DAYS.map((day) => {
          const dayTasks = activities.filter((a) => a.dia === day);
          return (
            <div className="day-column" key={day}>
              <span className="day-name">{day}</span>
              {dayTasks.length === 0 ? (
                <span className="day-task-empty">Sem atividades</span>
              ) : (
                dayTasks.map((t) => (
                  <div className={`day-task ${t.done ? 'done' : ''}`} key={t.id} onClick={() => openEdit(t)}>
                    <span className="task-time">{t.horario}</span>
                    <strong>{t.materia}</strong><br />
                    {t.nome}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      <div className="cronograma-summary-grid">
        <div className="panel-card">
          <h3>Resumo da Semana</h3>
          <div className="summary-list">
            <div className="summary-row"><span>Total de horas</span><span>18h</span></div>
            <div className="summary-row"><span>Atividades</span><span>{activities.length}</span></div>
            <div className="summary-row"><span>Simulados</span><span>{activities.filter((a) => a.materia === 'Simulado').length}</span></div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Distribuição</h3>
          <div className="bar-row">
            <div className="bar-row-label"><span>Matemática</span><span>87%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '87%' }}></div></div>
          </div>
          <div className="bar-row">
            <div className="bar-row-label"><span>Português</span><span>100%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '100%' }}></div></div>
          </div>
          <div className="bar-row">
            <div className="bar-row-label"><span>Outras</span><span>67%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '67%' }}></div></div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Meta Semanal</h3>
          <div className="meta-circle-wrap">
            <div className="meta-circle" style={{ background: `conic-gradient(var(--accent) 0% 75%, var(--paper) 75% 100%)` }}>
              <div style={{ background: '#fff', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>75%</div>
            </div>
            <span className="meta-circle-label">13.5h de 18h completas</span>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicione atividades ao seu cronograma</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-two-col">
                <div>
                  <div className="modal-input-group">
                    <label>Nome da atividade</label>
                    <input
                      type="text"
                      value={createForm.nome}
                      onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Horário</label>
                    <input
                      type="text"
                      placeholder="08:00 - 09:00"
                      value={createForm.horario}
                      onChange={(e) => setCreateForm({ ...createForm, horario: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Dia da semana</label>
                    <select
                      value={createForm.dia}
                      onChange={(e) => setCreateForm({ ...createForm, dia: e.target.value })}
                    >
                      {WEEK_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <span className="modal-materia-label">Matéria</span>
                  <div className="materia-pill-grid">
                    {MATERIAS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`materia-pill ${createForm.materia === m ? 'selected' : ''}`}
                        onClick={() => setCreateForm({ ...createForm, materia: m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Atividade</h2>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-two-col">
                <div>
                  <div className="modal-input-group">
                    <label>Nome da atividade</label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Horário</label>
                    <input
                      type="text"
                      value={editForm.horario}
                      onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Dia da semana</label>
                    <select
                      value={editForm.dia}
                      onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })}
                    >
                      {WEEK_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <span className="modal-materia-label">Matéria</span>
                  <div className="materia-pill-grid">
                    {MATERIAS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`materia-pill ${editForm.materia === m ? 'selected' : ''}`}
                        onClick={() => setEditForm({ ...editForm, materia: m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Salvar</button>
                <button type="button" className="mural-btn primary" onClick={handleComplete}>Concluída</button>
              </div>
            </form>
            <button className="modal-delete" onClick={handleDelete}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}