import { useEffect, useMemo, useState } from 'react';
import '../../styles/adm/EditorConteudo.css';

const API_URL = 'http://localhost:3000';

function obterToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token')
  );
}

async function request(url, options = {}) {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : {
            'Content-Type': 'application/json',
          }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const texto = await resposta.text();

  let dados = {};

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = {};
  }

  if (
    resposta.status === 404 &&
    url.startsWith('/paginas-conteudo/topico/')
  ) {
    return {
      pagina: null,
      blocos: [],
    };
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        dados.message ||
        dados.mensagem ||
        'Não foi possível realizar a operação.'
    );
  }

  return dados;
}

const TIPOS_BLOCO = [
  {
    tipo: 'texto',
    nome: 'Texto',
    descricao: 'Explicações e conteúdo escrito.',
    icone: 'text',
  },
  {
    tipo: 'destaque',
    nome: 'Destaque',
    descricao: 'Informação importante em evidência.',
    icone: 'destaque',
  },
  {
    tipo: 'video',
    nome: 'Vídeo',
    descricao: 'Videoaula do YouTube.',
    icone: 'video',
  },
  {
    tipo: 'imagem',
    nome: 'Imagem',
    descricao: 'Imagem ilustrativa.',
    icone: 'image',
  },
  {
    tipo: 'pdf',
    nome: 'PDF',
    descricao: 'Material complementar.',
    icone: 'file',
  },
  {
    tipo: 'lista',
    nome: 'Lista',
    descricao: 'Lista de conceitos ou passos.',
    icone: 'list',
  },
  {
    tipo: 'flashcards',
    nome: 'Flashcards',
    descricao: 'Use os flashcards já cadastrados.',
    icone: 'layers',
  },
  {
    tipo: 'questoes',
    nome: 'Questões',
    descricao: 'Use questões já cadastradas.',
    icone: 'question',
  },
  {
    tipo: 'simulado',
    nome: 'Simulado',
    descricao: 'Relacione um simulado já cadastrado.',
    icone: 'check',
  },
  {
    tipo: 'checklist',
    nome: 'Checklist',
    descricao: 'Lista para revisão.',
    icone: 'checkSquare',
  },
];

