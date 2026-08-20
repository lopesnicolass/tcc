import { useState } from 'react';

const MATERIAS = ['Português', 'Matemática', 'História', 'Geografia', 'Ciências'];
const MIN_QUESTOES = 10;

const emptySimulado = { nome: '', limiteTempo: '', dificuldade: 'Média', materia: MATERIAS[0] };
const emptyQuestao = { enunciado: '', a: '', b: '', c: '', d: '', e: '' };

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState(MATERIAS.map((m, i) => ({ id: i + 1, nome: m })));

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptySimulado);
  const [questoes, setQuestoes] = useState([]);

  const [showQuestaoModal, setShowQuestaoModal] = useState(false);
  const [questaoForm, setQuestaoForm] = useState(emptyQuestao);

  function openCreate() {
    setForm(emptySimulado);
    setQuestoes([]);
    setShowModal(true);
  }

  function handlePostar(e) {
    e.preventDefault();
    if (questoes.length < MIN_QUESTOES) return;
    setSimulados((prev) => [...prev, { id: Date.now(), nome: form.materia }]);
    setShowModal(false);
  }

  function handleAddQuestao(e) {
    e.preventDefault();
    if (!questaoForm.enunciado.trim()) return;
    setQuestoes((prev) => [...prev, questaoForm]);
    setQuestaoForm(emptyQuestao);
    setShowQuestaoModal(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Simulados</h1>
      </div>

      <div className="admin-list">
        {simulados.map((s) => (
          <div className="admin-list-item" key={s.id}>
            {s.nome}
            <button className="admin-edit-btn">Editar</button>
          </div>
        ))}
      </div>

      <button className="fab-add" onClick={openCreate} aria-label="Criar simulado">+</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Simulado</h2>
            </div>
            <form onSubmit={handlePostar}>
              <div className="modal-two-col">
                <div>
                  <div className="modal-input-group">
                    <label>Nome do Simulado</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Limite de tempo</label>
                    <input
                      type="text"
                      placeholder="ex: 60 minutos"
                      value={form.limiteTempo}
                      onChange={(e) => setForm({ ...form, limiteTempo: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Dificuldade</label>
                    <select value={form.dificuldade} onChange={(e) => setForm({ ...form, dificuldade: e.target.value })}>
                      <option>Fácil</option>
                      <option>Média</option>
                      <option>Difícil</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span className="modal-materia-label">Matéria</span>
                  <div className="modal-materia-list">
                    {MATERIAS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`materia-pill ${form.materia === m ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, materia: m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button type="button" className="mural-btn secondary" onClick={() => setShowQuestaoModal(true)}>
                Criar Questão
              </button>

              <div>
                <span className={`question-count-badge ${questoes.length < MIN_QUESTOES ? 'incomplete' : ''}`}>
                  {questoes.length} questão(ões) adicionada(s)
                </span>
                <p className="modal-note">É necessário no mínimo {MIN_QUESTOES} questões para postar um simulado.</p>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="mural-btn ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="mural-btn primary" disabled={questoes.length < MIN_QUESTOES}>Postar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuestaoModal && (
        <div className="modal-overlay" onClick={() => setShowQuestaoModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Questão</h2>
            </div>
            <form onSubmit={handleAddQuestao}>
              <div className="modal-scroll">
                <div className="modal-input-group">
                  <label>Enunciado</label>
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    value={questaoForm.enunciado}
                    onChange={(e) => setQuestaoForm({ ...questaoForm, enunciado: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="modal-input-group">
                  <label>Alternativa A</label>
                  <input type="text" value={questaoForm.a} onChange={(e) => setQuestaoForm({ ...questaoForm, a: e.target.value })} />
                </div>
                <div className="modal-input-group">
                  <label>Alternativa B</label>
                  <input type="text" value={questaoForm.b} onChange={(e) => setQuestaoForm({ ...questaoForm, b: e.target.value })} />
                </div>
                <div className="modal-input-group">
                  <label>Alternativa C</label>
                  <input type="text" value={questaoForm.c} onChange={(e) => setQuestaoForm({ ...questaoForm, c: e.target.value })} />
                </div>
                <div className="modal-input-group">
                  <label>Alternativa D</label>
                  <input type="text" value={questaoForm.d} onChange={(e) => setQuestaoForm({ ...questaoForm, d: e.target.value })} />
                </div>
                <div className="modal-input-group">
                  <label>Alternativa E</label>
                  <input type="text" value={questaoForm.e} onChange={(e) => setQuestaoForm({ ...questaoForm, e: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setShowQuestaoModal(false)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}