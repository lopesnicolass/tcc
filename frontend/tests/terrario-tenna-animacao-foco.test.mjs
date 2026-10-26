import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync(new URL('../src/terrario/Terrario.jsx', import.meta.url), 'utf8');

test('Tenna so anima quando o cronometro roda fora do modo decoracao', () => {
  assert.match(jsx, /import \{ deveAnimarTenna \} from '\.\/comportamentoFoco\.js'/);
  assert.match(jsx, /const animarTenna = deveAnimarTenna\(status, decorate, remaining\)/);
  assert.equal((jsx.match(/<TennaAnt animar=\{animarTenna\} \/>/g) || []).length, 3,
    'as tres salas devem usar a regra de animacao vinculada ao estado real do foco');
  assert.match(jsx, /src=\{animar \? tennaAnimada : tennaParada\}/);
  assert.doesNotMatch(jsx, /<TennaAnt animar=\{!decorate\} \/>/);
});

test('preferencia de movimento reduzido sempre apresenta a imagem estatica', () => {
  assert.match(jsx, /<source media="\(prefers-reduced-motion: reduce\)" srcSet=\{tennaParada\}/);
});

test('temporizador inicia com a duracao selecionada e um assunto livre aceito no servidor', () => {
  assert.match(jsx, /duracao: duration/);
  assert.match(jsx, /const materia = 'Estudo livre'/);
  assert.doesNotMatch(jsx, /setMateria\(/);
  assert.doesNotMatch(jsx, /id="terr-materia"/);
});
