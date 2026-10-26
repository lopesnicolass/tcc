import { ajustarEscala, posicionarItemNaZona } from './posicionamentoItens.js';

// Decoração temporária: nunca chama a API de compras ou altera as sementes.
// O estado é isolado por aluno e fica somente no armazenamento deste navegador.
export const TEST_STORAGE_PREFIX = 'tenna_terrario_decora_teste_v1_';

// Migra apenas posicionamentos que ainda coincidem com os antigos padrões.
// Se o aluno arrastou um móvel, a posição personalizada permanece intacta.
// Posições antigas, usadas apenas para atualizar disposições automáticas.
// Os móveis movidos manualmente mantêm suas coordenadas.
const ANTIGO_PADRAO_SALA3 = Object.freeze({
  s3_mesa: [[42,76],[38,66],[44,79],[43,80]],
  // Somente posições exatas usadas nas versões antigas são migradas.
  s3_lousa: [[32,44],[30,48],[29,44],[30,47],[30,41]],
  s3_relogio: [[77,33],[78,31],[80,33],[77,32],[78,32],[82,31]],
  s3_mochila: [[23,79],[24,83],[22,84]],
  s3_kit: [[81,80],[62,85],[52,67],[53,68]],
  s3_calendario: [[77,50],[67,36],[78,50],[80,49],[77,49],[82,51]],
  s3_painel: [[57,44],[46,35],[58,43],[57,43],[59,45],[59,39]],
  s3_tapete: [[53,83],[49,85],[43,85]],
});
const ANTIGO_PADRAO_SALA2 = Object.freeze({
  s2_mesa: [[36,66],[50,60],[50,65]], s2_cadeira: [[36,73],[50,75]],
  s2_estante: [[76,68],[74,63],[26,72]], s2_mural:[[49,35]],
  s2_calendario:[[69,36]], s2_globo:[[26,79]], s2_puff:[[64,81],[77,81]],
  s2_planta:[[84,38],[82,43],[79,43]], s2_luzes:[[48,29],[49,25],[49,26]], s2_caixa:[[81,80]],
  s2_tapete_redondo:[[53,83]], s2_vaso:[[18,68]],
  s2_livros:[[52,81]], s2_avisos:[[29,39]],
});
const ITEMS_NOVOS_SALA3 = ['s3_mesa','s3_lousa','s3_relogio','s3_mochila','s3_kit','s3_calendario','s3_painel','s3_tapete'];
const DESTAQUES_SALA2_IDS = new Set([
  's2_luzes','s2_estante','s2_mural','s2_calendario','s2_mesa',
  's2_globo','s2_puff','s2_planta','s2_caixa','s2_tapete_redondo',
]);

export function posicaoPadraoCompat(item, ponto) {
  if (!ponto) return item;
  if (ANTIGO_PADRAO_SALA2[item.id]?.some(([x,y]) => ponto.x===x && ponto.y===y) ||
      ANTIGO_PADRAO_SALA3[item.id]?.some(([x,y]) => ponto.x===x && ponto.y===y)) return item;
  return ponto;
}

export function baseTeste(itens, inventario = []) {
  return {
    iniciado: true,
    visible: inventario.filter((item) => item.equipado && itens.some((i) => i.id === item.id)).map((item) => item.id),
    scales: Object.fromEntries(itens.map((item) => {
      const salvo = inventario.find((owned) => owned.id === item.id);
      return [item.id, ajustarEscala(salvo?.escala ?? 1)];
    })),
    positions: Object.fromEntries(itens.map((item) => {
      const salvo = inventario.find((owned) => owned.id === item.id);
      return [item.id, posicionarItemNaZona(posicaoPadraoCompat(item, { x: salvo?.x ?? item.x, y: salvo?.y ?? item.y }), item, salvo?.escala ?? 1)];
    }))
  };
}

