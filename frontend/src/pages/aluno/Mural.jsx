import '../../styles/aluno/Mural.css';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGamification } from '../../context/GamificationContext.jsx';
import { request } from '../../services/api.js';

const MATERIAS = [
  'Português',
  'Matemática',
  'História',
  'Geografia',
  'Ciências'
];

const MAX_CHARS = 200;

// Ajusta apenas a fonte quando o texto ultrapassa a área disponível.
// Mede o conteúdo real, incluindo palavras longas e quebras de linha.
function PostitText({ texto }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      // Começa sempre no tamanho original para textos curtos.
      let low = 9;
      let high = 22;
      element.style.fontSize = `${high}px`;
      const fits = () => element.scrollHeight <= element.clientHeight + 1 &&
        element.scrollWidth <= element.clientWidth + 1;
      if (fits()) return;

      for (let i = 0; i < 12; i++) {
        const mid = (low + high) / 2;
        element.style.fontSize = `${mid}px`;
        if (fits()) low = mid;
        else high = mid;
      }
      element.style.fontSize = `${Math.floor(low * 10) / 10}px`;
    };

    const observer = new ResizeObserver(fit);
    if (element.parentElement) observer.observe(element.parentElement);
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    fit();
    return () => observer.disconnect();
  }, [texto]);

  return <p ref={ref} className="postit-text">{texto}</p>;
}



const COLOR_CLASS = {
  Português: 'postit-portugues',
  'Língua Portuguesa': 'postit-portugues',
  Matemática: 'postit-matematica',
  História: 'postit-historia',
  Geografia: 'postit-geografia',
  Ciências: 'postit-ciencias',
  'Ciências da Natureza': 'postit-ciencias',
};

const MATERIA_ALIASES = {
  'Língua Portuguesa': 'Português',
  'Ciências da Natureza': 'Ciências',
};

function normalizarMateria(materia) {
  return MATERIA_ALIASES[materia] || materia;
}

