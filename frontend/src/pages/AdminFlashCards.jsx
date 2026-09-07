import { useState } from 'react';

const MATERIAS = ['Português', 'Matemática', 'História', 'Geografia', 'Ciências'];

const INITIAL_CARDS = [
  { id: 1, primario: 'Qual a fórmula de Bhaskara?', secundario: 'x = (-b ± √Δ) / 2a', materia: 'Matemática' },
  { id: 2, primario: 'O que é um adjetivo?', secundario: 'Palavra que caracteriza o substantivo.', materia: 'Português' },
  { id: 3, primario: 'Quem descobriu o Brasil?', secundario: 'Pedro Álvares Cabral, em 1500.', materia: 'História' },
  { id: 4, primario: 'O que é um advérbio?', secundario: 'Palavra que modifica verbo, adjetivo ou outro advérbio.', materia: 'Português' },
  { id: 5, primario: 'Em que ano começou a Segunda Guerra Mundial?', secundario: '1939.', materia: 'História' },
  { id: 6, primario: 'O que é urbanização?', secundario: 'Processo de crescimento e expansão das cidades.', materia: 'Geografia' },
];

const emptyForm = { primario: '', secundario: '', materia: MATERIAS[0] };

export default function AdminFlashCards() {
  const [cards, setCards] = useState(INITIAL_CARDS);

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
    if (!createForm.primario.trim()) return;
    setCards((prev) => [...prev, { id: Date.now(), ...createForm }]);
    setShowCreate(false);
  }

  function openEdit(card) {
    setEditing(card);
    setEditForm({ primario: card.primario, secundario: card.secundario, materia: card.materia });
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    setCards((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...editForm } : c)));
    setEditing(null);
  }

  function handleDelete() {
    setCards((prev) => prev.filter((c) => c.id !== editing.id));
    setEditing(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Flash Cards</h1>
      </div>

      <div className="admin-flashcard-grid">
        {cards.map((c) => (
          <div className="admin-flashcard-item" key={c.id} onClick={() => openEdit(c)}>
            {c.primario}
          </div>
        ))}
      </div>

      <button className="fab-add" onClick={openCreate} aria-label="Criar flashcard">+</button>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Flash Card</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="modal-textarea-wrap">
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    placeholder="Texto primário"
                    maxLength={40}
                    value={createForm.primario}
                    onChange={(e) => setCreateForm({ ...createForm, primario: e.target.value })}
                    autoFocus
                  />
                  <span className="modal-charcount">{createForm.primario.length}/40</span>

                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px', marginTop: '14px' }}
                    placeholder="Texto secundário"
                    maxLength={90}
                    value={createForm.secundario}
                    onChange={(e) => setCreateForm({ ...createForm, secundario: e.target.value })}
                  />
                  <span className="modal-charcount">{createForm.secundario.length}/90</span>
                </div>
                <div className="modal-materia-list">
                  <span className="modal-materia-label">Matéria</span>
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
              <h2>Editar Flash Card</h2>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="modal-textarea-wrap">
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    maxLength={40}
                    value={editForm.primario}
                    onChange={(e) => setEditForm({ ...editForm, primario: e.target.value })}
                    autoFocus
                  />
                  <span className="modal-charcount">{editForm.primario.length}/40</span>

                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px', marginTop: '14px' }}
                    maxLength={90}
                    value={editForm.secundario}
                    onChange={(e) => setEditForm({ ...editForm, secundario: e.target.value })}
                  />
                  <span className="modal-charcount">{editForm.secundario.length}/90</span>
                </div>
                <div className="modal-materia-list">
                  <span className="modal-materia-label">Matéria</span>
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
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
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