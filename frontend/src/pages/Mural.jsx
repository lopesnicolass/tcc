import { useEffect, useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MATERIAS = [
  'Português',
  'Matemática',
  'História',
  'Geografia',
  'Ciências'
];

const MAX_CHARS = 200;

const COLOR_CLASS = {
  Português: 'postit-portugues',
  Matemática: 'postit-matematica',
  História: 'postit-historia',
  Geografia: 'postit-geografia',
  Ciências: 'postit-ciencias',
};

const TILTS = [-3, 2, -1.5, 3, -2, 1.5];


// =====================================================
// PEGAR USUÁRIO LOGADO
// =====================================================

function obterUsuarioId() {

  const usuarioSalvo =
    localStorage.getItem('etecamp_usuario');

  if (!usuarioSalvo) {
    console.error(
      'Usuário não encontrado no localStorage.'
    );

    return null;
  }

  try {

    const usuario =
      JSON.parse(usuarioSalvo);

    console.log(
      'Usuário logado no Mural:',
      usuario
    );

    if (usuario.id) {
      return Number(usuario.id);
    }

    if (usuario.usuarioId) {
      return Number(usuario.usuarioId);
    }

    console.error(
      'ID do usuário não encontrado:',
      usuario
    );

    return null;

  } catch (erro) {

    console.error(
      'Erro ao ler usuário:',
      erro
    );

    return null;
  }
}


// =====================================================
// COMPONENTE
// =====================================================

export default function Mural() {

  const { addXP } =
    useGamification();


  // ===================================================
  // ESTADOS
  // ===================================================

  const [postits, setPostits] =
    useState([]);

  const [filtro, setFiltro] =
    useState('Todas');

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');


  // ===================================================
  // MODAL ADICIONAR
  // ===================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [newText, setNewText] =
    useState('');

  const [newMateria, setNewMateria] =
    useState(MATERIAS[0]);


  // ===================================================
  // MODAL EDITAR
  // ===================================================

  const [editingPostit, setEditingPostit] =
    useState(null);

  const [editText, setEditText] =
    useState('');

  const [editMateria, setEditMateria] =
    useState(MATERIAS[0]);


  // ===================================================
  // CARREGAR POST-ITS
  // ===================================================

  useEffect(() => {

    carregarPostits();

  }, []);


  async function carregarPostits() {

    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {

      setErro(
        'Não foi possível identificar o usuário logado.'
      );

      setCarregando(false);

      return;
    }

    try {

      setCarregando(true);

      setErro('');

      const resposta =
        await fetch(
          `${API_URL}/mural/${usuarioId}`
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          'Erro ao carregar post-its.'
        );
      }

      setPostits(
        dados.postits || []
      );

    } catch (error) {

      console.error(error);

      setErro(
        error.message ||
        'Não foi possível carregar o mural.'
      );

    } finally {

      setCarregando(false);

    }
  }


  // ===================================================
  // ABRIR MODAL ADICIONAR
  // ===================================================

  function openAddModal() {

    setNewText('');

    setNewMateria(
      MATERIAS[0]
    );

    setShowAddModal(true);
  }


  // ===================================================
  // ADICIONAR POST-IT
  // ===================================================

  async function handleAdd(e) {

    e.preventDefault();

    if (!newText.trim()) {
      return;
    }

    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {

      alert(
        'Não foi possível identificar o usuário logado.'
      );

      return;
    }

    try {

      const resposta =
        await fetch(
          `${API_URL}/mural/${usuarioId}`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              materia:
                newMateria,

              texto:
                newText.trim()
            })
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          'Erro ao criar post-it.'
        );
      }

      // Adiciona na tela
      setPostits(
        (prev) => [
          dados.postit,
          ...prev
        ]
      );

      // XP
      addXP(
        10,
        'novo post-it'
      );

      // Fecha modal
      setShowAddModal(false);

      setNewText('');

    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        'Não foi possível criar o post-it.'
      );
    }
  }


  // ===================================================
  // ABRIR MODAL DE EDIÇÃO
  // ===================================================

  function openEditModal(postit) {

    setEditingPostit(
      postit
    );

    setEditText(
      postit.texto
    );

    setEditMateria(
      postit.materia
    );
  }


  // ===================================================
  // SALVAR EDIÇÃO
  // ===================================================

  async function handleSaveEdit(e) {

    e.preventDefault();

    if (!editText.trim()) {
      return;
    }

    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {

      alert(
        'Não foi possível identificar o usuário logado.'
      );

      return;
    }

    try {

      const resposta =
        await fetch(
          `${API_URL}/mural/${usuarioId}/${editingPostit.id}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              materia:
                editMateria,

              texto:
                editText.trim()
            })
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          'Erro ao atualizar post-it.'
        );
      }

      // Atualiza na tela
      setPostits(
        (prev) =>
          prev.map(
            (postit) =>
              postit.id ===
              editingPostit.id
                ? {
                    ...postit,

                    materia:
                      editMateria,

                    texto:
                      editText.trim()
                  }
                : postit
          )
      );

      setEditingPostit(
        null
      );

    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        'Não foi possível atualizar o post-it.'
      );
    }
  }


  // ===================================================
  // EXCLUIR POST-IT
  // ===================================================

  async function handleDelete() {

    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {

      alert(
        'Não foi possível identificar o usuário logado.'
      );

      return;
    }

    const confirmar =
      window.confirm(
        'Tem certeza que deseja excluir este post-it?'
      );

    if (!confirmar) {
      return;
    }

    try {

      const resposta =
        await fetch(
          `${API_URL}/mural/${usuarioId}/${editingPostit.id}`,
          {
            method: 'DELETE'
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          'Erro ao excluir post-it.'
        );
      }

      setPostits(
        (prev) =>
          prev.filter(
            (postit) =>
              postit.id !==
              editingPostit.id
          )
      );

      setEditingPostit(
        null
      );

    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        'Não foi possível excluir o post-it.'
      );
    }
  }


  // ===================================================
  // FILTRO
  // ===================================================

  const visiveis =
    filtro === 'Todas'
      ? postits
      : postits.filter(
          (postit) =>
            postit.materia ===
            filtro
        );


  // ===================================================
  // CARREGANDO
  // ===================================================

  if (carregando) {

    return (
      <div>

        <div className="mural-header">

          <h1>
            Mural de Post-its
          </h1>

        </div>

        <div className="mural-empty">

          Carregando seus post-its...

        </div>

      </div>
    );
  }


  // ===================================================
  // TELA
  // ===================================================

  return (

    <div>

      {/* ============================================= */}
      {/* CABEÇALHO */}
      {/* ============================================= */}

      <div className="mural-header">

        <h1>
          Mural de Post-its
        </h1>

        <div className="mural-actions">

          <button
            className="mural-btn primary"
            onClick={
              openAddModal
            }
          >
            + Adicionar post-it
          </button>

          <select
            className="mural-filter-select"
            value={filtro}
            onChange={(e) =>
              setFiltro(
                e.target.value
              )
            }
          >

            <option value="Todas">
              Filtrar por matéria
            </option>

            {MATERIAS.map(
              (materia) => (

                <option
                  key={materia}
                  value={materia}
                >
                  {materia}
                </option>

              )
            )}

          </select>

        </div>

      </div>


      {/* ============================================= */}
      {/* ERRO */}
      {/* ============================================= */}

      {erro && (

        <div
          className="mural-empty"
          style={{
            color: '#c0392b',
            marginBottom: '20px'
          }}
        >
          {erro}
        </div>

      )}


      {/* ============================================= */}
      {/* POST-ITS */}
      {/* ============================================= */}

      {visiveis.length === 0 ? (

        <div className="mural-empty">

          Nenhum post-it nessa matéria ainda.

        </div>

      ) : (

        <div className="mural-grid">

          {visiveis.map(
            (postit, index) => (

              <div
                key={postit.id}

                className={`postit ${
                  COLOR_CLASS[
                    postit.materia
                  ] || ''
                }`}

                style={{
                  '--tilt':
                    `${TILTS[
                      index %
                      TILTS.length
                    ]}deg`
                }}

                onClick={() =>
                  openEditModal(
                    postit
                  )
                }
              >

                <span className="postit-tag">

                  {postit.materia}

                </span>

                <p className="postit-text">

                  {postit.texto}

                </p>

              </div>

            )
          )}

        </div>

      )}


      {/* ============================================= */}
      {/* MODAL ADICIONAR */}
      {/* ============================================= */}

      {showAddModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddModal(false)
          }
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Adicione um novo post-it ao seu mural
              </h2>

              <p>
                Post-its te ajudam a memorizar
                o conteúdo mais rápido e fácil
              </p>

            </div>


            <form
              onSubmit={
                handleAdd
              }
            >

              <div className="modal-body">

                <div className="modal-textarea-wrap">

                  <textarea
                    className="modal-textarea"
                    placeholder="Faça sua anotação..."
                    maxLength={
                      MAX_CHARS
                    }
                    value={
                      newText
                    }
                    onChange={(e) =>
                      setNewText(
                        e.target.value
                      )
                    }
                    autoFocus
                  />

                  <span className="modal-charcount">

                    {newText.length}/
                    {MAX_CHARS}

                  </span>

                </div>


                <div className="modal-materia-list">

                  <span className="modal-materia-label">

                    Matéria

                  </span>

                  {MATERIAS.map(
                    (materia) => (

                      <button
                        type="button"
                        key={materia}
                        className={`materia-pill ${
                          newMateria ===
                          materia
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          setNewMateria(
                            materia
                          )
                        }
                      >
                        {materia}
                      </button>

                    )
                  )}

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={() =>
                    setShowAddModal(
                      false
                    )
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


      {/* ============================================= */}
      {/* MODAL EDITAR */}
      {/* ============================================= */}

      {editingPostit && (

        <div
          className="modal-overlay"
          onClick={() =>
            setEditingPostit(
              null
            )
          }
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Post-it
              </h2>

            </div>


            <form
              onSubmit={
                handleSaveEdit
              }
            >

              <div className="modal-body">

                <div className="modal-textarea-wrap">

                  <textarea
                    className="modal-textarea"
                    maxLength={
                      MAX_CHARS
                    }
                    value={
                      editText
                    }
                    onChange={(e) =>
                      setEditText(
                        e.target.value
                      )
                    }
                    autoFocus
                  />

                  <span className="modal-charcount">

                    {editText.length}/
                    {MAX_CHARS}

                  </span>

                </div>


                <div className="modal-materia-list">

                  <span className="modal-materia-label">

                    Matéria

                  </span>

                  {MATERIAS.map(
                    (materia) => (

                      <button
                        type="button"
                        key={materia}
                        className={`materia-pill ${
                          editMateria ===
                          materia
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          setEditMateria(
                            materia
                          )
                        }
                      >
                        {materia}
                      </button>

                    )
                  )}

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={() =>
                    setEditingPostit(
                      null
                    )
                  }
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
              onClick={
                handleDelete
              }
            >
              Excluir
            </button>

          </div>

        </div>

      )}

    </div>
  );
}