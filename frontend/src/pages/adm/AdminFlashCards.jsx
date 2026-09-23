import '../../styles/adm/AdminFlashCards.css';
import { useEffect, useMemo, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const emptyForm = {
  primario: '',
  secundario: '',
  materiaId: '',
  topicoId: '',
};

export default function AdminFlashCards() {
  const [cards, setCards] = useState([]);
  const [materias, setMaterias] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro('');

      const token =
        localStorage.getItem('etecamp_token');

      const [respostaFlashcards, respostaConteudos] =
        await Promise.all([
          fetch(`${API_URL}/flashcards`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/conteudos`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const dadosFlashcards =
        await respostaFlashcards.json();
      const dadosConteudos =
        await respostaConteudos.json();

      if (!respostaFlashcards.ok) {
        throw new Error(
          dadosFlashcards.erro ||
            'Erro ao carregar flashcards.'
        );
      }

      if (!respostaConteudos.ok) {
        throw new Error(
          dadosConteudos.erro ||
            'Erro ao carregar os conteúdos.'
        );
      }

      const flashcards = Array.isArray(dadosFlashcards)
        ? dadosFlashcards
        : dadosFlashcards.flashcards || [];

      const listaMaterias = Array.isArray(
        dadosConteudos.materias
      )
        ? dadosConteudos.materias
        : [];

      setCards(flashcards);
      setMaterias(listaMaterias);
    } catch (erroCarregamento) {
      console.error(
        'Erro ao carregar dados dos flashcards:',
        erroCarregamento
      );

      setErro(
        erroCarregamento.message ||
          'Não foi possível carregar os dados.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function obterMateriasAtivas() {
    return materias.filter(
      (materia) => Number(materia.ativa) === 1
    );
  }

  function obterConteudosDaMateria(materiaId) {
    const materia = materias.find(
      (item) => String(item.id) === String(materiaId)
    );

    return (materia?.topicos || []).filter(
      (topico) => Number(topico.ativo) === 1
    );
  }

  const materiasAtivas = useMemo(
    () => obterMateriasAtivas(),
    [materias]
  );

  const createConteudos = useMemo(
    () =>
      obterConteudosDaMateria(
        createForm.materiaId
      ),
    [createForm.materiaId, materias]
  );

  const editConteudos = useMemo(
    () =>
      obterConteudosDaMateria(
        editForm.materiaId
      ),
    [editForm.materiaId, materias]
  );

  function openCreate() {
    setErro('');
    setCreateForm(emptyForm);
    setShowCreate(true);
  }

  function handleMateriaCreateChange(event) {
    setCreateForm((prev) => ({
      ...prev,
      materiaId: event.target.value,
      topicoId: '',
    }));
  }

  function handleMateriaEditChange(event) {
    setEditForm((prev) => ({
      ...prev,
      materiaId: event.target.value,
      topicoId: '',
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!createForm.primario.trim()) {
      alert('Preencha o texto primário.');
      return;
    }

    if (!createForm.secundario.trim()) {
      alert('Preencha o texto secundário.');
      return;
    }

    if (!createForm.materiaId) {
      alert('Selecione uma matéria.');
      return;
    }

    if (!createForm.topicoId) {
      alert('Selecione um conteúdo.');
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
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            primario: createForm.primario.trim(),
            secundario: createForm.secundario.trim(),
            materiaId: Number(createForm.materiaId),
            topicoId: Number(createForm.topicoId),
          }),
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
        dados.flashcard,
      ]);

      setShowCreate(false);
      setCreateForm(emptyForm);
    } catch (erroCriacao) {
      console.error(
        'Erro ao criar flashcard:',
        erroCriacao
      );

      alert(
        erroCriacao.message ||
          'Não foi possível criar o flashcard.'
      );
    }
  }

  function openEdit(card) {
    setEditing(card);
    setErro('');

    setEditForm({
      primario: card.primario || '',
      secundario: card.secundario || '',
      materiaId: card.materia_id
        ? String(card.materia_id)
        : '',
      topicoId: card.topico_id
        ? String(card.topico_id)
        : '',
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    if (!editForm.primario.trim()) {
      alert('Preencha o texto primário.');
      return;
    }

    if (!editForm.secundario.trim()) {
      alert('Preencha o texto secundário.');
      return;
    }

    if (!editForm.materiaId) {
      alert('Selecione uma matéria.');
      return;
    }

    if (!editForm.topicoId) {
      alert('Selecione um conteúdo.');
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
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            primario: editForm.primario.trim(),
            secundario: editForm.secundario.trim(),
            materiaId: Number(editForm.materiaId),
            topicoId: Number(editForm.topicoId),
          }),
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
    } catch (erroEdicao) {
      console.error(
        'Erro ao atualizar flashcard:',
        erroEdicao
      );

      alert(
        erroEdicao.message ||
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
            Authorization: `Bearer ${token}`,
          },
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
    } catch (erroExclusao) {
      console.error(
        'Erro ao excluir flashcard:',
        erroExclusao
      );

      alert(
        erroExclusao.message ||
          'Não foi possível excluir o flashcard.'
      );
    }
  }

  function renderMateriaOptions() {
    return (
      <>
        <option value="">
          Selecione uma matéria
        </option>

        {materiasAtivas.map((materia) => (
          <option
            key={materia.id}
            value={materia.id}
          >
            {materia.nome}
          </option>
        ))}
      </>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Flash Cards</h1>
      </div>

      {erro && (
        <div className="admin-flashcard-error">
          {erro}
        </div>
      )}

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
              <strong>{card.primario}</strong>

              <span className="admin-flashcard-materia">
                {card.materia}
              </span>

              <span
                className={
                  card.conteudo
                    ? 'admin-flashcard-conteudo'
                    : 'admin-flashcard-conteudo pendente'
                }
              >
                {card.conteudo ||
                  'Conteúdo não definido'}
              </span>
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
            className="modal-card admin-flashcard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Novo Flash Card</h2>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <label className="admin-flashcard-field">
                  <span>Texto primário</span>
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    placeholder="Digite a pergunta"
                    maxLength={40}
                    value={createForm.primario}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        primario: e.target.value,
                      })
                    }
                    autoFocus
                  />
                  <small>
                    {createForm.primario.length}/40
                  </small>
                </label>

                <label className="admin-flashcard-field">
                  <span>Texto secundário</span>
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    placeholder="Digite a resposta"
                    maxLength={90}
                    value={createForm.secundario}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        secundario: e.target.value,
                      })
                    }
                  />
                  <small>
                    {createForm.secundario.length}/90
                  </small>
                </label>

                <div className="admin-flashcard-field">
                  <span>Matéria</span>
                  <select
                    value={createForm.materiaId}
                    onChange={handleMateriaCreateChange}
                  >
                    {renderMateriaOptions()}
                  </select>
                </div>

                <div className="admin-flashcard-field">
                  <span>Conteúdo</span>
                  <select
                    value={createForm.topicoId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        topicoId: e.target.value,
                      })
                    }
                    disabled={!createForm.materiaId}
                  >
                    <option value="">
                      {!createForm.materiaId
                        ? 'Selecione uma matéria primeiro'
                        : createConteudos.length
                          ? 'Selecione um conteúdo'
                          : 'Nenhum conteúdo cadastrado'}
                    </option>

                    {createConteudos.map((topico) => (
                      <option
                        key={topico.id}
                        value={topico.id}
                      >
                        {topico.nome}
                      </option>
                    ))}
                  </select>
                  <small>
                    O conteúdo precisa existir na matéria selecionada.
                  </small>
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
            className="modal-card admin-flashcard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Editar Flash Card</h2>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <label className="admin-flashcard-field">
                  <span>Texto primário</span>
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    maxLength={40}
                    value={editForm.primario}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        primario: e.target.value,
                      })
                    }
                    autoFocus
                  />
                  <small>
                    {editForm.primario.length}/40
                  </small>
                </label>

                <label className="admin-flashcard-field">
                  <span>Texto secundário</span>
                  <textarea
                    className="modal-textarea"
                    style={{ height: '90px' }}
                    maxLength={90}
                    value={editForm.secundario}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        secundario: e.target.value,
                      })
                    }
                  />
                  <small>
                    {editForm.secundario.length}/90
                  </small>
                </label>

                <div className="admin-flashcard-field">
                  <span>Matéria</span>
                  <select
                    value={editForm.materiaId}
                    onChange={handleMateriaEditChange}
                  >
                    {renderMateriaOptions()}
                  </select>
                </div>

                <div className="admin-flashcard-field">
                  <span>Conteúdo</span>
                  <select
                    value={editForm.topicoId}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        topicoId: e.target.value,
                      })
                    }
                    disabled={!editForm.materiaId}
                  >
                    <option value="">
                      {!editForm.materiaId
                        ? 'Selecione uma matéria primeiro'
                        : editConteudos.length
                          ? 'Selecione um conteúdo'
                          : 'Nenhum conteúdo cadastrado'}
                    </option>

                    {editConteudos.map((topico) => (
                      <option
                        key={topico.id}
                        value={topico.id}
                      >
                        {topico.nome}
                      </option>
                    ))}
                  </select>

                  {!editing.topico_id && (
                    <small className="admin-flashcard-warning">
                      Este flashcard antigo ainda não possui um conteúdo vinculado. Selecione um para organizá-lo.
                    </small>
                  )}
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
