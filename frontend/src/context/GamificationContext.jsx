import { createContext, useContext, useState, useEffect } from 'react';

const GamificationContext = createContext(null);

const LEVEL_TITLES = [
  'Iniciante', 'Aplicado', 'Focado', 'Dedicado',
  'Disciplinado', 'Avançado', 'Estrategista', 'Passei Direto', 'Mestre ETEC', 'Sou ETECAMP'
];

function xpForLevel(level) {
  return level * 100;
}

function calcLevel(xp) {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpForLevel(level) };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem('etecamp_gamification');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignora erro de leitura
  }
  return { xp: 0, streak: 0, lastActiveDate: null };
}

export function GamificationProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('etecamp_gamification', JSON.stringify(state));
  }, [state]);

  function addXP(amount, reason) {
    setState((prev) => {
      const today = todayStr();
      let streak = prev.streak;

      if (prev.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        streak = prev.lastActiveDate === yStr ? prev.streak + 1 : 1;
      }

      return { xp: prev.xp + amount, streak, lastActiveDate: today };
    });

    setToast({ amount, reason, key: Date.now() });
  }

  const { level, xpIntoLevel, xpForNext } = calcLevel(state.xp);
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const value = {
    xp: state.xp,
    streak: state.streak,
    level,
    title,
    xpIntoLevel,
    xpForNext,
    addXP,
    toast,
    clearToast: () => setToast(null),
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification precisa estar dentro de GamificationProvider');
  return ctx;
}