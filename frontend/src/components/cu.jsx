// src/components/SubjectIcon.jsx
// Desenha o ícone da matéria (cor e traço vêm de subjects.js)

import { getSubjectStyle } from '../utils/subjects.js';

export default function SubjectIcon({ materia, size = 18, color }) {
  const style = getSubjectStyle(materia);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || style.color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={style.iconPath} />
    </svg>
  );
}