import { useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const MATERIAS = ['Matemática', 'Português', 'Ciências', 'História'];

const INITIAL = [
  { id: 1, subject: 'História', status: 'nao-iniciado', questoes: 15, minutos: 50, dificuldade: 'Média' },
  { id: 2, subject: 'Matemática', status: 'em-progresso', questoes: 20, minutos: 65, dificuldade: 'Difícil' },
  { id: 3, subject: 'Português', status: 'concluido', questoes: 10, minutos: 40, dificuldade: 'Fácil' },
  { id: 4, subject: 'Ciências', status: 'nao-iniciado', questoes: 15, minutos: 50, dificuldade: 'Média' },
];

const STATUS_LABEL = { 'nao-iniciado': 'Não iniciado', 'em-progresso': 'Em progresso', 'concluido': 'Concluído' };
const BTN_LABEL = { 'nao-iniciado': 'Iniciar', 'em-progresso': 'Continuar', 'concluido': 'Refazer' };

export default function Simulados() {
const { addXP } = useGamification();

  const [simulados, setSimulados] = useState(INITIAL);
  const [filtro, setFiltro] = useState('Todas');

  const visiveis = filtro === 'Todas' ? simulados : simulados.filter((s) => s.subject === filtro);
  const concluidos = simulados.filter((s) => s.status === 'concluido').length;

  function avançar(id) {
    const simulado = simulados.find((s) => s.id === id);
    if (simulado.status === 'nao-iniciado') addXP(10, 'simulado iniciado');
    if (simulado.status === 'em-progresso') addXP(50, 'simulado concluído');

    setSimulados((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      if (s.status === 'nao-iniciado') return { ...s, status: 'em-progresso' };
      if (s.status === 'em-progresso') return { ...s, status: 'concluido' };
      return { ...s, status: 'em-progresso' };
    }));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Simulados</h1>
        <div className="page-actions">
          <select className="mural-filter-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="Todas">Filtrar por matéria</option>
            {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{String(concluidos).padStart(2, '0')}</div>
          <div className="stat-label">Simulados concluídos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Matemática</div>
          <div className="stat-label">Matéria com maior dificuldade</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">67%</div>
          <div className="stat-label">Média geral</div>
        </div>
      </div>

      <div className="simulado-grid">
        {visiveis.map((s) => (
          <div className="simulado-card" key={s.id}>
            <div className="simulado-top">
              <span className="simulado-subject">{s.subject}</span>
              <span className={`status-badge ${s.status}`}>{STATUS_LABEL[s.status]}</span>
            </div>
            <div className="simulado-meta">
              <span>📝 {s.questoes} questões</span>
              <span>⏱ {s.minutos} minutos</span>
              <span>🎯 {s.dificuldade}</span>
            </div>
            <button className="simulado-btn" onClick={() => avançar(s.id)}>{BTN_LABEL[s.status]}</button>
          </div>
        ))}
      </div>
    </div>
  );
}