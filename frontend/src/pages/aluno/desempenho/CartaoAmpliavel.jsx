import { cloneElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Reutiliza o próprio card no modal, sem um layout alternativo. */
export function CartaoAmpliavel({ titulo, tamanho = 'normal', children }) {
  const [aberto, setAberto] = useState(false);
  const botaoFecharRef = useRef(null);
  const caixaRef = useRef(null);
  const gatilhoRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botaoFecharRef.current?.focus();
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        setAberto(false);
        return;
      }
      if (evento.key === 'Tab' && caixaRef.current) {
        const focaveis = [...caixaRef.current.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
          .filter((el) => el.getClientRects().length > 0);
        if (!focaveis.length) return;
        if (evento.shiftKey && document.activeElement === focaveis[0]) {
          evento.preventDefault();
          focaveis[focaveis.length - 1].focus();
        } else if (!evento.shiftKey && document.activeElement === focaveis[focaveis.length - 1]) {
          evento.preventDefault();
          focaveis[0].focus();
        }
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', aoTeclar);
      gatilhoRef.current?.focus?.();
    };
  }, [aberto]);

  const abrir = () => {
    const ativo = document.activeElement;
    gatilhoRef.current = cardRef.current?.contains(ativo) ? ativo : cardRef.current;
    setAberto(true);
  };
  const aoClicar = (evento) => {
    if (evento.target.closest('a, input, select, textarea, [role="button"], [data-sem-ampliacao]')) return;
    if (evento.target.closest('button')) return;
    abrir();
  };
  const aoTeclarCard = (evento) => {
    if (evento.target !== evento.currentTarget) return;
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      abrir();
    }
  };
  const classe = `${children.props.className || ''} desempenho-card-ampliavel`;
  const cardOriginal = cloneElement(children, {
    className: classe,
    ref: cardRef,
    tabIndex: 0,
    'aria-label': `${titulo}. Pressione Enter para ampliar`,
    'aria-haspopup': 'dialog',
    onClick: (evento) => { children.props.onClick?.(evento); if (!evento.defaultPrevented) aoClicar(evento); },
    onKeyDown: (evento) => { children.props.onKeyDown?.(evento); if (!evento.defaultPrevented) aoTeclarCard(evento); }
  });

  return <>
    {cardOriginal}
    {aberto && createPortal(
      <div className="desempenho-page desempenho-ampliacao-overlay" onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) setAberto(false);
      }}>
        <div className={`desempenho-ampliacao-dialog desempenho-ampliacao-dialog--${tamanho}`} ref={caixaRef}
          role="dialog" aria-modal="true" aria-label={titulo}>
          {cloneElement(children, { className: classe })}
          <button ref={botaoFecharRef} className="desempenho-ampliacao-fechar" type="button"
            onClick={() => setAberto(false)} aria-label={`Fechar ${titulo}`} title="Fechar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
      </div>, document.body
    )}
  </>;
}
