import { dadosIniciais } from './blocoHelpers.js';

const modelo = (tipo, dados = {}) => ({ tipo, dados: { ...dadosIniciais(tipo), ...dados } });
export const MODELOS_AULA = [
  {
    id: 'teorica', nome: 'Aula teórica', descricao: 'Apresente, explique e encerre com um resumo.',
    blocos: [modelo('texto', { titulo: 'Introdução', texto: '' }), modelo('texto', { titulo: 'Explicação do conteúdo' }), modelo('destaque', { titulo: 'Para lembrar', variante: 'info' }), modelo('lista', { titulo: 'Resumo da aula', itens: [''] })],
  },
  {
    id: 'exercicios', nome: 'Aula com exercícios', descricao: 'Explicação, exemplo resolvido e questão com feedback.',
    blocos: [modelo('texto', { titulo: 'Introdução' }), modelo('texto', { titulo: 'Como funciona' }), modelo('exemplo'), modelo('pergunta'), modelo('lista', { titulo: 'Resumo da aula', itens: [''] })],
  },
  {
    id: 'revisao', nome: 'Revisão rápida', descricao: 'Reforce os principais pontos com revisão e prática.',
    blocos: [modelo('lista', { titulo: 'Conceitos essenciais', itens: [''] }), modelo('glossario'), modelo('pergunta'), modelo('flashcards')],
  },
  {
    id: 'matematica', nome: 'Matemática passo a passo', descricao: 'Fórmula, exemplo detalhado, prática e resumo.',
    blocos: [modelo('texto', { titulo: 'Entenda o problema' }), modelo('formula'), modelo('exemplo'), modelo('pergunta'), modelo('lista', { titulo: 'Resumo', itens: [''] })],
  },
];
