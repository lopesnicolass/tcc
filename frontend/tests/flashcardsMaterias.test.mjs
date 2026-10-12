import assert from 'node:assert/strict';
import test from 'node:test';
import { MATERIAS_FLASHCARDS, organizarMaterias } from '../src/utils/flashcardsMaterias.js';

test('exibe as cinco matérias do Tenna mesmo quando nenhum flashcard foi cadastrado', () => {
  assert.deepEqual(organizarMaterias([]), [...MATERIAS_FLASHCARDS]);
});

test('evita matérias duplicadas e preserva a ordem das principais', () => {
  const materias = organizarMaterias([
    { subject: 'Geografia' }, { subject: 'Matemática' },
    { subject: 'Geografia' }, { subject: 'Português' }
  ]);
  assert.deepEqual(materias, [...MATERIAS_FLASHCARDS]);
});

test('matérias extras cadastradas também aparecem, em ordem alfabética', () => {
  assert.deepEqual(organizarMaterias([
    { subject: 'Química' }, { subject: 'Biologia' }, { subject: 'Química' },
    { subject: 'Português' }
  ]), [...MATERIAS_FLASHCARDS, 'Biologia', 'Química']);
});

test('flashcard sem matéria recebe uma categoria acessível', () => {
  assert.ok(organizarMaterias([{}]).includes('Sem matéria'));
});
