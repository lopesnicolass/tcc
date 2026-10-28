import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../services/api.js';
import { remainingFromServer } from '../terrario/focusClock.js';
import { useGamification } from '../context/GamificationShared.js';
import './FocoNoSite.css';

function formatarTempo(segundos) {
  const tempo = Math.max(0, Math.ceil(segundos));
  return `${String(Math.floor(tempo / 60)).padStart(2, '0')}:${String(tempo % 60).padStart(2, '0')}`;
}

/**
 * Indicador compacto de foco da sidebar. A sessão é iniciada no Terrário;
 * este componente só acompanha, pausa e retoma a MESMA sessão no servidor.
 * Por permanecer montado na Sidebar, ele observa a troca de abas mesmo que
 * o usuário esteja lendo Conteúdos, FlashCards ou outra página do TENNA.
 */
export default function FocoNoSite({ onFocusRunningChange, onToggleCleanFocus, cleanFocus = false }) {
  const navigate = useNavigate();
  const { recarregarGamificacao } = useGamification();
  const [snapshot, setSnapshot] = useState(null);
  const snapshotRef = useRef(null);
  const [agora, setAgora] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const emOperacaoRef = useRef(false);
  const autoPausaRef = useRef(false);
  const mountedRef = useRef(true);
  const sequenciaRef = useRef(0);
  const estadoAnteriorRef = useRef(null);

  const aplicarEstado = useCallback((data) => {
    const recebidoEm = Date.now();
    snapshotRef.current = { data, recebidoEm };
    if (!mountedRef.current) return;
    setSnapshot({ data, recebidoEm });
    setAgora(recebidoEm);
    if (estadoAnteriorRef.current === 'em_andamento' && data?.sessao?.estado === 'concluida') {
      void recarregarGamificacao?.('Sessão de foco concluída');
    }
    estadoAnteriorRef.current = data?.sessao?.estado ?? null;
    setErro('');
  }, [recarregarGamificacao]);

  const atualizarEstado = useCallback(async () => {
    if (emOperacaoRef.current || autoPausaRef.current) return;
    const sequencia = ++sequenciaRef.current;
    try {
      const data = await request('/terrario/estado');
      if (mountedRef.current && sequencia === sequenciaRef.current && !emOperacaoRef.current && !autoPausaRef.current) {
        aplicarEstado(data);
      }
    } catch {
      if (mountedRef.current && sequencia === sequenciaRef.current) {
        setErro('Não foi possível consultar o foco.');
      }
    }
  }, [aplicarEstado]);

  const pausarAoSair = useCallback(async () => {
    const sessao = snapshotRef.current?.data?.sessao;
    if (sessao?.estado !== 'em_andamento' || !sessao.id || autoPausaRef.current || emOperacaoRef.current) return;
    autoPausaRef.current = true;
    ++sequenciaRef.current;
    try {
      // keepalive permite enviar a pausa até ao sair da página do TENNA.
      const data = await request(`/terrario/foco/${sessao.id}/pausar`, { method: 'POST', keepalive: true });
      aplicarEstado(data);
      window.dispatchEvent(new Event('tenna:focus-updated'));
    } catch {
      if (mountedRef.current && !document.hidden) setErro('Não foi possível pausar automaticamente. Confira a sessão.');
    } finally {
      autoPausaRef.current = false;
      if (mountedRef.current && !document.hidden) void atualizarEstado();
    }
  }, [aplicarEstado, atualizarEstado]);

  useEffect(() => {
    mountedRef.current = true;
    void atualizarEstado();
    const sincronizar = (event) => {
      // Receber imediatamente a sessão iniciada no Terrário evita perder a
      // pausa se a pessoa trocar de aba logo após clicar em Começar foco.
      if (event?.type === 'tenna:focus-updated' && event.detail?.sessao) {
        aplicarEstado(event.detail);
        if (document.hidden) void pausarAoSair();
        return;
      }
      if (!document.hidden && !autoPausaRef.current) void atualizarEstado();
    };
    const aoOcultar = () => {
      if (document.hidden) void pausarAoSair();
      else sincronizar();
    };
    const aoPerderFoco = () => {
      if (!document.hasFocus()) void pausarAoSair();
    };
    // Navegar para outra rota dentro do TENNA não pausa: somente deixar a aba/janela.
    document.addEventListener('visibilitychange', aoOcultar);
    window.addEventListener('blur', aoPerderFoco);
    window.addEventListener('pagehide', pausarAoSair);
    window.addEventListener('focus', sincronizar);
    window.addEventListener('tenna:focus-updated', sincronizar);
    return () => {
      mountedRef.current = false;
      ++sequenciaRef.current;
      document.removeEventListener('visibilitychange', aoOcultar);
      window.removeEventListener('blur', aoPerderFoco);
      window.removeEventListener('pagehide', pausarAoSair);
      window.removeEventListener('focus', sincronizar);
      window.removeEventListener('tenna:focus-updated', sincronizar);
    };
  }, [aplicarEstado, atualizarEstado, pausarAoSair]);

  const sessao = snapshot?.data?.sessao;
  const rodando = sessao?.estado === 'em_andamento';
  const pausada = sessao?.estado === 'pausada';
  const ativa = rodando || pausada;
  const restante = ativa ? remainingFromServer(snapshot.data, snapshot.recebidoEm, agora) : 0;

  // A tela limpa só pode permanecer ativa enquanto o cronômetro roda.
  // Ao pausar (inclusive quando outra aba recebe foco), o layout é restaurado.
  useEffect(() => {
    onFocusRunningChange?.(rodando);
  }, [rodando, onFocusRunningChange]);

  useEffect(() => {
    if (!rodando) return undefined;
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [rodando]);
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (!document.hidden) void atualizarEstado();
    }, ativa ? 8000 : 30000);
    return () => window.clearInterval(intervalo);
  }, [ativa, atualizarEstado]);

  async function controlarSessao() {
    if (emOperacaoRef.current || autoPausaRef.current || !sessao?.id || !ativa) return;
    emOperacaoRef.current = true;
    setBusy(true);
    setErro('');
    ++sequenciaRef.current;
    try {
      const acao = rodando ? 'pausar' : 'continuar';
      const data = await request(`/terrario/foco/${sessao.id}/${acao}`, { method: 'POST' });
      if (mountedRef.current) {
        aplicarEstado(data);
        window.dispatchEvent(new Event('tenna:focus-updated'));
      }
    } catch (e) {
      if (mountedRef.current) setErro(e.message || 'Não foi possível atualizar o foco.');
    } finally {
      emOperacaoRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }

  // Não cria um segundo lugar para iniciar foco: a opção continua no Terrário.
  if (!ativa) return null;
  return (
    <section className={`tenna-sidebar-focus ${rodando ? 'is-running' : 'is-paused'}`} aria-label="Status do modo foco">
      <button type="button" className="tenna-sidebar-focus-open" title={`Modo foco ${rodando ? 'ativo' : 'pausado'} · ${formatarTempo(restante)} · Abrir Terrário`}
        onClick={() => navigate('/terrario')}>
        <span className="tenna-sidebar-focus-symbol" aria-hidden="true" />
        <span className="tenna-sidebar-focus-copy">
          <strong>{rodando ? 'Foco ativo' : 'Foco pausado'}</strong>
          <small>{formatarTempo(restante)}</small>
        </span>
      </button>
      <button type="button" className="tenna-sidebar-focus-action" onClick={() => void controlarSessao()} disabled={busy}
        title={rodando ? 'Pausar sessão' : 'Retomar sessão'}>{rodando ? 'Pausar' : 'Retomar'}</button>
      {rodando && (
        <button type="button" className="tenna-sidebar-focus-clean"
          title={cleanFocus ? 'Mostrar menu' : 'Tela limpa: esconder menu e centralizar conteúdo'}
          aria-label={cleanFocus ? 'Desativar tela limpa' : 'Ativar tela limpa'}
          aria-pressed={cleanFocus}
          onClick={onToggleCleanFocus}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4M21 16v4a1 1 0 0 1-1 1h-4" />
          </svg>
        </button>
      )}
      {erro && <span className="tenna-sidebar-focus-error" role="alert">{erro}</span>}
    </section>
  );
}