export function lerTeste(storage, chave, itens) {
  try {
    const texto = storage?.getItem(chave);
    if (!texto) return { iniciado: false, visible: [], positions: {}, scales: {} };
    const salvo = JSON.parse(texto);
    if (!salvo || !Array.isArray(salvo.visible) || typeof salvo.positions !== 'object' || !salvo.positions) throw Error('Invalido');
    return {
      iniciado: true,
      ...(typeof salvo.layoutSala3Completo === 'boolean' ? { layoutSala3Completo: salvo.layoutSala3Completo } : {}),
      ...(itens.some((i)=>i.id==='s3_mesa') ? {layoutSala3V2:true}:{}),
      // Uma prévia antiga com TODOS os objetos equipados é reorganizada uma vez.
      // Seleções pessoais parciais e móveis comprados nunca são descartados.
      visible: itens.filter((item) => {
        if (!salvo.visible.includes(item.id)) return false;
        const sala2 = (itens.length === 13 || itens.length === 14) && itens.every((i) => i.id.startsWith('s2_'));
        // A escrivaninha PNG aprovada já traz uma cadeira encaixada. Evita
        // a segunda cadeira na antiga montagem automática, sem apagar
        // cadeiras movidas ou colocadas manualmente pelo aluno.
        const cadeiraAuto = sala2 && !salvo.layoutV4 && item.id === 's2_cadeira'
          && salvo.visible.includes('s2_mesa')
          && (salvo.positions?.s2_cadeira?.x ?? 43) === 43
          && (salvo.positions?.s2_cadeira?.y ?? 69) === 69;
        if (cadeiraAuto) return false;
        // A carteira do vestibulinho já contém lápis, prova e porta-canetas.
        // Esconde apenas o kit colocado AUTOMATICAMENTE na versão anterior;
        // quem o escolheu individualmente continua com o item visível.
        const sala3 = itens.some((i) => i.id === 's3_mesa') && itens.some((i) => i.id === 's3_kit');
        const previaCompleta = sala3 && ITEMS_NOVOS_SALA3.every((id) => salvo.visible.includes(id));
        const kitPos = salvo.positions?.s3_kit;
        const kitAuto = sala3 && previaCompleta && !salvo.layoutSala3V2
          && item.id === 's3_kit' && salvo.visible.includes('s3_mesa')
          && (!kitPos || ANTIGO_PADRAO_SALA3.s3_kit.some(([x,y]) => kitPos.x === x && kitPos.y === y));
        if (kitAuto) return false;
        return !(sala2 && !salvo.layoutV3 && salvo.visible.length === 14 && !DESTAQUES_SALA2_IDS.has(item.id));
      }).map((item) => item.id),
      ...((itens.length === 13 || itens.length === 14) && itens.every((i) => i.id.startsWith('s2_')) ? {layoutV3:true, layoutV4:true}:{}),
      scales: Object.fromEntries(itens.map((item) => [item.id, ajustarEscala(salvo.scales?.[item.id] ?? 1)])),
      positions: Object.fromEntries(itens.map((item) => {
        const p = salvo.positions[item.id];
        const safe = p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : item;
        // Atualiza somente itens que ainda estavam exatamente na posição
        // padrão antiga. Deslocamentos feitos manualmente são preservados.
        const antigos = { mesa: [50, 61], prateleira: [27, 39] };
        const pos = posicaoPadraoCompat(item, antigos[item.id] && safe.x === antigos[item.id][0] && safe.y === antigos[item.id][1] ? item : safe);
        return [item.id, posicionarItemNaZona(pos, item, salvo.scales?.[item.id] ?? 1)];
      }))
    };
  } catch {
    return { iniciado: false, visible: [], positions: {}, scales: {} };
  }
}

export function alternarItemTeste(estado, id) {
  return {
    ...estado, iniciado: true,
    visible: estado.visible.includes(id) ? estado.visible.filter((atual) => atual !== id) : [...estado.visible, id]
  };
}

export function moverItemTeste(estado, id, ponto, itens) {
  const item = itens.find((i) => i.id === id);
  if (!item) return estado;
  return {
    ...estado, iniciado: true,
    visible: estado.visible.includes(id) ? estado.visible : [...estado.visible, id],
    positions: { ...estado.positions, [id]: posicionarItemNaZona(ponto, item, estado.scales?.[id] ?? 1) }
  };
}

export function redimensionarItemTeste(estado, id, escala, itens) {
  const item = itens.find((i) => i.id === id);
  if (!item) return estado;
  return {
    ...estado, iniciado: true,
    scales: { ...(estado.scales || {}), [id]: ajustarEscala(escala) },
    positions: { ...estado.positions, [id]: posicionarItemNaZona(estado.positions[id] || item, item, escala) }
  };
}

// Mostra todos os novos móveis da Sala 3 na prévia uma única vez. Atualizar
// o catálogo NÃO restaura itens guardados após a primeira visualização,
// e não descarta posições, escalas nem móveis antigos comprados.
export function prepararPreviaCompletaSala3(estado, itensNovos) {
  if (estado?.layoutSala3Completo) return estado;
  return {
    ...estado,
    iniciado: true,
    layoutSala3Completo: true,
    visible: [...new Set([...(estado?.visible || []), ...itensNovos.filter((item) => item.id !== 's3_kit').map((item) => item.id)])],
  };
}

// A montagem de teste reúne só a decoração principal aprovada. O kit de
// materiais é opcional porque a própria carteira já tem lápis e prova.
// Compras e posições personalizadas são preservadas fora do comando explícito.
export function montarAmbienteSala3(estado, itensNovos) {
  return {
    ...estado,
    iniciado: true,
    layoutSala3Completo: true,
    visible: itensNovos.filter((item) => item.id !== 's3_kit').map((item) => item.id),
    positions: { ...estado.positions, ...Object.fromEntries(itensNovos.map((item) => [item.id, { x: item.x, y: item.y }])) },
    scales: { ...estado.scales, ...Object.fromEntries(itensNovos.map((item) => [item.id, 1])) },
  };
}
