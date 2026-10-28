import { useEffect, useRef } from 'react';

// O guia apresenta somente o necessário; regras reais de sessão, XP e
// desbloqueio continuam nos módulos de foco e no servidor.
export const ETAPAS_GUIA_TERRARIO = [
  {
    tema: 'foco',
    titulo: 'Estude com a Tenna',
    descricao: 'Escolha seu tempo, ajuste com + ou − e comece o foco.',
  },
  {
    tema: 'sementes',
    titulo: 'Ganhe sementes',
    descricao: 'Ganhe 2 sementes a cada 15 minutos completos de foco.',
  },
  {
    tema: 'decoracao',
    titulo: 'Monte seu cantinho',
    descricao: 'Abra Decorar sala, escolha móveis e arraste para organizar.',
  },
  {
    tema: 'salas',
    titulo: 'Descubra novas salas',
    descricao: 'Complete 5 sessões válidas para liberar Estudos ou 10 para liberar Prova. Cada uma deve durar pelo menos 15 minutos.',
  },
];

export function chaveGuiaTerrario(usuario) {
  return `tenna_terrario_guia_v1_${usuario}`;
}

function IconeDoGuia({ tema }) {
  const comum = {
    width: 66,
    height: 66,
    viewBox: '0 0 72 72',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '3.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (tema === 'foco') return (
    <svg {...comum}>
      <circle cx="36" cy="39" r="23" fill="#fffaf0" />
      <path d="M36 25v15l10 7M30 8h12M36 8v7M17 19l-5-5M55 19l5-5" />
      <path d="M13 49c-5-2-7-6-8-11 6 0 10 2 12 7M55 53c6-2 10-6 12-12-7 0-12 3-14 8" stroke="#6d9f55" strokeWidth="2.6" />
    </svg>
  );
  if (tema === 'sementes') return (
    <svg {...comum}>
      <path d="M36 60V28M36 42c-12-14-23-14-27-28 17-2 27 8 27 23M36 35c7-16 17-20 28-18-3 13-12 22-28 23" fill="#a8ce82" />
      <path d="M20 61c7-7 25-7 33 0" stroke="#8e6a48" />
      <path d="M29 53c-5-6-11-7-15-5 2 8 8 11 15 12M45 54c5-6 10-8 15-7-2 8-8 12-15 13" fill="#cae6a4" strokeWidth="2.5" />
    </svg>
  );
  if (tema === 'decoracao') return (
    <svg {...comum}>
      <path d="M14 57v-19c0-5 4-9 9-9h26c5 0 9 4 9 9v19" fill="#d8aa74" />
      <path d="M13 48h46v10H13z" fill="#c48c59" />
      <path d="M20 58v7M52 58v7M24 47V35M48 47V35" />
      <path d="M31 29V18M31 20c-6-1-11-4-12-10 9-1 13 3 12 10M31 20c5-7 10-10 17-9-1 7-7 10-17 9" fill="#94c66c" stroke="#537a35" strokeWidth="2.8" />
    </svg>
  );
  return (
    <svg {...comum}>
      <rect x="14" y="26" width="44" height="36" rx="8" fill="#e2af77" />
      <path d="M10 29 36 10l26 19M29 62V37h14v25" fill="#f5e0ba" />
      <path d="M36 12v-6M34 18l-6-5M38 18l6-5" stroke="#6eaa57" strokeWidth="2.5" />
      <circle cx="48" cy="40" r="3" fill="#fff8e8" stroke="none" />
    </svg>
  );
}

export default function GuiaTerrario({ etapa, definirEtapa, fechar }) {
  const dialogRef = useRef(null);
  const primeiroFocoRef = useRef(null);
  const passo = ETAPAS_GUIA_TERRARIO[etapa];
  const ultimoPasso = etapa === ETAPAS_GUIA_TERRARIO.length - 1;

  useEffect(() => {
    const anterior = document.activeElement;
    primeiroFocoRef.current?.focus();
    function teclado(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        fechar();
      }
      if (evento.key !== 'Tab') return;
      const controles = Array.from(dialogRef.current?.querySelectorAll('button:not([disabled])') || []);
      if (!controles.length) return;
      const primeiro = controles[0];
      const ultimo = controles[controles.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', teclado);
    return () => {
      document.removeEventListener('keydown', teclado);
      if (anterior?.isConnected && typeof anterior.focus === 'function') anterior.focus();
    };
  }, [fechar]);

  return (
    <div className="terr-guide-backdrop" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget) fechar();
    }}>
      <section className={`terr-guide-dialog is-${passo.tema}`} id="terr-guia-dialog" ref={dialogRef}
        role="dialog" aria-modal="true" aria-labelledby="terr-guide-title" aria-describedby="terr-guide-description">
        <div className="terr-guide-topbar">
          <span className="terr-guide-eyebrow">GUIA DO TERRÁRIO</span>
          <button ref={primeiroFocoRef} type="button" className="terr-guide-close" onClick={fechar} aria-label="Fechar guia" title="Fechar guia">×</button>
        </div>
        <div className="terr-guide-progress" aria-label={`Passo ${etapa + 1} de ${ETAPAS_GUIA_TERRARIO.length}`}>
          {ETAPAS_GUIA_TERRARIO.map((item, indice) => (
            <span key={item.titulo} className={indice <= etapa ? 'active' : ''} />
          ))}
        </div>
        <div className="terr-guide-content" aria-live="polite" aria-atomic="true">
          <div className="terr-guide-illustration" aria-hidden="true"><IconeDoGuia tema={passo.tema} /></div>
          <div className="terr-guide-copy">
            <span className="terr-guide-step">PASSO {etapa + 1} DE {ETAPAS_GUIA_TERRARIO.length}</span>
            <h2 id="terr-guide-title">{passo.titulo}</h2>
            <p id="terr-guide-description" className="terr-guide-description">{passo.descricao}</p>
          </div>
        </div>
        <div className="terr-guide-actions">
          <button type="button" className="terr-guide-skip" onClick={fechar}>{ultimoPasso ? 'Fechar' : 'Pular guia'}</button>
          <div className="terr-guide-step-actions">
            {etapa > 0 && <button type="button" className="terr-guide-back" onClick={() => definirEtapa(etapa - 1)}>Voltar</button>}
            <button type="button" className="terr-guide-next" onClick={ultimoPasso ? fechar : () => definirEtapa(etapa + 1)}>
              {ultimoPasso ? 'Entendi!' : 'Próximo'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
