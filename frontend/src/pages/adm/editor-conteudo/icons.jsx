// Ícones SVG usados só dentro do Editor de Conteúdo.
// Extraído de EditorConteudo.jsx (estava tudo junto no mesmo arquivo).

export const ICONS = {
  arrowLeft: <path d="M19 12H5m7-7-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  save: (
    <path d="M5 4h11l3 3v13H5V4Zm3 0v5h7V4M8 20v-7h8v7" />
  ),
  trash: (
    <path d="M5 7h14M10 11v5m4-5v5M9 7l1-3h4l1 3m-8 0 .7 14h9.6L18 7" />
  ),
  edit: (
    <path d="m4 20 4-.9L19 8.1a2.1 2.1 0 0 0-3-3L5 16.1 4 20Zm10.5-13.5 3 3" />
  ),
  up: <path d="m18 15-6-6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 4 4L19 6" />,
  text: <path d="M5 5h14M12 5v14M8 19h8" />,
  destaque: (
    <path d="m4 16 8-8 4 4-8 8H4v-4Zm8-8 2-2 4 4-2 2M4 20h16" />
  ),
  video: (
    <path d="m9 7 8 5-8 5V7Zm-5 13h16V4H4v16Z" />
  ),
  image: (
    <path d="M4 5h16v14H4V5Zm2 11 4-4 3 3 2-2 3 3M8.5 9.5h.01" />
  ),
  file: (
    <path d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 12h6M9 16h6" />
  ),
  list: (
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  ),
  layers: (
    <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
  ),
  question: (
    <path d="M9.5 9a2.5 2.5 0 1 1 4.7 1.2c-.8 1.2-2.2 1.5-2.2 3M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
  ),
  checkSquare: (
    <path d="M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9" />
  ),
  search: (
    <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />
  ),
};

export function Icon({ name, size = 20 }) {
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
      {ICONS[name]}
    </svg>
  );
}
