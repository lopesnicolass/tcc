// Preserva a posição do móvel até existir um arrasto real.
// O movimento respeita a escala da sala em desktop e em telas de toque.
export function clampPosition(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function moverComDeslocamento(original, deltaX, deltaY, largura, altura, limits = { xMin: 12, xMax: 88, yMin: 56, yMax: 86 }) {
  if (![original?.x, original?.y, deltaX, deltaY, largura, altura].every(Number.isFinite) || largura <= 0 || altura <= 0) {
    return null;
  }
  return {
    x: Math.round(clampPosition(original.x + deltaX * 100 / largura, limits.xMin, limits.xMax) * 100) / 100,
    y: Math.round(clampPosition(original.y + deltaY * 100 / altura, limits.yMin, limits.yMax) * 100) / 100
  };
}

export function passouDoLimiteArrasto(inicialX, inicialY, atualX, atualY, minimoPixels = 6) {
  return Math.hypot(atualX - inicialX, atualY - inicialY) >= minimoPixels;
}
