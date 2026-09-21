import { useEffect, useMemo, useState } from 'react';
import '../../styles/adm/EditorConteudo.css';

import { request } from './editor-conteudo/api.js';
import { Icon } from './editor-conteudo/icons.jsx';
import { campo } from './editor-conteudo/Campo.jsx';

import {
  TIPOS_BLOCO,
  normalizarBloco,
  dadosIniciais,
  nomeTipo,
} from './editor-conteudo/blocoHelpers.js';

import { BlocoFormulario } from './editor-conteudo/BlocoFormulario.jsx';
import { previewBloco } from './editor-conteudo/BlocoPreview.jsx';

export default function EditorConteudo({
  topicoId,
  topicoNome,
  aoVoltar,
}) {
  const [pagina, setPagina] = useState(null);
  const [blocos, setBlocos] = useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvandoPagina, setSalvandoPagina] =
    useState(false);

  const [salvandoBloco, setSalvandoBloco] =
    useState(false);

  const [carregandoRelacionados, setCarregandoRelacionados] =
    useState(false);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [titulo, setTitulo] =
    useState(topicoNome || '');

  const [descricao, setDescricao] =
    useState('');

  const [publicado, setPublicado] =
    useState(false);

  const [tipoNovoBloco, setTipoNovoBloco] =
    useState('texto');

  const [blocoEditando, setBlocoEditando] =
    useState(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [flashcards, setFlashcards] =
    useState([]);

  const [questoes, setQuestoes] =
    useState([]);

  const [simulados, setSimulados] =
    useState([]);

  const [buscaRelacionados, setBuscaRelacionados] =
    useState('');

  const blocosOrdenados = useMemo(() => {
    return [...blocos].sort(
      (a, b) =>
        Number(a.ordem || 0) -
        Number(b.ordem || 0)
    );
  }, [blocos]);

  async function carregarPagina() {
    try {
      setCarregando(true);
      setErro('');

      const dados = await request(
        `/paginas-conteudo/topico/${topicoId}`
      );

      if (!dados?.pagina) {
        setPagina(null);
        setTitulo(topicoNome || '');
        setDescricao('');
        setPublicado(false);
        setBlocos([]);
        return;
      }

      setPagina(dados.pagina);

      setTitulo(
        dados.pagina.titulo ||
          topicoNome ||
          ''
      );

      setDescricao(
        dados.pagina.descricao || ''
      );

      setPublicado(
        Number(dados.pagina.publicado) === 1 ||
          dados.pagina.publicado === true
      );

      const lista = Array.isArray(
        dados.blocos
      )
        ? dados.blocos
        : [];

      setBlocos(
        lista.map((bloco, index) =>
          normalizarBloco(
            bloco,
            index + 1
          )
        )
      );
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível carregar a página.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarRelacionados() {
    try {
      setCarregandoRelacionados(true);

      const [
        dadosFlashcards,
        dadosQuestoes,
        dadosSimulados,
      ] = await Promise.all([
        request('/flashcards'),
        request('/questoes'),
        request('/simulados'),
      ]);

      setFlashcards(
        Array.isArray(dadosFlashcards)
          ? dadosFlashcards
          : dadosFlashcards.flashcards ||
              []
      );

      setQuestoes(
        Array.isArray(dadosQuestoes)
          ? dadosQuestoes
          : dadosQuestoes.questoes ||
              []
      );

      setSimulados(
        Array.isArray(dadosSimulados)
          ? dadosSimulados
          : dadosSimulados.simulados ||
              []
      );
    } catch (error) {
      console.error(
        'Erro ao carregar conteúdos relacionados:',
        error
      );

      setErro(
        error.message ||
          'Não foi possível carregar os itens relacionados.'
      );
    } finally {
      setCarregandoRelacionados(
        false
      );
    }
  }

  useEffect(() => {
    if (!topicoId) return;

    carregarPagina();
    carregarRelacionados();
  }, [topicoId]);

  function mostrarSucesso(mensagem) {
    setSucesso(mensagem);

    window.setTimeout(() => {
      setSucesso('');
    }, 3000);
  }

  async function salvarPagina() {
    try {
      setSalvandoPagina(true);
      setErro('');

      const payload = {
        topicoId: Number(topicoId),
        titulo:
          titulo.trim() ||
          topicoNome ||
          'Conteúdo',
        descricao: descricao.trim(),
        publicado: publicado ? 1 : 0,
      };

      if (!pagina?.id) {
        const dados = await request(
          '/paginas-conteudo',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );

        const paginaSalva =
          dados.pagina || dados.data || dados;

        setPagina(paginaSalva);
        setPublicado(
          Number(paginaSalva?.publicado) === 1 ||
            paginaSalva?.publicado === true
        );

        mostrarSucesso(
          'Página criada com sucesso.'
        );
      } else {
        const dados = await request(
          `/paginas-conteudo/${pagina.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );

        const paginaSalva =
          dados.pagina || dados.data || dados;

        setPagina((anterior) => ({
          ...anterior,
          ...paginaSalva,
          id: pagina.id,
        }));
        setPublicado(
          Number(paginaSalva?.publicado) === 1 ||
            paginaSalva?.publicado === true
        );

        mostrarSucesso(
          'Página salva com sucesso.'
        );
      }
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível salvar a página.'
      );
    } finally {
      setSalvandoPagina(false);
    }
  }

  async function garantirPagina() {
    if (pagina?.id) {
      return pagina;
    }

    const dados = await request(
      '/paginas-conteudo',
      {
        method: 'POST',
        body: JSON.stringify({
          topicoId: Number(topicoId),
          titulo:
            titulo.trim() ||
            topicoNome ||
            'Conteúdo',
          descricao: descricao.trim(),
          publicado: publicado ? 1 : 0,
        }),
      }
    );

    const criada =
      dados.pagina ||
      dados.data ||
      dados;

    setPagina(criada);

    return criada;
  }

  function abrirNovoBloco() {
    setBuscaRelacionados('');

    setBlocoEditando({
      novo: true,
      tipo: tipoNovoBloco,
      ordem: blocos.length + 1,
      dados:
        dadosIniciais(
          tipoNovoBloco
        ),
    });

    setModalAberto(true);
    setErro('');
  }

  function abrirEditarBloco(bloco) {
    setBuscaRelacionados('');

    setBlocoEditando({
      ...bloco,
      novo: false,
      dados: {
        ...(bloco.dados || {}),
      },
    });

    setModalAberto(true);
    setErro('');
  }

  function fecharModal() {
    if (salvandoBloco) return;

    setModalAberto(false);
    setBlocoEditando(null);
  }

  function atualizarDado(
    chave,
    valor
  ) {
    setBlocoEditando((anterior) => ({
      ...anterior,
      dados: {
        ...(anterior?.dados || {}),
        [chave]: valor,
      },
    }));
  }

  function atualizarItem(
    indice,
    valor
  ) {
    setBlocoEditando((anterior) => {
      const itens = Array.isArray(
        anterior?.dados?.itens
      )
        ? [...anterior.dados.itens]
        : [];

      itens[indice] = valor;

      return {
        ...anterior,
        dados: {
          ...(anterior.dados || {}),
          itens,
        },
      };
    });
  }

  function adicionarItem() {
    setBlocoEditando((anterior) => {
      const itens = Array.isArray(
        anterior?.dados?.itens
      )
        ? [...anterior.dados.itens]
        : [];

      itens.push('');

      return {
        ...anterior,
        dados: {
          ...(anterior.dados || {}),
          itens,
        },
      };
    });
  }

  function removerItem(indice) {
    setBlocoEditando((anterior) => {
      const itens = Array.isArray(
        anterior?.dados?.itens
      )
        ? [...anterior.dados.itens]
        : [];

      if (itens.length <= 1) {
        itens[0] = '';
      } else {
        itens.splice(indice, 1);
      }

      return {
        ...anterior,
        dados: {
          ...(anterior.dados || {}),
          itens,
        },
      };
    });
  }

  function alternarSelecionado(
    chave,
    id
  ) {
    setBlocoEditando((anterior) => {
      const atuais = Array.isArray(
        anterior?.dados?.[chave]
      )
        ? [
            ...anterior.dados[chave],
          ]
        : [];

      const numeroId = Number(id);

      const existe =
        atuais.some(
          (item) =>
            Number(item) ===
            numeroId
        );

      const atualizados = existe
        ? atuais.filter(
            (item) =>
              Number(item) !==
              numeroId
          )
        : [
            ...atuais,
            numeroId,
          ];

      return {
        ...anterior,
        dados: {
          ...(anterior.dados || {}),
          [chave]: atualizados,
        },
      };
    });
  }

  async function salvarBloco() {
    if (!blocoEditando) return;

    try {
      setSalvandoBloco(true);
      setErro('');

      const paginaAtual =
        await garantirPagina();

      const payload = {
        paginaId: paginaAtual.id,
        tipo: blocoEditando.tipo,
        ordem:
          Number(blocoEditando.ordem) ||
          blocos.length + 1,
        dados:
          blocoEditando.dados || {},
      };

      if (blocoEditando.novo) {
        const resposta =
          await request(
            `/paginas-conteudo/${paginaAtual.id}/blocos`,
            {
              method: 'POST',
              body: JSON.stringify(
                payload
              ),
            }
          );

        const blocoCriado =
          resposta.bloco ||
          resposta.data ||
          resposta;

        setBlocos((anteriores) => [
          ...anteriores,
          normalizarBloco(
            blocoCriado,
            anteriores.length + 1
          ),
        ]);

        mostrarSucesso(
          'Bloco adicionado.'
        );
      } else {
        const resposta =
          await request(
            `/paginas-conteudo/blocos/${blocoEditando.id}`,
            {
              method: 'PUT',
              body: JSON.stringify(
                payload
              ),
            }
          );

        const blocoAtualizado =
          resposta.bloco ||
          resposta.data ||
          resposta;

        setBlocos((anteriores) =>
          anteriores.map(
            (bloco) =>
              bloco.id ===
              blocoEditando.id
                ? normalizarBloco(
                    {
                      ...bloco,
                      ...blocoAtualizado,
                      dados:
                        blocoAtualizado.dados ||
                        blocoEditando.dados,
                    },
                    blocoEditando.ordem
                  )
                : bloco
          )
        );

        mostrarSucesso(
          'Bloco atualizado.'
        );
      }

      fecharModal();
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível salvar o bloco.'
      );
    } finally {
      setSalvandoBloco(false);
    }
  }

  async function excluirBloco(bloco) {
    if (!bloco.id) return;

    const confirmar =
      window.confirm(
        `Excluir o bloco "${nomeTipo(
          bloco.tipo
        )}"?`
      );

    if (!confirmar) return;

    try {
      setErro('');

      await request(
        `/paginas-conteudo/blocos/${bloco.id}`,
        {
          method: 'DELETE',
        }
      );

      setBlocos(
        blocosOrdenados
          .filter(
            (item) =>
              item.id !== bloco.id
          )
          .map((item, index) => ({
            ...item,
            ordem: index + 1,
          }))
      );

      mostrarSucesso(
        'Bloco excluído.'
      );
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível excluir o bloco.'
      );
    }
  }

  async function moverBloco(
    bloco,
    direcao
  ) {
    if (!pagina?.id) return;

    const lista = [
      ...blocosOrdenados,
    ];

    const indice =
      lista.findIndex(
        (item) =>
          item.id === bloco.id
      );

    if (indice < 0) return;

    const destino =
      direcao === 'cima'
        ? indice - 1
        : indice + 1;

    if (
      destino < 0 ||
      destino >= lista.length
    ) {
      return;
    }

    [
      lista[indice],
      lista[destino],
    ] = [
      lista[destino],
      lista[indice],
    ];

    const reordenados =
      lista.map(
        (item, index) => ({
          ...item,
          ordem: index + 1,
        })
      );

    try {
      setErro('');

      for (
        const item
        of reordenados
      ) {
        await request(
          `/paginas-conteudo/blocos/${item.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              paginaId: pagina.id,
              tipo: item.tipo,
              ordem: item.ordem,
              dados:
                item.dados || {},
            }),
          }
        );
      }

      setBlocos(
        reordenados
      );

      mostrarSucesso(
        'Ordem atualizada.'
      );
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível reorganizar os blocos.'
      );
    }
  }

  if (carregando) {
    return (
      <div className="admin-page">
        <div className="editor-loading">
          <strong>
            Carregando conteúdo...
          </strong>

          <span>
            Buscando a página deste tópico.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      <header className="page-header editor-page-header">
        <div>
          <button
            type="button"
            className="editor-back-button"
            onClick={aoVoltar}
          >
            <Icon
              name="arrowLeft"
              size={17}
            />

            Voltar aos tópicos
          </button>

          <span className="admin-section-kicker">
            CMS / CONTEÚDO
          </span>

          <h1>
            {topicoNome}
          </h1>

          <p>
            Monte a página de conteúdo que
            será exibida aos alunos.
          </p>
        </div>

        <div className="editor-header-actions">
          <span
            className={`editor-publication-status ${
              publicado ? 'published' : 'draft'
            }`}
          >
            <span className="editor-publication-dot" />
            {publicado ? 'Publicado' : 'Rascunho'}
          </span>

          <button
            type="button"
            className={
              publicado
                ? 'editor-secondary-button'
                : 'editor-primary-button'
            }
            onClick={async () => {
              const proximoStatus = !publicado;
              setPublicado(proximoStatus);

              try {
                setSalvandoPagina(true);
                setErro('');

                if (!pagina?.id) {
                  const dados = await request(
                    '/paginas-conteudo',
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        topicoId: Number(topicoId),
                        titulo: titulo.trim() || topicoNome || 'Conteúdo',
                        descricao: descricao.trim(),
                        publicado: proximoStatus ? 1 : 0,
                      }),
                    }
                  );
                  const criada = dados.pagina || dados.data || dados;
                  setPagina(criada);
                } else {
                  const dados = await request(
                    `/paginas-conteudo/${pagina.id}`,
                    {
                      method: 'PUT',
                      body: JSON.stringify({
                        titulo: titulo.trim() || topicoNome || 'Conteúdo',
                        descricao: descricao.trim(),
                        publicado: proximoStatus ? 1 : 0,
                      }),
                    }
                  );
                  setPagina((anterior) => ({
                    ...anterior,
                    ...(dados.pagina || dados.data || dados),
                  }));
                }

                mostrarSucesso(
                  proximoStatus
                    ? 'Conteúdo publicado para os alunos.'
                    : 'Conteúdo retirado da publicação.'
                );
              } catch (error) {
                setPublicado(!proximoStatus);
                setErro(
                  error.message ||
                    'Não foi possível alterar a publicação.'
                );
              } finally {
                setSalvandoPagina(false);
              }
            }}
            disabled={salvandoPagina}
          >
            {publicado ? 'Despublicar' : 'Publicar'}
          </button>

          <button
            type="button"
            className="editor-primary-button"
            onClick={salvarPagina}
            disabled={salvandoPagina}
          >
            <Icon
              name="save"
              size={17}
            />

            {salvandoPagina
              ? 'Salvando...'
              : 'Salvar página'}
          </button>
        </div>
      </header>

      {sucesso && (
        <div className="editor-success">
          <Icon
            name="check"
            size={16}
          />

          {sucesso}
        </div>
      )}

      {erro && (
        <div className="editor-error">
          <span>{erro}</span>

          <button
            type="button"
            onClick={() =>
              setErro('')
            }
          >
            <Icon
              name="close"
              size={16}
            />
          </button>
        </div>
      )}

      <div className="editor-layout">

        <main className="editor-main">

          <section className="panel-card editor-panel">
            <div className="editor-panel-title">
              <span className="editor-panel-kicker">
                CONFIGURAÇÃO
              </span>

              <h2>
                Página do conteúdo
              </h2>
            </div>

            <div className="editor-page-fields">
              {campo(
                'Título',
                titulo,
                setTitulo,
                {
                  placeholder:
                    topicoNome,
                }
              )}

              {campo(
                'Descrição',
                descricao,
                setDescricao,
                {
                  placeholder:
                    'Breve introdução para o aluno...',
                  multiline: true,
                  rows: 4,
                }
              )}
            </div>
          </section>

          <section className="panel-card editor-panel">

            <div className="editor-panel-title blocks-title">
              <div>
                <span className="editor-panel-kicker">
                  ESTRUTURA
                </span>

                <h2>
                  Blocos da página
                </h2>
              </div>

              <span className="editor-count">
                {blocos.length}
              </span>
            </div>

            {blocosOrdenados.length === 0 ? (
              <div className="editor-empty">

                <div className="editor-empty-icon">
                  <Icon
                    name="layers"
                    size={24}
                  />
                </div>

                <strong>
                  Página vazia
                </strong>

                <span>
                  Escolha um elemento ao lado
                  para começar a montar o
                  conteúdo.
                </span>

                <button
                  type="button"
                  className="editor-primary-button"
                  onClick={
                    abrirNovoBloco
                  }
                >
                  <Icon
                    name="plus"
                    size={17}
                  />

                  Adicionar bloco
                </button>

              </div>
            ) : (
              <>
                <div className="editor-block-list">

                  {blocosOrdenados.map(
                    (bloco, index) => (
                      <article
                        className="editor-block"
                        key={
                          bloco.id ||
                          `${bloco.tipo}-${index}`
                        }
                      >

                        <div className="editor-block-header">

                          <div className="editor-block-name">

                            <span className="editor-block-number">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                '0'
                              )}
                            </span>

                            <span className="editor-block-icon">
                              <Icon
                                name={
                                  TIPOS_BLOCO.find(
                                    (item) =>
                                      item.tipo ===
                                      bloco.tipo
                                  )?.icone ||
                                  'text'
                                }
                                size={17}
                              />
                            </span>

                            <div>
                              <strong>
                                {nomeTipo(
                                  bloco.tipo
                                )}
                              </strong>

                              <small>
                                Bloco{' '}
                                {index + 1}
                              </small>
                            </div>

                          </div>

                          <div className="editor-block-actions">

                            <button
                              type="button"
                              className="editor-icon-button"
                              onClick={() =>
                                moverBloco(
                                  bloco,
                                  'cima'
                                )
                              }
                              disabled={
                                index === 0
                              }
                            >
                              <Icon
                                name="up"
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="editor-icon-button"
                              onClick={() =>
                                moverBloco(
                                  bloco,
                                  'baixo'
                                )
                              }
                              disabled={
                                index ===
                                blocosOrdenados.length -
                                  1
                              }
                            >
                              <Icon
                                name="down"
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="editor-icon-button"
                              onClick={() =>
                                abrirEditarBloco(
                                  bloco
                                )
                              }
                            >
                              <Icon
                                name="edit"
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="editor-icon-button danger"
                              onClick={() =>
                                excluirBloco(
                                  bloco
                                )
                              }
                            >
                              <Icon
                                name="trash"
                                size={15}
                              />
                            </button>

                          </div>

                        </div>

                        <div className="editor-block-body">
                          {previewBloco(
                            bloco
                          )}
                        </div>

                      </article>
                    )
                  )}

                </div>

                <button
                  type="button"
                  className="editor-add-button"
                  onClick={
                    abrirNovoBloco
                  }
                >
                  <Icon
                    name="plus"
                    size={17}
                  />

                  Adicionar novo bloco
                </button>
              </>
            )}

          </section>

        </main>

        <aside className="editor-sidebar">

          <section className="panel-card editor-panel">

            <span className="editor-panel-kicker">
              ELEMENTOS
            </span>

            <h2>
              Adicionar bloco
            </h2>

            <p className="editor-sidebar-description">
              Selecione um tipo de elemento
              para adicionar à página.
            </p>

            <div className="editor-types">

              {TIPOS_BLOCO.map(
                (item) => (
                  <button
                    type="button"
                    key={item.tipo}
                    className={`editor-type ${
                      tipoNovoBloco ===
                      item.tipo
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setTipoNovoBloco(
                        item.tipo
                      )
                    }
                  >
                    <span>
                      <Icon
                        name={
                          item.icone
                        }
                        size={16}
                      />
                    </span>

                    <div>
                      <strong>
                        {item.nome}
                      </strong>

                      <small>
                        {item.descricao}
                      </small>
                    </div>
                  </button>
                )
              )}

            </div>

            <button
              type="button"
              className="editor-primary-button editor-full-button"
              onClick={
                abrirNovoBloco
              }
            >
              <Icon
                name="plus"
                size={16}
              />

              Adicionar{' '}
              {nomeTipo(
                tipoNovoBloco
              )}
            </button>

          </section>

        </aside>

      </div>

      {modalAberto &&
        blocoEditando && (
          <div
            className="editor-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fecharModal();
              }
            }}
          >

            <div
              className="editor-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="editor-modal-header">

                <div>
                  <span className="editor-panel-kicker">
                    {blocoEditando.novo
                      ? 'NOVO BLOCO'
                      : 'EDITAR BLOCO'}
                  </span>

                  <h2>
                    {nomeTipo(
                      blocoEditando.tipo
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  className="editor-icon-button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    salvandoBloco
                  }
                >
                  <Icon
                    name="close"
                    size={18}
                  />
                </button>

              </div>

              <div className="editor-modal-body">

                {carregandoRelacionados &&
                  (
                    blocoEditando.tipo ===
                      'flashcards' ||
                    blocoEditando.tipo ===
                      'questoes' ||
                    blocoEditando.tipo ===
                      'simulado'
                  ) && (
                    <div className="editor-loading-small">
                      Carregando itens do sistema...
                    </div>
                  )}

                <BlocoFormulario
                  blocoEditando={blocoEditando}
                  atualizarDado={atualizarDado}
                  atualizarItem={atualizarItem}
                  adicionarItem={adicionarItem}
                  removerItem={removerItem}
                  alternarSelecionado={alternarSelecionado}
                  flashcards={flashcards}
                  questoes={questoes}
                  simulados={simulados}
                  buscaRelacionados={buscaRelacionados}
                  setBuscaRelacionados={setBuscaRelacionados}
                />

              </div>

              <div className="editor-modal-footer">

                <button
                  type="button"
                  className="editor-secondary-button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    salvandoBloco
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="editor-primary-button"
                  onClick={
                    salvarBloco
                  }
                  disabled={
                    salvandoBloco
                  }
                >
                  <Icon
                    name="save"
                    size={16}
                  />

                  {salvandoBloco
                    ? 'Salvando...'
                    : 'Salvar bloco'}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}