import logo from '../assets/tenna_logo.webp';

/** Cabeçalho exclusivo para telas pequenas: a navegação completa abre em painel. */
export default function MobileNavigationBar({ onOpen, label, menuId, expanded = false }) {
  return (
    <header className="tenna-mobile-topbar">
      <button
        type="button"
        className="tenna-mobile-menu-button"
        aria-label={`Abrir menu ${label}`}
        aria-controls={menuId}
        aria-expanded={expanded}
        onClick={onOpen}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <img src={logo} alt="Tenna" className="tenna-mobile-logo" />
      <span className="tenna-mobile-area-label">{label}</span>
    </header>
  );
}
