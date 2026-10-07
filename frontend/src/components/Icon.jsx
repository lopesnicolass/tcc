// src/components/Icon.jsx
// Ícones genéricos no mesmo estilo da sidebar (linha fina, cor herdada)

export const ICON_PATHS = {
  calendar:
    'M4 9h16M7 3v4M17 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  check:
    'M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9',
  checkSquare:
    'M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9',
  clock:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 3',
  pin:
    'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  bulb:
    'M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2c.6.4 1 1.1 1 1.8h4c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z',
  target:
    'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 10a2 2 0 1 0 2 2',
  book:
    'M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17ZM5 4.5v17M9 6h7M9 10h7M9 14h5',
  arrowRight:
    'M5 12h14M13 6l6 6-6 6',
  arrow:
    'M19 12H5m7-7-7 7 7 7',
  chevron:
    'm9 18 6-6-6-6',
  activity:
    'M4 13h4l2-7 4 12 2-7h4',
  chart:
    'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-9',
  trophy:
    'M8 4h8v4a4 4 0 0 1-8 0V4Zm4 8v5M8 20h8M10 17h4M6 6H4v2a4 4 0 0 0 4 4M18 6h2v2a4 4 0 0 1-4 4',
  edit:
    'm4 20 4-.9L19 8.1a2.1 2.1 0 0 0-3-3L5 16.1 4 20Zm10.5-13.5 3 3',
  file:
    'M7 3h7l5 5v13H7V3Zm6 0v5h5M9 12h6M9 16h6',
  plus:
    'M12 5v14M5 12h14',
  refresh:
    'M20 11a8 8 0 1 0 2 5M20 5v6h-6',
  search:
    'm21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z',
  shield:
    'M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z',
  question:
    'M9.6 9a2.7 2.7 0 1 1 4.7 1.8c-.9.9-2.3 1.4-2.3 3.2M12 18h.01',
  highlight:
    'M9 3h6l1 5-4 4-4-4 1-5ZM12 12v6M8 21h8',
  layers:
    'm12 3 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4M4 15l8 4 8-4',
  external:
    'M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4',
};

export default function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8
}) {
  const d = ICON_PATHS[name];

  if (!d) {
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
