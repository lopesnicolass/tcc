// Ícones SVG usados só na tela de Conteúdos do admin.
// Extraído de AdminConteudos.jsx (estava tudo junto no mesmo arquivo).

export function Icon({ name, size = 20 }) {
  const paths = {
    book: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V22m4-15h8m-8 4h8" />
    ),

    calculator: (
      <path d="M6 3h12v18H6V3Zm3 4h6M9 11h1m4 0h1M9 15h1m4 0h1M9 19h6" />
    ),

    globe: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2-2.3 3.3-5.3 3.3-9S14.2 5.3 12 3m0 18c-2.2-2.3-3.3-5.3-3.3-9S9.8 5.3 12 3M3 12h18" />
    ),

    flask: (
      <path d="M9 3h6m-5 0v6l-5.2 8.7A2.2 2.2 0 0 0 6.7 21h10.6a2.2 2.2 0 0 0 1.9-3.3L14 9V3m-5 10h6" />
    ),

    target: (
      <path d="M12 21a9 9 0 1 0-9-9m9 5a5 5 0 1 0-5-5m5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 0 6-6" />
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    edit: (
      <path d="m4 20 4-.9L19 8.1a2.1 2.1 0 0 0-3-3L5 16.1 4 20Zm10.5-13.5 3 3" />
    ),

    trash: (
      <path d="M4 7h16M10 11v5m4-5v5M9 7V4h6v3m-9 0 1 14h10l1-14" />
    ),

    chevron: (
      <path d="m6 9 6 6 6-6" />
    ),

    close: (
      <path d="M6 6l12 12M18 6 6 18" />
    ),

    refresh: (
      <path d="M20 11a8 8 0 0 0-14.8-3L3 11m0-5v5h5M4 13a8 8 0 0 0 14.8 3L21 13m0 5v-5h-5" />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
