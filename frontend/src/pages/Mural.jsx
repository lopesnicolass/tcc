import { useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const MATERIAS = ['Português', 'Matemática', 'História', 'Geografia', 'Ciências'];
const MAX_CHARS = 200;

const COLOR_CLASS = {
  Português: 'postit-portugues',
  Matemática: 'postit-matematica',
  História: 'postit-historia',
  Geografia: 'postit-geografia',
  Ciências: 'postit-ciencias',
};

const TILTS = [-3, 2, -1.5, 3, -2, 1.5];

const INITIAL_POSTITS = [
  { id: 1, materia: 'Matemática', text: 'Fórmula de Bhaskara: x = (-b ± √Δ) / 2a' },
  { id: 2, materia: 'Português', text: 'Advérbio: modifica um verbo, adjetivo ou outro advérbio.' },
  { id: 3, materia: 'Ciências', text: 'Fotossíntese ocorre nos cloroplastos, com luz, água e CO₂.' },
  { id: 4, materia: 'Geografia', text: 'Revisar os principais biomas brasileiros para a prova.' },
  { id: 5, materia: 'História', text: 'Proclamação da República: 15 de novembro de 1889.' },
  { id: 6, materia: 'Português', text: 'Sujeito oculto: não aparece na frase, mas dá pra identificar pelo verbo.' },
];

export default function Mural() {
const { addXP } = useGamification();

  const [postits, setPostits] = useState(INITIAL_POSTITS);
  const [filtro, setFiltro] = useState('Todas');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newMateria, setNewMateria] = useState(MATERIAS[0]);

  const [editingPostit, setEditingPostit] = useState(null);
  const [editText, setEditText] = useState('');
  const [editMateria, setEditMateria] = useState(MATERIAS[0]);

  const visiveis = filtro === 'Todas' ? postits : postits.filter((p) => p.materia === filtro);

  function openAddModal() {
    setNewText('');
    setNewMateria(MATERIAS[0]);
    setShowAddModal(true);
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    setPostits((prev) => [...prev, { id: Date.now(), materia: newMateria, text: newText.trim() }]);
    addXP(10, 'novo post-it');
    setShowAddModal(false);
  }

  function openEditModal(postit) {
    setEditingPostit(postit);
    setEditText(postit.text);
    setEditMateria(postit.materia);
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    if (!editText.trim()) return;
    setPostits((prev) => prev.map((p) => (p.id === editingPostit.id ? { ...p, text: editText.trim(), materia: editMateria } : p)));
    setEditingPostit(null);
  }

  function handleDelete() {
    setPostits((prev) => prev.filter((p) => p.id !== editingPostit.id));
    setEditingPostit(null);
  }

  return (
    <div>
      <div className="mural-header">
        <h1>Mural de Post-its</h1>
        <div className="mural-actions">
          <button className="mural-btn primary" onClick={openAddModal}>+ Adicionar post-it</button>
          <select className="mural-filter-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="Todas">Filtrar por matéria</option>
            {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <div className="mural-empty">Nenhum post-it nessa matéria ainda.</div>
      ) : (
        <div className="mural-grid">
          {visiveis.map((p, i) => (
            <div
              key={p.id}
              className={`postit ${COLOR_CLASS[p.materia]}`}
              style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}
              onClick={() => openEditModal(p)}
            >
              <span className="postit-tag">{p.materia}</span>
              <p className="postit-text">{p.text}</p>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicione um novo post-it ao seu mural</h2>
              <p>Post-its te ajudam a memorizar o conteúdo mais rápido e fácil</p>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="modal-textarea-wrap">
                  <textarea
                    className="modal-textarea"
                    placeholder="Faça sua anotação..."
                    maxLength={MAX_CHARS}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    autoFocus
                  />
                  <span className="modal-charcount">{newText.length}/{MAX_CHARS}</span>
                </div>
                <div className="modal-materia-list">
                  <span className="modal-materia-label">Matéria</span>
                  {MATERIAS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      className={`materia-pill ${newMateria === m ? 'selected' : ''}`}
                      onClick={() => setNewMateria(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPostit && (
        <div className="modal-overlay" onClick={() => setEditingPostit(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post-it</h2>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="modal-textarea-wrap">
                  <textarea
                    className="modal-textarea"
                    maxLength={MAX_CHARS}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <span className="modal-charcount">{editText.length}/{MAX_CHARS}</span>
                </div>
                <div className="modal-materia-list">
                  <span className="modal-materia-label">Matéria</span>
                  {MATERIAS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      className={`materia-pill ${editMateria === m ? 'selected' : ''}`}
                      onClick={() => setEditMateria(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setEditingPostit(null)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Salvar</button>
              </div>
            </form>
            <button className="modal-delete" onClick={handleDelete}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}