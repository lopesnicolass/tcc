import test from 'node:test';
import assert from 'node:assert/strict';
import { diasAteVestibulinho } from '../src/utils/vestibulinho.js';

const isoLocal = (d) => [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0')
].join('-');

test('sem data cadastrada: não inventa uma contagem', () => {
  assert.equal(diasAteVestibulinho(null), null);
  assert.equal(diasAteVestibulinho(''), null);
  assert.equal(diasAteVestibulinho('2026-02-30'), null);
});

test('a data de hoje deve mostrar zero dias restantes', () => {
  assert.equal(diasAteVestibulinho(isoLocal(new Date())), 0);
});

test('dias restantes não dependem de horários', () => {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 5);
  assert.equal(diasAteVestibulinho(isoLocal(amanha)), 5);
});

test('provas anteriores não geram uma contagem negativa', () => {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  assert.equal(diasAteVestibulinho(isoLocal(ontem)), 0);
});
