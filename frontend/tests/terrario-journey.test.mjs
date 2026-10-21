import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirJornada, SALAS_TENNA } from '../src/terrario/jornada.js';

test('a jornada contém seis capítulos distintos e só o primeiro é jogável', () => {
  assert.equal(SALAS_TENNA.length, 6);
  assert.equal(new Set(SALAS_TENNA.map(s => s.numero)).size, 6);
  const jornada = construirJornada(null);
  assert.equal(jornada.salas.filter(s => s.jogavel).length, 1);
  assert.equal(jornada.salas[0].estado, 'atual');
  assert.equal(jornada.salas[1].estado, 'em-progresso');
  assert.ok(jornada.salas.slice(2).every(s => s.estado === 'futura'));
});

test('progresso reflete sessões válidas sem liberar sala antecipadamente', () => {
  const progresso = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 3 });
  assert.equal(progresso.progresso, 3);
  assert.equal(progresso.faltam, 2);
  assert.equal(progresso.percentual, 60);
  assert.equal(progresso.salas[1].conquistada, false);
});

test('ao receber liberação do backend, sala 2 é conquistada e continua como prévia', () => {
  const finalizado = construirJornada({ salaDesbloqueada: 2, sessoesValidas: 5 });
  assert.equal(finalizado.faltam, 0);
  assert.equal(finalizado.totalConquistadas, 2);
  assert.equal(finalizado.salas[1].estado, 'conquistada');
  assert.equal(finalizado.salas[1].jogavel, false);
});

test('sessões de demonstração não são somadas pela apresentação da jornada', () => {
  const data = construirJornada({ salaDesbloqueada: 1, sessoesValidas: 0 });
  assert.equal(data.percentual, 0);
  assert.equal(data.faltam, 5);
});
