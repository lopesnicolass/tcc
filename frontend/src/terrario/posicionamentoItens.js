// Mantém os objetos dentro da toca; móveis de parede não podem ir para o chão.
// As posições são porcentagens relativas à imagem, estáveis em desktop e celular.
export const ZONAS = Object.freeze({
  chao: { xMin: 12, xMax: 88, yMin: 56, yMax: 86 },
  tapete: { xMin: 22, xMax: 78, yMin: 66, yMax: 85 },
  parede: { xMin: 22, xMax: 78, yMin: 26, yMax: 50 },
  pendurado: { xMin: 15, xMax: 85, yMin: 26, yMax: 55 },
});

export function limitesItem(zona = 'chao') {
  return ZONAS[zona] || ZONAS.chao;
}
export function posicionarNaZona(ponto, zona = 'chao') {
  const { xMin, xMax, yMin, yMax } = limitesItem(zona);
  const x = Number.isFinite(ponto?.x) ? ponto.x : (xMin + xMax) / 2;
  const y = Number.isFinite(ponto?.y) ? ponto.y : (yMin + yMax) / 2;
  return {
    x: Math.round(Math.max(xMin, Math.min(xMax, x)) * 100) / 100,
    y: Math.round(Math.max(yMin, Math.min(yMax, y)) * 100) / 100,
  };
}

// Escala individual da decoração (65% a 150% do tamanho padrão).
// Mantém o ponto de apoio inferior do móvel, para não flutuar ao redimensionar.
export const ESCALA_MIN = 0.6;
export const ESCALA_MAX = 1.5;
export function ajustarEscala(valor) {
  if (!Number.isFinite(valor)) return 1;
  return Math.round(Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, valor)) * 10) / 10;
}

// Posições que realmente encostam no encontro da parede com o chão.
// Usadas como valores padrão e pelo botão de alinhar. Paredes continuam editáveis.
export const PAREDE_POSICOES = Object.freeze({
  mesa: Object.freeze({ x: 50, y: 56 }),
  prateleira: Object.freeze({ x: 26, y: 36 }),
  guarda_roupa: Object.freeze({ x: 59, y: 51 }),
  s2_mesa: Object.freeze({ x: 50, y: 62 }),
});
export function posicaoEncostada(id) {
  return PAREDE_POSICOES[id] || null;
}

// Uma peça aumentada não deve poder sair pelas laterais do quadro.
// O limite ainda respeita a região própria de chão/parede.
export function limitesParaItem(item, escala = 1) {
  const base = limitesItem(item?.zone);
  // Limites especiais para objetos que devem ocupar a parte superior do ninho.
  // A regra permanece isolada dos outros móveis das Salas 1 e 3.
  const excecoes = {
    guarda_roupa: { yMin: 42 },
    s2_mesa: { yMin: 43 },
    s2_luzes: { yMin: 12 },
    s2_planta: { yMin: 16 },
    // Relógio e calendário acompanham a faixa curva à direita na Sala 3.
    s3_relogio: { xMax: 88 },
    s3_calendario: { xMax: 88, yMax: 55 },
  };
  const zona = { ...base, ...(excecoes[item?.id] || {}) };
  const metade = Math.max(0, (item?.width || 0) * ajustarEscala(escala) / 2);
  return {
    ...zona,
    xMin: Math.max(zona.xMin, metade + 2),
    xMax: Math.min(zona.xMax, 98 - metade),
  };
}
export function posicionarItemNaZona(ponto, item, escala = 1) {
  const { xMin, xMax, yMin, yMax } = limitesParaItem(item, escala);
  return { x: Math.round(Math.max(xMin, Math.min(xMax, ponto.x)) * 100) / 100,
    y: Math.round(Math.max(yMin, Math.min(yMax, ponto.y)) * 100) / 100 };
}
