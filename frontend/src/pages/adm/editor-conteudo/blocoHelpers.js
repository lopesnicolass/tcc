// Helpers puros sobre os "blocos" de conteúdo (texto, vídeo, imagem, etc).
// Extraído de EditorConteudo.jsx (estava tudo junto no mesmo arquivo).

export const TIPOS_BLOCO = [
  {
    tipo: 'formula', nome: 'Fórmula matemática', descricao: 'Frações, raízes, potências e equações.', icone: 'text', categoria: 'Matemática e exemplos',
  },
  {
    tipo: 'exemplo', nome: 'Exemplo resolvido', descricao: 'Resolução com explicações passo a passo.', icone: 'list', categoria: 'Matemática e exemplos',
  },
  {
    tipo: 'exemplos', nome: 'Certo ou errado', descricao: 'Compare um exemplo correto com um incorreto.', icone: 'checkSquare', categoria: 'Matemática e exemplos',
  },
  {
    tipo: 'tabela', nome: 'Tabela', descricao: 'Organize comparações em linhas e colunas.', icone: 'list', categoria: 'Explicação',
  },
  {
    tipo: 'pergunta', nome: 'Pergunta interativa', descricao: 'Alternativas com correção e feedback.', icone: 'question', categoria: 'Prática e revisão',
  },
  {
    tipo: 'linha_tempo', nome: 'Linha do tempo', descricao: 'Eventos históricos organizados por período.', icone: 'list', categoria: 'Recursos visuais',
  },
  {
    tipo: 'glossario', nome: 'Glossário', descricao: 'Conceitos e definições essenciais.', icone: 'text', categoria: 'Explicação',
  },
  {
    tipo: 'expansivel', nome: 'Saiba mais', descricao: 'Informação opcional que o aluno pode expandir.', icone: 'destaque', categoria: 'Explicação',
  },

  {
    tipo: 'texto',
    categoria: 'Explicação',
    nome: 'Texto',
    descricao: 'Explicações e conteúdo escrito.',
    icone: 'text',
  },
  {
    tipo: 'destaque',
    categoria: 'Explicação',
    nome: 'Destaque',
    descricao: 'Informação importante em evidência.',
    icone: 'destaque',
  },
  {
    tipo: 'video',
    categoria: 'Recursos visuais',
    nome: 'Vídeo',
    descricao: 'Videoaula do YouTube.',
    icone: 'video',
  },
  {
    tipo: 'imagem',
    categoria: 'Recursos visuais',
    nome: 'Imagem',
    descricao: 'Imagem ilustrativa.',
    icone: 'image',
  },
  {
    tipo: 'pdf',
    categoria: 'Recursos visuais',
    nome: 'PDF',
    descricao: 'Material complementar.',
    icone: 'file',
  },
  {
    tipo: 'lista',
    categoria: 'Explicação',
    nome: 'Lista',
    descricao: 'Lista de conceitos ou passos.',
    icone: 'list',
  },
  {
    tipo: 'flashcards',
    categoria: 'Prática e revisão',
    nome: 'Flashcards',
    descricao: 'Use os flashcards já cadastrados.',
    icone: 'layers',
  },
  {
    tipo: 'questoes',
    categoria: 'Prática e revisão',
    nome: 'Questões',
    descricao: 'Use questões já cadastradas.',
    icone: 'question',
  },
  {
    tipo: 'simulado',
    categoria: 'Prática e revisão',
    nome: 'Simulado',
    descricao: 'Relacione um simulado já cadastrado.',
    icone: 'check',
  },
  {
    tipo: 'checklist',
    categoria: 'Prática e revisão',
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
    case 'formula': return { titulo: 'Fórmula matemática', expressao: String.raw`\frac{a}{b}`, descricao: '', legenda: '' };
    case 'exemplo': return { titulo: 'Exemplo resolvido', enunciado: '', passos: [{ texto: '', formula: '' }], resultado: '' };
    case 'exemplos': return { titulo: 'Compare os exemplos', correto: '', incorreto: '', explicacao: '' };
    case 'tabela': return { titulo: 'Tabela comparativa', colunas: ['Conceito', 'Descrição'], linhas: [['', '']], descricao: '' };
    case 'pergunta': return { titulo: 'Agora é sua vez', enunciado: '', alternativas: ['', '', ''], correta: 0, explicacao: '' };
    case 'linha_tempo': return { titulo: 'Linha do tempo', itens: [{ data: '', titulo: '', texto: '' }] };
    case 'glossario': return { titulo: 'Glossário', itens: [{ termo: '', definicao: '' }] };
    case 'expansivel': return { titulo: 'Saiba mais', texto: '', formula: '' };
    case 'texto':
      return {
        titulo: '',
        texto: '',
        estilo: 'padrao',
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
