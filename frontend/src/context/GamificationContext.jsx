import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

const GamificationContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

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
  'Sou ETECAMP'
];

// XP necessário para entrar no próximo nível.
export function xpForLevel(level) {
  return level * 100;
}

function calcLevel(xp) {
  let level = 1;
  let remaining = Math.max(0, Number(xp) || 0);

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNext: xpForLevel(level)
  };
}

function getToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token')
  );
}

const XP_ACTIONS = {
  'simulado iniciado': 'simulado_iniciado',
  'simulado concluído': 'simulado_concluido',
  'flashcard revisado': 'flashcard_revisado',
  'novo post-it': 'novo_postit',
  'semana adicionada ao cronograma': 'semana_cronograma',
  'atividade concluída': 'atividade_concluida'
};

export function GamificationProvider({ children }) {
  const [state, setState] = useState({
    xp: 0,
    streak: 0,
    lastActiveDate: null
  });

  const [toast, setToast] = useState(null);

  // Evita duas requisições idênticas simultâneas causadas por
  // duplo clique ou por uma mesma ação disparada duas vezes.
  const requestsEmAndamento = useRef(new Set());

  const carregarGamificacao = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setState({ xp: 0, streak: 0, lastActiveDate: null });
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/gamificacao`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        throw new Error(`Erro ${resposta.status} ao buscar gamificação`);
      }

      const dados = await resposta.json();

      setState({
        xp: Number(dados.xp) || 0,
        streak: Number(dados.streak) || 0,
        lastActiveDate: dados.lastActiveDate || null
      });
    } catch (erro) {
      console.error('Erro ao carregar XP:', erro);
    }
  }, []);

  useEffect(() => {
    carregarGamificacao();
  }, [carregarGamificacao]);

  useEffect(() => {
    const atualizarGamificacao = () => carregarGamificacao();

    window.addEventListener('etecamp-login', atualizarGamificacao);

    return () => {
      window.removeEventListener('etecamp-login', atualizarGamificacao);
    };
  }, [carregarGamificacao]);

  async function addXP(amount, reason) {
    const token = getToken();

    if (!token) {
      console.warn('Usuário não está logado.');
      return;
    }

    const action = XP_ACTIONS[reason];

    if (!action) {
      console.error(`Ação de XP não cadastrada: ${reason}`);
      return;
    }

    const requestKey = `${action}`;

    if (requestsEmAndamento.current.has(requestKey)) {
      return;
    }

    requestsEmAndamento.current.add(requestKey);

    try {
      const resposta = await fetch(`${API_URL}/gamificacao/xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        console.error('Erro ao adicionar XP:', dados);
        return;
      }

      setState({
        xp: Number(dados.xp) || 0,
        streak: Number(dados.streak) || 0,
        lastActiveDate: dados.lastActiveDate || null
      });

      setToast({
        amount: Number(dados.gainedXP) || Number(amount) || 0,
        reason,
        key: Date.now()
      });
    } catch (erro) {
      console.error('Erro ao enviar XP:', erro);
    } finally {
      requestsEmAndamento.current.delete(requestKey);
    }
  }

  const {
    level,
    xpIntoLevel,
    xpForNext
  } = calcLevel(state.xp);

  const title =
    LEVEL_TITLES[
      Math.min(level - 1, LEVEL_TITLES.length - 1)
    ];

  return (
    <GamificationContext.Provider
      value={{
        xp: state.xp,
        streak: state.streak,
        level,
        title,
        xpIntoLevel,
        xpForNext,
        addXP,
        toast,
        clearToast: () => setToast(null),
        recarregarGamificacao: carregarGamificacao
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
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
