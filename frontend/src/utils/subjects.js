// src/utils/subjects.js
// Cores e ícones (em linha, estilo sidebar) por matéria

export const SUBJECT_STYLES = {
  'Português': { color: '#2196F3', bg: '#E3F2FD', iconPath: 'M4 6h16M4 12h16M4 18h10' },
  'Língua Portuguesa': { color: '#2196F3', bg: '#E3F2FD', iconPath: 'M4 6h16M4 12h16M4 18h10' },
  'Matemática': { color: '#0D47A1', bg: '#E3F2FD', iconPath: 'M12 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM5 12h14M12 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z' },
  'História': { color: '#1565C0', bg: '#EAF4FD', iconPath: 'M4 21h16M5 21V10M19 21V10M3 10l9-6 9 6M9 10v7M15 10v7' },
  'Geografia': { color: '#1976D2', bg: '#EAF4FD', iconPath: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.4 2.6 2.4 15.4 0 18M12 3c-2.4 2.6-2.4 15.4 0 18' },
  'Ciências': { color: '#0288D1', bg: '#E1F5FE', iconPath: 'M5 21c9 0 14-5 14-14V5h-2C8 5 5 12 5 21Zm0 0c3-5 6-8 11-11' },
  'Biologia': { color: '#0288D1', bg: '#E1F5FE', iconPath: 'M5 21c9 0 14-5 14-14V5h-2C8 5 5 12 5 21Zm0 0c3-5 6-8 11-11' },
  'Química': { color: '#1E88E5', bg: '#E3F2FD', iconPath: 'M9 2h6M10 2v6.5L4.5 19a2.2 2.2 0 0 0 1.8 3h11.4a2.2 2.2 0 0 0 1.8-3L14 8.5V2M8 15h8' },
  'Física': { color: '#3949AB', bg: '#E8EAF6', iconPath: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z' },
  'Raciocínio e interpretação': { color: '#5E35B1', bg: '#EDE7F6', iconPath: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2c.6.4 1 1.1 1 1.8h4c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z' },
  'Atualidades': { color: '#0277BD', bg: '#E1F5FE', iconPath: 'M4 4h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Zm13 3h3v11a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h4' },
  'Simulado': { color: '#0D47A1', bg: '#E3F2FD', iconPath: 'M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9' },
  'Prova Anterior': { color: '#455A64', bg: '#ECEFF1', iconPath: 'M7 3h7l5 5v13H7V3Zm6 0v5h5M9 12h6M9 16h6' },
  'Outro': { color: '#607D8B', bg: '#ECEFF1', iconPath: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5' },
};

const DEFAULT_STYLE = {
  color: '#2196F3',
  bg: '#E3F2FD',
  iconPath: 'M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17ZM5 4.5v17M9 6h7M9 10h7M9 14h5',
};

export function getSubjectStyle(materia = '') {
  if (SUBJECT_STYLES[materia]) return SUBJECT_STYLES[materia];
  const found = Object.keys(SUBJECT_STYLES).find(
    (key) =>
      materia.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(materia.toLowerCase())
  );
  return found ? SUBJECT_STYLES[found] : DEFAULT_STYLE;
}