import '../../styles/adm/AdminFlashCards.css';
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../../services/api.js';

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

  const [busca, setBusca] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroTopico, setFiltroTopico] = useState('');

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

  const filtroConteudos = useMemo(
    () => obterConteudosDaMateria(filtroMateria),
    [filtroMateria, materias]
  );

  const cardsFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();

    return cards.filter((card) => {
      const correspondeMateria =
        !filtroMateria ||
        String(card.materia_id) === String(filtroMateria);

      const correspondeTopico =
        !filtroTopico ||
        String(card.topico_id) === String(filtroTopico);

      const textoPesquisa = [
        card.primario,
        card.secundario,
        card.materia,
        card.conteudo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();

      const correspondeBusca =
        !termo || textoPesquisa.includes(termo);

      return (
        correspondeMateria &&
        correspondeTopico &&
        correspondeBusca
      );
    });
  }, [cards, busca, filtroMateria, filtroTopico]);

  const cardsOrganizados = useMemo(() => {
    const grupos = new Map();

    cardsFiltrados.forEach((card) => {
      const materia = card.materia || 'Sem matéria';
      const conteudo = card.conteudo || 'Conteúdo não definido';

      if (!grupos.has(materia)) {
        grupos.set(materia, new Map());
      }

      const conteudos = grupos.get(materia);

      if (!conteudos.has(conteudo)) {
        conteudos.set(conteudo, []);
      }

      conteudos.get(conteudo).push(card);
    });

    return Array.from(grupos.entries());
  }, [cardsFiltrados]);

  const filtrosAtivos =
    Boolean(busca.trim()) ||
    Boolean(filtroMateria) ||
    Boolean(filtroTopico);

  function limparFiltros() {
    setBusca('');
    setFiltroMateria('');
    setFiltroTopico('');
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
        <>
          <div className="admin-flashcard-filters" aria-label="Filtros de flashcards">
            <div className="admin-flashcard-search">
              <label htmlFor="admin-flashcard-busca">Buscar</label>
              <div className="admin-flashcard-search-box">
                <input
                  id="admin-flashcard-busca"
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar pergunta, resposta, matéria ou conteúdo..."
                />
                {busca && (
                  <button
                    type="button"
                    className="admin-flashcard-clear-search"
                    onClick={() => setBusca('')}
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <label className="admin-flashcard-filter-field">
              <span>Matéria</span>
              <select
                value={filtroMateria}
                onChange={(event) => {
                  setFiltroMateria(event.target.value);
                  setFiltroTopico('');
                }}
              >
                <option value="">Todas as matérias</option>
                {materiasAtivas.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-flashcard-filter-field">
              <span>Conteúdo</span>
              <select
                value={filtroTopico}
                onChange={(event) => setFiltroTopico(event.target.value)}
                disabled={!filtroMateria}
              >
                <option value="">
                  {!filtroMateria
                    ? 'Selecione uma matéria'
                    : filtroConteudos.length
                      ? 'Todos os conteúdos'
                      : 'Nenhum conteúdo cadastrado'}
                </option>
                {filtroConteudos.map((topico) => (
                  <option key={topico.id} value={topico.id}>
                    {topico.nome}
                  </option>
                ))}
              </select>
            </label>

            {filtrosAtivos && (
              <button
                type="button"
                className="admin-flashcard-clear-filters"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            )}
          </div>

          {filtrosAtivos && (
            <div className="admin-flashcard-results" role="status">
              <strong>{cardsFiltrados.length}</strong>{' '}
              {cardsFiltrados.length === 1 ? 'flashcard encontrado' : 'flashcards encontrados'}
            </div>
          )}

          <div className="admin-flashcard-list">
            {!cards.length ? (
              <div className="admin-flashcard-empty">
                <strong>Nenhum flashcard cadastrado</strong>
                <span>Use o botão + para criar o primeiro flashcard.</span>
              </div>
            ) : !cardsFiltrados.length ? (
              <div className="admin-flashcard-empty">
                <strong>Nenhum flashcard encontrado</strong>
                <span>Tente mudar os filtros ou o termo da busca.</span>
                <button
                  type="button"
                  className="admin-flashcard-empty-action"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
            cardsOrganizados.map(([materia, conteudos]) => {
              const totalMateria = Array.from(conteudos.values()).reduce(
                (total, lista) => total + lista.length,
                0
              );

              return (
                <section
                  className="admin-flashcard-materia-section"
                  key={materia}
                >
                  <div className="admin-flashcard-materia-header">
                    <div>
                      <span className="admin-flashcard-section-eyebrow">
                        MATÉRIA
                      </span>
                      <h2>{materia}</h2>
                    </div>
                    <span className="admin-flashcard-section-count">
                      {totalMateria} {totalMateria === 1 ? 'card' : 'cards'}
                    </span>
                  </div>

                  {Array.from(conteudos.entries()).map(
                    ([conteudo, cardsDoConteudo]) => (
                      <div
                        className="admin-flashcard-content-section"
                        key={`${materia}-${conteudo}`}
                      >
                        <div className="admin-flashcard-content-header">
                          <h3>{conteudo}</h3>
                          <span>
                            {cardsDoConteudo.length}{' '}
                            {cardsDoConteudo.length === 1 ? 'card' : 'cards'}
                          </span>
                        </div>

                        <div className="admin-flashcard-grid">
                          {cardsDoConteudo.map((card) => (
                            <div
                              className="admin-flashcard-item"
                              key={card.id}
                              onClick={() => openEdit(card)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  openEdit(card);
                                }
                              }}
                              aria-label={`Editar flashcard: ${card.primario}`}
                            >
                              <strong>{card.primario}</strong>

                              <span
                                className={
                                  card.conteudo
                                    ? 'admin-flashcard-conteudo'
                                    : 'admin-flashcard-conteudo pendente'
                                }
                              >
                                {card.conteudo || 'Conteúdo não definido'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </section>
              );
            })
            )}
          </div>
        </>
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
