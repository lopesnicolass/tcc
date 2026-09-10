import { useEffect, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MATERIAS = [
  'Português',
  'Matemática',
  'História',
  'Geografia',
  'Ciências'
];

const emptyForm = {
  primario: '',
  secundario: '',
  materia: MATERIAS[0]
};

export default function AdminFlashCards() {
  const [cards, setCards] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarFlashcards();
  }, []);

  async function carregarFlashcards() {
    try {
      setCarregando(true);

      const token =
        localStorage.getItem('etecamp_token');

      const resposta = await fetch(
        `${API_URL}/flashcards`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || 'Erro ao carregar flashcards.'
        );
      }

      const flashcards = Array.isArray(dados)
        ? dados
        : dados.flashcards || [];

      setCards(flashcards);
    } catch (erro) {
      console.error(
        'Erro ao carregar flashcards:',
        erro
      );
    } finally {
      setCarregando(false);
    }
  }

  function openCreate() {
    setCreateForm(emptyForm);
    setShowCreate(true);
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!createForm.primario.trim()) {
      return;
    }

    if (!createForm.secundario.trim()) {
      return;
    }

    try {
      const token =
        localStorage.getItem('etecamp_token');

      const resposta = await fetch(
        `${API_URL}/flashcards`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            primario: createForm.primario.trim(),
            secundario: createForm.secundario.trim(),
            materia: createForm.materia
          })
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || 'Erro ao criar flashcard.'
        );
      }

      setCards((prev) => [
        ...prev,
        dados.flashcard
      ]);

      setShowCreate(false);
      setCreateForm(emptyForm);

    } catch (erro) {
      console.error(
        'Erro ao criar flashcard:',
        erro
      );

      alert(
        erro.message ||
        'Não foi possível criar o flashcard.'
      );
    }
  }

  function openEdit(card) {
    setEditing(card);

    setEditForm({
      primario: card.primario,
      secundario: card.secundario,
      materia: card.materia
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    if (!editForm.primario.trim()) {
      return;
    }

    if (!editForm.secundario.trim()) {
      return;
    }

    try {
      const token =
        localStorage.getItem('etecamp_token');

      const resposta = await fetch(
        `${API_URL}/flashcards/${editing.id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            primario: editForm.primario.trim(),
            secundario: editForm.secundario.trim(),
            materia: editForm.materia
          })
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Erro ao atualizar flashcard.'
        );
      }

      setCards((prev) =>
        prev.map((card) =>
          card.id === editing.id
            ? dados.flashcard
            : card
        )
      );

      setEditing(null);

    } catch (erro) {
      console.error(
        'Erro ao atualizar flashcard:',
        erro
      );

      alert(
        erro.message ||
        'Não foi possível atualizar o flashcard.'
      );
    }
  }

  async function handleDelete() {
    if (!editing) {
      return;
    }

    try {
      const token =
        localStorage.getItem('etecamp_token');

      const resposta = await fetch(
        `${API_URL}/flashcards/${editing.id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Erro ao excluir flashcard.'
        );
      }

      setCards((prev) =>
        prev.filter(
          (card) => card.id !== editing.id
        )
      );

      setEditing(null);

    } catch (erro) {
      console.error(
        'Erro ao excluir flashcard:',
        erro
      );

      alert(
        erro.message ||
        'Não foi possível excluir o flashcard.'
      );
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Flash Cards</h1>
      </div>

      {carregando ? (
        <p>Carregando flashcards...</p>
      ) : (
        <div className="admin-flashcard-grid">
          {cards.map((card) => (
            <div
              className="admin-flashcard-item"
              key={card.id}
              onClick={() => openEdit(card)}
            >
              {card.primario}
            </div>
          ))}
        </div>
      )}

      <button
        className="fab-add"
        onClick={openCreate}
        aria-label="Criar flashcard"
      >
        +
      </button>

      {showCreate && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
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
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        primario: e.target.value
                      })
                    }
                    autoFocus
                  />

                  <span className="modal-charcount">
                    {createForm.primario.length}/40
                  </span>

                  <textarea
                    className="modal-textarea"
                    style={{
                      height: '90px',
                      marginTop: '14px'
                    }}
                    placeholder="Texto secundário"
                    maxLength={90}
                    value={createForm.secundario}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        secundario: e.target.value
                      })
                    }
                  />

                  <span className="modal-charcount">
                    {createForm.secundario.length}/90
                  </span>
                </div>

                <div className="modal-materia-list">
                  <span className="modal-materia-label">
                    Matéria
                  </span>

                  {MATERIAS.map((materia) => (
                    <button
                      type="button"
                      key={materia}
                      className={`materia-pill ${
                        createForm.materia === materia
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          materia
                        })
                      }
                    >
                      {materia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="mural-btn primary"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div
          className="modal-overlay"
          onClick={() => setEditing(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
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
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        primario: e.target.value
                      })
                    }
                    autoFocus
                  />

                  <span className="modal-charcount">
                    {editForm.primario.length}/40
                  </span>

                  <textarea
                    className="modal-textarea"
                    style={{
                      height: '90px',
                      marginTop: '14px'
                    }}
                    maxLength={90}
                    value={editForm.secundario}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        secundario: e.target.value
                      })
                    }
                  />

                  <span className="modal-charcount">
                    {editForm.secundario.length}/90
                  </span>
                </div>

                <div className="modal-materia-list">
                  <span className="modal-materia-label">
                    Matéria
                  </span>

                  {MATERIAS.map((materia) => (
                    <button
                      type="button"
                      key={materia}
                      className={`materia-pill ${
                        editForm.materia === materia
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setEditForm({
                          ...editForm,
                          materia
                        })
                      }
                    >
                      {materia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="mural-btn primary"
                >
                  Salvar
                </button>
              </div>
            </form>

            <button
              className="modal-delete"
              onClick={handleDelete}
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}