const ICONS = {
  arrowLeft: <path d="M19 12H5m7-7-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  save: (
    <path d="M5 4h11l3 3v13H5V4Zm3 0v5h7V4M8 20v-7h8v7" />
  ),
  trash: (
    <path d="M5 7h14M10 11v5m4-5v5M9 7l1-3h4l1 3m-8 0 .7 14h9.6L18 7" />
  ),
  edit: (
    <path d="m4 20 4-.9L19 8.1a2.1 2.1 0 0 0-3-3L5 16.1 4 20Zm10.5-13.5 3 3" />
  ),
  up: <path d="m18 15-6-6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 4 4L19 6" />,
  text: <path d="M5 5h14M12 5v14M8 19h8" />,
  destaque: (
    <path d="m4 16 8-8 4 4-8 8H4v-4Zm8-8 2-2 4 4-2 2M4 20h16" />
  ),
  video: (
    <path d="m9 7 8 5-8 5V7Zm-5 13h16V4H4v16Z" />
  ),
  image: (
    <path d="M4 5h16v14H4V5Zm2 11 4-4 3 3 2-2 3 3M8.5 9.5h.01" />
  ),
  file: (
    <path d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 12h6M9 16h6" />
  ),
  list: (
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  ),
  layers: (
    <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
  ),
  question: (
    <path d="M9.5 9a2.5 2.5 0 1 1 4.7 1.2c-.8 1.2-2.2 1.5-2.2 3M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
  ),
  checkSquare: (
    <path d="M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9" />
  ),
  search: (
    <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function normalizarBloco(bloco, ordem = 1) {
  let dados = bloco?.dados;

  if (typeof dados === 'string') {
    try {
      dados = JSON.parse(dados);
    } catch {
      dados = {};
    }
  }

  if (!dados || typeof dados !== 'object') {
    dados = {};
  }

  return {
    ...bloco,
    tipo: bloco?.tipo || 'texto',
    ordem: Number(bloco?.ordem) || ordem,
    dados,
  };
}

function dadosIniciais(tipo) {
  switch (tipo) {
    case 'texto':
      return {
        titulo: '',
        texto: '',
      };

    case 'destaque':
      return {
        titulo: '',
        texto: '',
        variante: 'info',
      };

    case 'video':
      return {
        titulo: '',
        url: '',
        descricao: '',
      };

    case 'imagem':
      return {
        titulo: '',
        url: '',
        alt: '',
        legenda: '',
      };

    case 'pdf':
      return {
        titulo: '',
        url: '',
        descricao: '',
      };

    case 'lista':
      return {
        titulo: '',
        itens: [''],
      };

    case 'flashcards':
      return {
        titulo: 'Flashcards para revisar',
        descricao: '',
        flashcardIds: [],
      };

    case 'questoes':
      return {
        titulo: 'Pratique',
        descricao: '',
        questaoIds: [],
      };

    case 'simulado':
      return {
        titulo: 'Simulado recomendado',
        descricao: '',
        simuladoId: null,
      };

    case 'checklist':
      return {
        titulo: 'Checklist de revisão',
        itens: [''],
      };

    default:
      return {};
  }
}

function youtubeEmbed(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes('youtube.com') &&
      parsed.pathname === '/watch'
    ) {
      const id = parsed.searchParams.get('v');

      return id
        ? `https://www.youtube.com/embed/${id}`
        : '';
    }

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').trim();

      return id
        ? `https://www.youtube.com/embed/${id}`
        : '';
    }

    if (parsed.pathname.startsWith('/embed/')) {
      return url;
    }

    return '';
  } catch {
    return '';
  }
}

