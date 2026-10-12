import assert from 'node:assert/strict';
import test from 'node:test';
import { alternarCardsVirados, obterTemasParaRevisar } from '../src/utils/flashcardsReview.js';

test('revela somente cartões visíveis e preserva o conjunto anterior', () => {
  const anteriores = new Set([1, 9]);
  const proximo = alternarCardsVirados(anteriores, [{ id: 1 }, { id: 2 }]);
  assert.deepEqual([...proximo].sort(), [1, 2, 9]);
  assert.deepEqual([...anteriores].sort(), [1, 9]);
});

test('volta às perguntas se todos os cartões exibidos já estão virados', () => {
  const virados = alternarCardsVirados(new Set([1, 2, 9]), [{ id: 1 }, { id: 2 }]);
  assert.deepEqual([...virados], [9]);
});

test('filtro vazio não altera os cartões que estão virados', () => {
  assert.deepEqual([...alternarCardsVirados(new Set([2]), [])], [2]);
});

test('mostra somente temas com erros, sem duplicados', () => {
  const cards = [
    { id: 1, subject: 'Português', content: 'Gramática' },
    { id: 2, subject: 'Português', content: 'Gramática' },
    { id: 3, subject: 'Ciências', content: 'Ecologia' },
    { id: 4, subject: 'Matemática', content: 'Porcentagem' },
  ];
  const respostas = [
    { flashcardId: 1, acertou: false },
    { flashcardId: 2, acertou: false },
    { flashcardId: 3, acertou: true },
    { flashcardId: 4, acertou: false },
  ];
  assert.deepEqual(obterTemasParaRevisar(respostas, cards), [
    'Português · Gramática',
    'Matemática · Porcentagem',
  ]);
});

test('assunto sem conteúdo e resposta de cartão ausente têm fallback', () => {
  const respostas = [
    { flashcardId: 1, acertou: false },
    { flashcardId: 50, acertou: false, materia: 'História' },
  ];
  assert.deepEqual(obterTemasParaRevisar(respostas, [{ id: 1, subject: 'Geografia' }]), [
    'Geografia · Revisão geral',
    'História',
  ]);
});
