import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import { request, obterToken } from '../services/api.js';

const GamificationContext = createContext(null);

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
  const atividadeRegistradaData = useRef(null);
  const registrarAtividadeEmAndamento = useRef(false);

  const carregarGamificacao = useCallback(async () => {
    const token = obterToken();

    if (!token) {
      atividadeRegistradaData.current = null;
      registrarAtividadeEmAndamento.current = false;
      setState({ xp: 0, streak: 0, lastActiveDate: null });
      return;
    }

    try {
      const dados = await request('/gamificacao');

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
    const atualizarGamificacao = () => {
      atividadeRegistradaData.current = null;
      registrarAtividadeEmAndamento.current = false;
      carregarGamificacao();
    };

    window.addEventListener('etecamp-login', atualizarGamificacao);

    return () => {
      window.removeEventListener('etecamp-login', atualizarGamificacao);
    };
  }, [carregarGamificacao]);

  useEffect(() => {
    const registrarInteracao = () => {
      const token = obterToken();
      if (!token) return;
      registrarAtividade();
    };

    window.addEventListener('pointerdown', registrarInteracao, { passive: true });
    window.addEventListener('keydown', registrarInteracao);
    window.addEventListener('scroll', registrarInteracao, { passive: true });
    window.addEventListener('input', registrarInteracao);

    return () => {
      window.removeEventListener('pointerdown', registrarInteracao);
      window.removeEventListener('keydown', registrarInteracao);
      window.removeEventListener('scroll', registrarInteracao);
      window.removeEventListener('input', registrarInteracao);
    };
  }, []);


  async function registrarAtividade() {
    const token = obterToken();

    const agora = new Date();
    const hojeNoCliente = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, '0'),
      String(agora.getDate()).padStart(2, '0')
    ].join('-');

    if (!token || atividadeRegistradaData.current === hojeNoCliente || registrarAtividadeEmAndamento.current) {
      return;
    }

    registrarAtividadeEmAndamento.current = true;

    try {
      const dados = await request('/gamificacao/atividade', {
        method: 'POST'
      });

      atividadeRegistradaData.current = hojeNoCliente;

      setState((atual) => ({
        ...atual,
        xp: Number(dados.xp) || atual.xp || 0,
        streak: Number(dados.streak) || 0,
        lastActiveDate: dados.lastActiveDate || null
      }));
    } catch (erro) {
      console.error('Erro ao registrar atividade:', erro);
    } finally {
      registrarAtividadeEmAndamento.current = false;
    }
  }


  async function addXP(amount, reason) {
    const token = obterToken();

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
      const dados = await request('/gamificacao/xp', {
        method: 'POST',
        body: JSON.stringify({ action })
      });

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
        registrarAtividade,
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
