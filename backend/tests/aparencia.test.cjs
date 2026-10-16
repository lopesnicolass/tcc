const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizarAparencia, PADRAO } = require('../utils/aparenciaConteudo');

test('configuração antiga ou ausente usa padrões', () => {
  assert.deepEqual(normalizarAparencia(undefined), PADRAO);
  assert.deepEqual(normalizarAparencia('{}'), PADRAO);
});

test('salva apenas preferências permitidas com valores tipados', () => {
  const dados = normalizarAparencia({ tema: 'violeta', formato: 'cartoes', rotulo: ' Aula ', mensagem: ' Vamos aprender ', minutos: '18', mostrarIndice: false, CSS: 'javascript:alert(1)' });
  assert.deepEqual(dados, { ...PADRAO, tema: 'violeta', formato: 'cartoes', rotulo: 'Aula', mensagem: 'Vamos aprender', minutos: 18, mostrarIndice: false });
});

test('valida temas, tempo, índice e JSON malformado', () => {
  for (const entrada of [{ tema: 'url(' }, { formato: 'arbitrario' }, { minutos: 0 }, { minutos: 181 }, { mostrarIndice: 'false' }, '{'] ) {
    assert.throws(() => normalizarAparencia(entrada), TypeError);
  }
});
