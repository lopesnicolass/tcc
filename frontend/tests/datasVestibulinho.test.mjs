import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarDataImportante, ehVestibulinho, ordenarDatasImportantes, linkOficialSeguro, tipoMarcoVestibulinho, rotuloMarcoVestibulinho } from '../src/utils/datasVestibulinho.js';

test('exibe a data civil sem antecipar ou atrasar um dia', () => {
  assert.equal(formatarDataImportante('2026-11-29', { day: '2-digit', month: '2-digit', year: 'numeric' }), '29/11/2026');
  assert.equal(formatarDataImportante('2026-02-30'), 'Data não informada');
});

test('a prova é diferente da inscrição e do resultado do Vestibulinho', () => {
  assert.ok(ehVestibulinho({ titulo: 'Prova do Vestibulinho', tipo: 'Prova' }));
  assert.ok(ehVestibulinho({ titulo: 'Prova ETEC', tipo: 'Vestibulinho' }));
  assert.equal(ehVestibulinho({ titulo: 'Inscrições do Vestibulinho', tipo: 'Inscrições' }), false);
  assert.equal(ehVestibulinho({ titulo: 'Resultado Vestibulinho', tipo: 'Resultado' }), false);
});

test('lista todas as datas, incluindo as encerradas após as futuras', () => {
  const datas = [
    { id: 1, data: '2026-10-01' },
    { id: 2, data: '2026-12-02' },
    { id: 3, data: '2026-11-03' },
    { id: 4, data: '2026-09-12' },
  ];
  assert.deepEqual(ordenarDatasImportantes(datas, '2026-10-28').map((a) => a.id), [3, 2, 1, 4]);
  assert.deepEqual(ordenarDatasImportantes([], '2026-10-28'), []);
});


test('aceita somente links oficiais HTTP(S) e protege contra protocolos inseguros', () => {
  assert.equal(linkOficialSeguro('https://vestibulinho.etec.sp.gov.br/'), 'https://vestibulinho.etec.sp.gov.br/');
  assert.equal(linkOficialSeguro('javascript:alert(1)'), null);
  assert.equal(linkOficialSeguro('file:///secret'), null);
  assert.equal(linkOficialSeguro(''), null);
  assert.equal(linkOficialSeguro('link incompleto'), null);
});


test('identifica início, fim e prova com ícones distintos sem confundir inscrições', () => {
  assert.equal(tipoMarcoVestibulinho({ titulo: 'Início das Inscrições', tipo: 'Inscrições' }), 'inscricoes-inicio');
  assert.equal(tipoMarcoVestibulinho({ titulo: 'Fim das Inscrições', tipo: 'Inscrições' }), 'inscricoes-fim');
  assert.equal(tipoMarcoVestibulinho({ titulo: 'Vestibulinho', tipo: 'Vestibulinho' }), 'prova');
  assert.equal(tipoMarcoVestibulinho({ titulo: 'Gabarito oficial', tipo: 'Resultado' }), 'outro');
  assert.equal(rotuloMarcoVestibulinho('inscricoes-fim'), 'Fim das inscrições');
});
