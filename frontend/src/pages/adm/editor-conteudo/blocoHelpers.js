// Helpers puros sobre os "blocos" de conteúdo (texto, vídeo, imagem, etc).
// Extraído de EditorConteudo.jsx (estava tudo junto no mesmo arquivo).

export const TIPOS_BLOCO = [
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

export function normalizarBloco(bloco, ordem = 1) {
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

export function dadosIniciais(tipo) {
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

export function youtubeEmbed(url) {
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

export function nomeTipo(tipo) {
  return (
    TIPOS_BLOCO.find(
      (item) => item.tipo === tipo
    )?.nome || 'Bloco'
  );
}
