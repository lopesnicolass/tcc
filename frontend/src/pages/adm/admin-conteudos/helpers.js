// Helpers puros usados só pela tela de Conteúdos do admin.
// Extraído de AdminConteudos.jsx (estava tudo junto no mesmo arquivo).

export const EMPTY_MATERIA = {
  nome: '',
  slug: '',
  icone: 'book',
  cor: '#2196F3',
  descricao: '',
  ativa: true,
  ordem: 0,
};

export const EMPTY_TOPICO = {
  nome: '',
  descricao: '',
  ordem: 0,
  ativo: true,
};

export const ICONES = [
  'book',
  'calculator',
  'globe',
  'flask',
  'target',
];

export function gerarSlug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