function nomeTipo(tipo) {
  return (
    TIPOS_BLOCO.find(
      (item) => item.tipo === tipo
    )?.nome || 'Bloco'
  );
}

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
      };

      if (!pagina?.id) {
        const dados = await request(
          '/paginas-conteudo',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );

        setPagina(
          dados.pagina ||
            dados.data ||
            dados
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

        setPagina((anterior) => ({
          ...anterior,
          ...(dados.pagina ||
            dados.data ||
            dados),
          id: pagina.id,
        }));

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

  function campo(
    label,
    valor,
    onChange,
    opcoes = {}
  ) {
    const {
      placeholder = '',
      multiline = false,
      rows = 5,
      help = '',
    } = opcoes;

    return (
      <label className="editor-field">
        <span className="editor-field-label">
          {label}
        </span>

        {multiline ? (
          <textarea
            value={valor || ''}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            placeholder={
              placeholder
            }
            rows={rows}
          />
        ) : (
          <input
            type="text"
            value={valor || ''}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            placeholder={
              placeholder
            }
          />
        )}

        {help && (
          <small className="editor-field-help">
            {help}
          </small>
        )}
      </label>
    );
  }

  function itensFiltrados(
    lista,
    callback
  ) {
    const termo =
      buscaRelacionados
        .trim()
        .toLowerCase();

    if (!termo) {
      return lista;
    }

    return lista.filter(
      callback
    );
  }

  function formularioBloco() {
    if (!blocoEditando) {
      return null;
    }

    const dados =
      blocoEditando.dados || {};

    switch (
      blocoEditando.tipo
    ) {
      case 'texto':
        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                ),
              {
                placeholder:
                  'Ex.: Introdução',
              }
            )}

            {campo(
              'Conteúdo',
              dados.texto,
              (valor) =>
                atualizarDado(
                  'texto',
                  valor
                ),
              {
                multiline: true,
                rows: 9,
                placeholder:
                  'Escreva a explicação...',
              }
            )}
          </>
        );

      case 'destaque':
        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                ),
              {
                placeholder:
                  'Ex.: Atenção!',
              }
            )}

            <label className="editor-field">
              <span className="editor-field-label">
                Tipo de destaque
              </span>

              <select
                value={
                  dados.variante ||
                  'info'
                }
                onChange={(event) =>
                  atualizarDado(
                    'variante',
                    event.target
                      .value
                  )
                }
              >
                <option value="info">
                  Informação
                </option>

                <option value="warning">
                  Atenção
                </option>

                <option value="success">
                  Dica
                </option>
              </select>
            </label>

            {campo(
              'Mensagem',
              dados.texto,
              (valor) =>
                atualizarDado(
                  'texto',
                  valor
                ),
              {
                multiline: true,
                rows: 6,
                placeholder:
                  'Escreva a informação...',
              }
            )}
          </>
        );

      case 'video':
        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                )
            )}

            {campo(
              'Link do YouTube',
              dados.url,
              (valor) =>
                atualizarDado(
                  'url',
                  valor
                ),
              {
                placeholder:
                  'https://www.youtube.com/watch?v=...',
              }
            )}

            {campo(
              'Descrição',
              dados.descricao,
              (valor) =>
                atualizarDado(
                  'descricao',
                  valor
                ),
              {
                multiline: true,
                rows: 4,
              }
            )}

            {youtubeEmbed(
              dados.url
            ) && (
              <div className="editor-preview">
                <span>Prévia</span>

                <iframe
                  src={youtubeEmbed(
                    dados.url
                  )}
                  title={
                    dados.titulo ||
                    'Videoaula'
                  }
                  allowFullScreen
                />
              </div>
            )}
          </>
        );

      case 'imagem':
        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                )
            )}

            {campo(
              'URL da imagem',
              dados.url,
              (valor) =>
                atualizarDado(
                  'url',
                  valor
                ),
              {
                placeholder:
                  'https://...',
              }
            )}

            {campo(
              'Texto alternativo',
              dados.alt,
              (valor) =>
                atualizarDado(
                  'alt',
                  valor
                )
            )}

            {campo(
              'Legenda',
              dados.legenda,
              (valor) =>
                atualizarDado(
                  'legenda',
                  valor
                )
            )}

            {dados.url && (
              <div className="editor-preview">
                <span>Prévia</span>

                <img
                  src={dados.url}
                  alt={
                    dados.alt || ''
                  }
                />
              </div>
            )}
          </>
        );

      case 'pdf':
        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                )
            )}

            {campo(
              'URL do PDF',
              dados.url,
              (valor) =>
                atualizarDado(
                  'url',
                  valor
                ),
              {
                placeholder:
                  'https://...',
              }
            )}

            {campo(
              'Descrição',
              dados.descricao,
              (valor) =>
                atualizarDado(
                  'descricao',
                  valor
                ),
              {
                multiline: true,
                rows: 4,
              }
            )}
          </>
        );

      case 'lista':
      case 'checklist':
        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                )
            )}

            <div className="editor-items">
              <div className="editor-items-header">
                <span>
                  Itens
                </span>

                <button
                  type="button"
                  className="editor-small-button"
                  onClick={
                    adicionarItem
                  }
                >
                  <Icon
                    name="plus"
                    size={14}
                  />

                  Adicionar
                </button>
              </div>

              {(Array.isArray(
                dados.itens
              )
                ? dados.itens
                : ['']
              ).map(
                (item, index) => (
                  <div
                    className="editor-item-row"
                    key={index}
                  >
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        '0'
                      )}
                    </span>

                    <input
                      value={
                        item || ''
                      }
                      onChange={(event) =>
                        atualizarItem(
                          index,
                          event.target
                            .value
                        )
                      }
                      placeholder="Digite o item..."
                    />

                    <button
                      type="button"
                      className="editor-icon-button danger"
                      onClick={() =>
                        removerItem(
                          index
                        )
                      }
                    >
                      <Icon
                        name="trash"
                        size={14}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          </>
        );

      case 'flashcards': {
        const selecionados =
          Array.isArray(
            dados.flashcardIds
          )
            ? dados.flashcardIds
            : [];

        const lista =
          itensFiltrados(
            flashcards,
            (card) =>
              String(
                card.primario || ''
              )
                .toLowerCase()
                .includes(
                  buscaRelacionados
                    .toLowerCase()
                ) ||
              String(
                card.secundario || ''
              )
                .toLowerCase()
                .includes(
                  buscaRelacionados
                    .toLowerCase()
                ) ||
              String(
                card.materia || ''
              )
                .toLowerCase()
                .includes(
                  buscaRelacionados
                    .toLowerCase()
                )
          );

        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                ),
              {
                placeholder:
                  'Ex.: Flashcards para revisar',
              }
            )}

            {campo(
              'Descrição',
              dados.descricao,
              (valor) =>
                atualizarDado(
                  'descricao',
                  valor
                ),
              {
                multiline: true,
                rows: 3,
              }
            )}

            <div className="editor-related">
              <div className="editor-related-header">
                <strong>
                  Selecionar flashcards
                </strong>

                <span>
                  {selecionados.length}{' '}
                  selecionado(s)
                </span>
              </div>

              <div className="editor-search">
                <Icon
                  name="search"
                  size={16}
                />

                <input
                  value={
                    buscaRelacionados
                  }
                  onChange={(event) =>
                    setBuscaRelacionados(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar flashcard..."
                />
              </div>

              <div className="editor-related-list">
                {lista.length === 0 ? (
                  <div className="editor-related-empty">
                    Nenhum flashcard encontrado.
                  </div>
                ) : (
                  lista.map(
                    (card) => {
                      const ativo =
                        selecionados.some(
                          (id) =>
                            Number(
                              id
                            ) ===
                            Number(
                              card.id
                            )
                        );

                      return (
                        <button
                          type="button"
                          key={card.id}
                          className={`editor-related-item ${
                            ativo
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() =>
                            alternarSelecionado(
                              'flashcardIds',
                              card.id
                            )
                          }
                        >
                          <span className="editor-related-check">
                            {ativo && (
                              <Icon
                                name="check"
                                size={13}
                              />
                            )}
                          </span>

                          <span>
                            <strong>
                              {
                                card.primario
                              }
                            </strong>

                            <small>
                              {
                                card.secundario
                              }
                            </small>

                            <small>
                              {
                                card.materia
                              }
                            </small>
                          </span>
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </div>
          </>
        );
      }

      case 'questoes': {
        const selecionadas =
          Array.isArray(
            dados.questaoIds
          )
            ? dados.questaoIds
            : [];

        const lista =
          itensFiltrados(
            questoes,
            (questao) =>
              String(
                questao.pergunta ||
                  questao.enunciado ||
                  ''
              )
                .toLowerCase()
                .includes(
                  buscaRelacionados
                    .toLowerCase()
                )
          );

        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                ),
              {
                placeholder:
                  'Ex.: Pratique o conteúdo',
              }
            )}

            {campo(
              'Descrição',
              dados.descricao,
              (valor) =>
                atualizarDado(
                  'descricao',
                  valor
                ),
              {
                multiline: true,
                rows: 3,
              }
            )}

            <div className="editor-related">
              <div className="editor-related-header">
                <strong>
                  Selecionar questões
                </strong>

                <span>
                  {selecionadas.length}{' '}
                  selecionada(s)
                </span>
              </div>

              <div className="editor-search">
                <Icon
                  name="search"
                  size={16}
                />

                <input
                  value={
                    buscaRelacionados
                  }
                  onChange={(event) =>
                    setBuscaRelacionados(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar questão..."
                />
              </div>

              <div className="editor-related-list">
                {lista.length === 0 ? (
                  <div className="editor-related-empty">
                    Nenhuma questão encontrada.
                  </div>
                ) : (
                  lista.map(
                    (questao) => {
                      const ativo =
                        selecionadas.some(
                          (id) =>
                            Number(
                              id
                            ) ===
                            Number(
                              questao.id
                            )
                        );

                      return (
                        <button
                          type="button"
                          key={questao.id}
                          className={`editor-related-item ${
                            ativo
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() =>
                            alternarSelecionado(
                              'questaoIds',
                              questao.id
                            )
                          }
                        >
                          <span className="editor-related-check">
                            {ativo && (
                              <Icon
                                name="check"
                                size={13}
                              />
                            )}
                          </span>

                          <span>
                            <strong>
                              Questão{' '}
                              {
                                questao.id
                              }
                            </strong>

                            <small>
                              {
                                questao.pergunta ||
                                questao.enunciado ||
                                'Sem enunciado'
                              }
                            </small>

                            {questao.materia && (
                              <small>
                                {
                                  questao.materia
                                }
                              </small>
                            )}
                          </span>
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </div>
          </>
        );
      }

      case 'simulado': {
        const lista =
          itensFiltrados(
            simulados,
            (simulado) =>
              String(
                simulado.titulo ||
                  simulado.nome ||
                  ''
              )
                .toLowerCase()
                .includes(
                  buscaRelacionados
                    .toLowerCase()
                ) ||
              String(
                simulado.materia ||
                  ''
              )
                .toLowerCase()
                .includes(
                  buscaRelacionados
                    .toLowerCase()
                )
          );

        return (
          <>
            {campo(
              'Título',
              dados.titulo,
              (valor) =>
                atualizarDado(
                  'titulo',
                  valor
                ),
              {
                placeholder:
                  'Ex.: Simulado recomendado',
              }
            )}

            {campo(
              'Descrição',
              dados.descricao,
              (valor) =>
                atualizarDado(
                  'descricao',
                  valor
                ),
              {
                multiline: true,
                rows: 3,
              }
            )}

            <div className="editor-related">
              <div className="editor-related-header">
                <strong>
                  Selecionar simulado
                </strong>

                <span>
                  {dados.simuladoId
                    ? '1 selecionado'
                    : 'Nenhum selecionado'}
                </span>
              </div>

              <div className="editor-search">
                <Icon
                  name="search"
                  size={16}
                />

                <input
                  value={
                    buscaRelacionados
                  }
                  onChange={(event) =>
                    setBuscaRelacionados(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar simulado..."
                />
              </div>

              <div className="editor-related-list">
                {lista.length === 0 ? (
                  <div className="editor-related-empty">
                    Nenhum simulado encontrado.
                  </div>
                ) : (
                  lista.map(
                    (simulado) => {
                      const ativo =
                        Number(
                          dados.simuladoId
                        ) ===
                        Number(
                          simulado.id
                        );

                      return (
                        <button
                          type="button"
                          key={simulado.id}
                          className={`editor-related-item ${
                            ativo
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() =>
                            atualizarDado(
                              'simuladoId',
                              ativo
                                ? null
                                : Number(
                                    simulado.id
                                  )
                            )
                          }
                        >
                          <span className="editor-related-check">
                            {ativo && (
                              <Icon
                                name="check"
                                size={13}
                              />
                            )}
                          </span>

                          <span>
                            <strong>
                              {
                                simulado.titulo ||
                                simulado.nome
                              }
                            </strong>

                            <small>
                              {simulado.materia ||
                                'Sem matéria'}
                            </small>

                            <small>
                              {simulado.quantidade_questoes ||
                                0}{' '}
                              questões
                            </small>
                          </span>
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </div>
          </>
        );
      }

      default:
        return null;
    }
  }

  function previewBloco(bloco) {
    const dados =
      bloco.dados || {};

    switch (bloco.tipo) {
      case 'texto':
        return (
          <>
            {dados.titulo && (
              <h3>{dados.titulo}</h3>
            )}

            <p>
              {dados.texto ||
                'Este bloco ainda está vazio.'}
            </p>
          </>
        );

      case 'destaque':
        return (
          <div
            className={`editor-block-highlight ${
              dados.variante ||
              'info'
            }`}
          >
            <strong>
              {dados.titulo ||
                'Destaque'}
            </strong>

            <span>
              {dados.texto ||
                'Adicione uma mensagem.'}
            </span>
          </div>
        );

      case 'video':
        return (
          <>
            {dados.titulo && (
              <h3>
                {dados.titulo}
              </h3>
            )}

            {youtubeEmbed(
              dados.url
            ) ? (
              <div className="editor-block-video">
                <iframe
                  src={youtubeEmbed(
                    dados.url
                  )}
                  title={
                    dados.titulo ||
                    'Videoaula'
                  }
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="editor-block-placeholder">
                Adicione um link do YouTube.
              </div>
            )}
          </>
        );

      case 'imagem':
        return (
          <>
            {dados.titulo && (
              <h3>{dados.titulo}</h3>
            )}

            {dados.url ? (
              <div className="editor-block-image">
                <img
                  src={dados.url}
                  alt={
                    dados.alt || ''
                  }
                />

                {dados.legenda && (
                  <small>
                    {dados.legenda}
                  </small>
                )}
              </div>
            ) : (
              <div className="editor-block-placeholder">
                Adicione a URL da imagem.
              </div>
            )}
          </>
        );

      case 'pdf':
        return (
          <>
            {dados.titulo && (
              <h3>{dados.titulo}</h3>
            )}

            {dados.descricao && (
              <p className="editor-muted">
                {dados.descricao}
              </p>
            )}

            {dados.url && (
              <a
                href={dados.url}
                target="_blank"
                rel="noreferrer"
                className="editor-resource"
              >
                <Icon
                  name="file"
                  size={17}
                />

                Abrir PDF
              </a>
            )}
          </>
        );

      case 'lista':
      case 'checklist':
        return (
          <>
            {dados.titulo && (
              <h3>{dados.titulo}</h3>
            )}

            <ul className="editor-preview-list">
              {(Array.isArray(
                dados.itens
              )
                ? dados.itens
                : []
              )
                .filter(
                  (item) =>
                    String(
                      item
                    ).trim()
                )
                .map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
            </ul>
          </>
        );

      case 'flashcards': {
        const quantidade =
          Array.isArray(
            dados.flashcardIds
          )
            ? dados.flashcardIds.length
            : 0;

        return (
          <>
            <h3>
              {dados.titulo ||
                'Flashcards para revisar'}
            </h3>

            <p className="editor-muted">
              {dados.descricao ||
                'Flashcards relacionados ao tópico.'}
            </p>

            <span className="editor-preview-tag">
              {quantidade}{' '}
              flashcard(s) selecionado(s)
            </span>
          </>
        );
      }

      case 'questoes': {
        const quantidade =
          Array.isArray(
            dados.questaoIds
          )
            ? dados.questaoIds.length
            : 0;

        return (
          <>
            <h3>
              {dados.titulo ||
                'Pratique'}
            </h3>

            <p className="editor-muted">
              {dados.descricao ||
                'Questões relacionadas ao tópico.'}
            </p>

            <span className="editor-preview-tag">
              {quantidade}{' '}
              questão(ões) selecionada(s)
            </span>
          </>
        );
      }

      case 'simulado':
        return (
          <>
            <h3>
              {dados.titulo ||
                'Simulado recomendado'}
            </h3>

            <p className="editor-muted">
              {dados.descricao ||
                'Simulado relacionado ao tópico.'}
            </p>

            <span className="editor-preview-tag">
              {dados.simuladoId
                ? `Simulado #${dados.simuladoId}`
                : 'Nenhum simulado selecionado'}
            </span>
          </>
        );

      default:
        return null;
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
                                abrirEdicaoBloco(
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

                {formularioBloco()}

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