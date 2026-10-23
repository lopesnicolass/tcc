import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirJornada, SALAS_TENNA } from '../src/terrario/jornada.js';

test('a jornada contém três salas distintas e só o ninho inicial é jogável', () => {
  assert.equal(SALAS_TENNA.length, 3);
  assert.equal(new Set(SALAS_TENNA.map(s => s.numero)).size, 3);
  const jornada = construirJornada(null);
  assert.equal(jornada.salas.filter(s => s.jogavel).length, 1);
  assert.equal(jornada.salas[0].estado, 'atual');
  assert.equal(jornada.salas[1].estado, 'em-progresso');
  assert.equal(jornada.salas[2].nome, 'Sala da Reta Final');
  assert.equal(jornada.salas[2].estado, 'futura');
});

test('progresso reflete sessões válidas sem liberar sala antecipadamente', () => {
  const progresso = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 3 });
  assert.equal(progresso.progresso, 3);
  assert.equal(progresso.faltam, 2);
  assert.equal(progresso.percentual, 60);
  assert.equal(progresso.salas[1].conquistada, false);
});

test('ao receber liberação do backend, sala 2 é conquistada e já pode ser visitada vazia', () => {
  const finalizado = construirJornada({ salaDesbloqueada: 2, sessoesValidas: 5 });
  assert.equal(finalizado.faltam, 0);
  assert.equal(finalizado.totalConquistadas, 2);
  assert.equal(finalizado.salas[1].estado, 'conquistada');
  assert.equal(finalizado.salas[1].jogavel, true);
});

test('sessões de demonstração não são somadas pela apresentação da jornada', () => {
  const data = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 0 });
  assert.equal(data.percentual, 0);
  assert.equal(data.faltam, 5);
});

test('sala 3 permanece fechada mesmo se o progresso antigo indicar outra sala', () => {
  const jornada = construirJornada({ salaDesbloqueada: 6, sessoesValidas: 50 });
  assert.equal(jornada.totalConquistadas, 2);
  assert.equal(jornada.salas[2].conquistada, false);
  assert.equal(jornada.salas[2].jogavel, false);
});