function materiaPillClass(materia) {
  const slug = normalizarMateria(materia)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');

  return `materia-pill-${slug}`;
}

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

  const [busca, setBusca] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');


  // ===================================================
  // MODAL ADICIONAR
  // ===================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [createStep, setCreateStep] = useState('choose');

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

      const dados =
        await request(
          `/mural/${usuarioId}`,
          {},
          'Erro ao carregar post-its.'
        );

      setPostits(
        (dados.postits || []).map(
          (postit) => ({
            ...postit,
            materia:
              normalizarMateria(
                postit.materia
              ),
          })
        )
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
    setCreateStep('choose');

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

      const dados =
        await request(
          `/mural/${usuarioId}`,
          {
            method: 'POST',

            body: JSON.stringify({
              materia:
                newMateria,

              texto:
                newText.trim()
            })
          },
          'Erro ao criar post-it.'
        );

      setPostits(
        (prev) => [
          {
            ...dados.postit,
            materia:
              normalizarMateria(
                dados.postit?.materia
              ),
          },
          ...prev
        ]
      );

      addXP(
        10,
        'novo post-it'
      );

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
      normalizarMateria(
        postit.materia
      )
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

      await request(
        `/mural/${usuarioId}/${editingPostit.id}`,
        {
          method: 'PUT',

          body: JSON.stringify({
            materia:
              editMateria,

            texto:
              editText.trim()
          })
        },
        'Erro ao atualizar post-it.'
      );

      setPostits(
        (prev) =>
          prev.map(
            (postit) =>
              postit.id ===
              editingPostit.id
                ? {
                    ...postit,

                    materia:
                      normalizarMateria(
                        editMateria
                      ),

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

      await request(
        `/mural/${usuarioId}/${editingPostit.id}`,
        {
          method: 'DELETE'
        },
        'Erro ao excluir post-it.'
      );

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

  const textoBusca = busca.trim().toLowerCase();

  const editAreaRef = useRef(null);
  useLayoutEffect(() => {
    if (!editingPostit || !editAreaRef.current) return;
    const area = editAreaRef.current;
    const fit = () => {
      // Mantém a caligrafia grande; reduz somente se o texto não couber.
      let size = 30;
      area.style.fontSize = `${size}px`;
      while (size > 14 && (area.scrollHeight > area.clientHeight + 2 || area.scrollWidth > area.clientWidth + 2)) {
        size -= 1;
        area.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    document.fonts?.ready?.then(fit);
    return () => observer.disconnect();
  }, [editText, editingPostit]);

  const visiveis = postits.filter((postit) => {
    const passaMateria =
      filtro === 'Todas' ||
      normalizarMateria(postit.materia) === filtro;

    const passaBusca =
      !textoBusca ||
      String(postit.texto || '')
        .toLowerCase()
        .includes(textoBusca);

    return passaMateria && passaBusca;
  });


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

    <div className="mural-page page-shell">

      {/* ============================================= */}
      {/* CABEÇALHO */}
      {/* ============================================= */}

      <div className="mural-hero">

        <div className="mural-hero-content">

          <span className="mural-hero-eyebrow">
            SEU ESPAÇO DE ANOTAÇÕES
          </span>

          <h1>
            Mural de Post-its
          </h1>

          <p>
            Organize suas anotações por matéria
            e deixe seus principais lembretes
            sempre à vista.
          </p>

        </div>

      </div>


      {/* ============================================= */}
      {/* FILTROS + PESQUISA */}
      {/* ============================================= */}

      <div className="mural-toolbar">

        <div className="materia-tabs">

        <button
          type="button"
          className={
            `materia-tab ${
              filtro === 'Todas'
                ? 'active'
                : ''
            }`
          }
          onClick={() =>
            setFiltro('Todas')
          }
        >

          Todas

          <span className="materia-tab-count materia-tab-count-todas">
            {postits.length}
          </span>

        </button>


        {MATERIAS.map(
          (materia) => (

            <button
              type="button"
              key={materia}
              className={
                `materia-tab ${
                  filtro === materia
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                setFiltro(materia)
              }
            >

              {materia}

              <span className={`materia-tab-count ${materiaPillClass(materia).replace('materia-pill-', 'materia-tab-count-')}`}>

                {
                  postits.filter(
                    (postit) =>
                      normalizarMateria(
                        postit.materia
                      ) === materia
                  ).length
                }

              </span>

            </button>

          )
        )}

        </div>

        <div className="mural-toolbar-top">

          <label className="mural-search" aria-label="Pesquisar post-it">

            <span className="mural-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>

            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar post-it..."
            />

            {busca && (
              <button
                type="button"
                className="mural-search-clear"
                onClick={() => setBusca('')}
                aria-label="Limpar pesquisa"
              >
                ×
              </button>
            )}

          </label>

          <button type="button" className="mural-add-inline" onClick={openAddModal}>
            <span aria-hidden="true">+</span> Adicionar post-it
          </button>

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
            (postit, index) => {

              const materiaNormalizada =
                normalizarMateria(
                  postit.materia
                );

              return (
                <div
                  key={postit.id}

                  className={
                    `postit ${
                      COLOR_CLASS[
                        materiaNormalizada
                      ] ||
                      COLOR_CLASS[
                        postit.materia
                      ] ||
                      ''
                    }`
                  }

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

                    {materiaNormalizada}

                  </span>

                  <PostitText texto={postit.texto} />

                </div>
              );
            }
          )}

        </div>

      )}


      {/* ============================================= */}
      {/* MODAL ADICIONAR */}
      {/* ============================================= */}

      {showAddModal && (
        <div className="modal-overlay mural-create-overlay" onClick={() => setShowAddModal(false)}>
          <div className="mural-create-flow" role="dialog" aria-modal="true" aria-label="Adicionar post-it" onClick={(e) => e.stopPropagation()}>
            {createStep === 'choose' ? (
              <section className="mural-picker">
                <button type="button" className="mural-picker-close" aria-label="Fechar" onClick={() => setShowAddModal(false)}>×</button>
                <span className="mural-picker-eyebrow">SEU NOVO LEMBRETE</span>
                <h2>Escolha seu post-it</h2>
                <p>Selecione uma cor para começar a escrever.</p>
                <div className="mural-picker-grid">
                  {MATERIAS.map((materia) => (
                    <button key={materia} type="button" className={`mural-picker-option ${COLOR_CLASS[materia] || 'postit-portugues'}`}
                      onClick={() => { setNewMateria(materia); setCreateStep('write'); }} aria-label={`Escolher post-it de ${materia}`}>
                      <span className="mural-picker-tape" aria-hidden="true" />
                      <span className="mural-picker-option-name">{materia}</span>
                      <span className="mural-picker-option-plus" aria-hidden="true">+</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <form className="mural-create-form" onSubmit={handleAdd}>
                <div className="mural-create-toolbar">
                  <button type="button" className="mural-create-back" onClick={() => setCreateStep('choose')}>← Trocar cor</button>
                  <span>{newMateria}</span>
                </div>
                <div className={`postit mural-create-paper ${COLOR_CLASS[newMateria] || 'postit-portugues'}`}>
                  <button type="button" className="mural-edit-close" aria-label="Fechar criação" onClick={() => setShowAddModal(false)}>×</button>
                  <textarea className="mural-create-text" aria-label="Escreva sua anotação"
                    placeholder="Escreva sua anotação..." maxLength={MAX_CHARS}
                    value={newText} onChange={(e) => setNewText(e.target.value)} autoFocus />
                  <div className="mural-create-bottom">
                    <span className="mural-create-count">{newText.length}/{MAX_CHARS}</span>
                    <button className="mural-create-save" type="submit" disabled={!newText.trim()}>✓ Criar post-it</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {editingPostit && (
        <div className="modal-overlay mural-edit-overlay" onClick={() => setEditingPostit(null)}>
          <form className="mural-edit-form" onSubmit={handleSaveEdit} role="dialog" aria-modal="true" aria-label="Editar post-it" onClick={(e) => e.stopPropagation()}>
            <div className={`postit mural-edit-paper ${COLOR_CLASS[editingPostit.materia] || 'postit-portugues'}`}>
              <button type="button" className="mural-edit-close" aria-label="Fechar edição" title="Fechar" onClick={() => setEditingPostit(null)}>×</button>
              <textarea
                className="mural-edit-text"
                ref={editAreaRef}
                aria-label="Editar anotação"
                maxLength={MAX_CHARS}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />
              <div className="mural-edit-bottom">
                <button type="button" className="mural-edit-delete" onClick={handleDelete}><span aria-hidden="true">✕</span> Excluir</button>
                <button type="submit" className="mural-edit-save"><span aria-hidden="true">✓</span> Salvar</button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}