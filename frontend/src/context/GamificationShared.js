import { createContext, useContext } from 'react';

export const GamificationContext = createContext(null);

export const LEVEL_TITLES = [
  'Iniciante',
  'Aplicado',
  'Focado',
  'Dedicado',
  'Disciplinado',
  'Avançado',
  'Estrategista',
  'Passei Direto',
  'Mestre ETEC',
  'Sou Tenna'
];

// XP necessário para entrar no próximo nível.
export function xpForLevel(level) {
  return level * 100;
}


export function useGamification() {
  const context = useContext(GamificationContext);

  if (!context) {
    throw new Error(
      'useGamification precisa estar dentro de GamificationProvider'
    );
  }

  return context;
}
