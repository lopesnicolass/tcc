import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirJornada, SALAS_TENNA } from '../src/terrario/jornada.js';

test('a jornada contém três salas distintas e só o ninho inicial é jogável no começo', () => {
  assert.equal(SALAS_TENNA.length, 3);
  assert.equal(new Set(SALAS_TENNA.map(s => s.numero)).size, 3);
  const jornada = construirJornada(null);
  assert.equal(jornada.salas.filter(s => s.jogavel).length, 1);
  assert.equal(jornada.salas[0].estado, 'atual');
  assert.equal(jornada.salas[1].estado, 'em-progresso');
  assert.equal(jornada.salas[2].nome, 'Sala do Desafio Final');
  assert.equal(jornada.salas[2].estado, 'futura');
});

test('antes da sala 2, o progresso mira o primeiro objetivo de 5 sessões', () => {
  const progresso = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 3 });
  assert.equal(progresso.progresso, 3);
  assert.equal(progresso.faltamSala2, 2);
  assert.equal(progresso.percentual, 60);
  assert.equal(progresso.salas[1].conquistada, false);
});

test('ao receber liberação do backend, sala 2 é conquistada e a meta passa para 10 sessões', () => {
  const finalizado = construirJornada({ salaDesbloqueada: 2, sessoesValidas: 5 });
  assert.equal(finalizado.totalConquistadas, 2);
  assert.equal(finalizado.salas[1].estado, 'conquistada');
  assert.equal(finalizado.salas[1].jogavel, true);
  assert.equal(finalizado.objetivo, 10);
  assert.equal(finalizado.faltamSala3, 5);
});

test('sessões de demonstração não são somadas pela apresentação da jornada', () => {
  const data = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 0 });
  assert.equal(data.percentual, 0);
  assert.equal(data.faltamSala2, 5);
});

test('a sala 3 é reconhecida quando o backend informa o desbloqueio', () => {
  const jornada = construirJornada({ salaDesbloqueada: 3, sessoesValidas: 10 });
  assert.equal(jornada.totalConquistadas, 3);
  assert.equal(jornada.salas[2].conquistada, true);
  assert.equal(jornada.salas[2].jogavel, true);
  assert.equal(jornada.salas[2].estado, 'conquistada');
});
