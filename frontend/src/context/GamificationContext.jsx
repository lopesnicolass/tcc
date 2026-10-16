import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import { request, obterToken } from '../services/api.js';
import { GamificationContext, LEVEL_TITLES, xpForLevel } from './GamificationShared.js';

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

export function GamificationProvider({ children }) {
  const [state, setState] = useState({
    xp: 0,
    streak: 0,
    lastActiveDate: null
  });

  const [toast, setToast] = useState(null);
  const clearToast = useCallback(() => setToast(null), []);

  const xpAtualRef = useRef(0);
  const atividadeRegistradaData = useRef(null);
  const registrarAtividadeEmAndamento = useRef(false);

  const carregarGamificacao = useCallback(async (motivo = '') => {
    const token = obterToken();

    if (!token) {
      atividadeRegistradaData.current = null;
      registrarAtividadeEmAndamento.current = false;
      xpAtualRef.current = 0;
      setState({ xp: 0, streak: 0, lastActiveDate: null });
      return;
    }

    try {
      const dados = await request('/gamificacao');

      const xpAtualizado = Number(dados.xp) || 0;
      const ganho = Math.max(0, xpAtualizado - xpAtualRef.current);
      xpAtualRef.current = xpAtualizado;
      setState({
        xp: xpAtualizado,
        streak: Number(dados.streak) || 0,
        lastActiveDate: dados.lastActiveDate || null
      });
      // A interface apenas exibe o ganho confirmado pelo servidor.
      if (motivo && ganho > 0) {
        setToast({ amount: ganho, reason: motivo, key: Date.now() });
      }
    } catch (erro) {
      console.error('Erro ao carregar XP:', erro);
    }
  }, []);

  useEffect(() => {
    const iniciar = setTimeout(() => { void carregarGamificacao(); }, 0);
    return () => clearTimeout(iniciar);
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
        lastActiveDate: state.lastActiveDate,
        level,
        title,
        xpIntoLevel,
        xpForNext,
        registrarAtividade,
        toast,
        clearToast,
        recarregarGamificacao: carregarGamificacao
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

