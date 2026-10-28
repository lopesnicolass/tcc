import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guia = readFileSync(new URL('../src/terrario/GuiaTerrario.jsx', import.meta.url), 'utf8');

test('Passo de sementes segue mesmo card compacto dos demais passos', () => {
  assert.match(guia, /Ganhe 2 sementes a cada 15 minutos completos de foco/);
  assert.match(guia, /<div className="terr-guide-content"/);
  assert.doesNotMatch(guia, /terr-guide-rewards|terr-guide-reward-grid|terr-guide-reward-note/);
  assert.match(guia, /<div className="terr-guide-actions"/);
});
