import { ajustarEscala, posicionarItemNaZona } from './posicionamentoItens.js';

// Decoração temporária: nunca chama a API de compras ou altera as sementes.
// O estado é isolado por aluno e fica somente no armazenamento deste navegador.
export const TEST_STORAGE_PREFIX = 'tenna_terrario_decora_teste_v1_';

// Migra apenas posicionamentos que ainda coincidem com os antigos padrões.
// Se o aluno arrastou um móvel, a posição personalizada permanece intacta.
export function posicaoPadraoCompat(item, ponto) {
  if (!ponto) return item;
  if (item.id === 's2_cadeira' && ponto.x === 50 && ponto.y === 75) return item;
  if (item.id === 's2_estante' && ponto.x === 74 && ponto.y === 63) return item;
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
      visible: itens.filter((item) => salvo.visible.includes(item.id)).map((item) => item.id),
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
