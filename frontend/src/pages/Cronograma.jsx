import { useState, useMemo } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MATERIAS = ['Português', 'Simulado', 'Matemática', 'Prova Anterior', 'História', 'Outro', 'Geografia', 'Ciências'];

const INITIAL_ACTIVITIES = [
  { id: 1, dia: 'Segunda', horario: '08:00 - 09:00', nome: 'Equação 2º Grau', materia: 'Matemática', done: false },
  { id: 2, dia: 'Segunda', horario: '14:00 - 15:00', nome: 'Equação 2º Grau', materia: 'Matemática', done: false },
  { id: 3, dia: 'Terça', horario: '10:00 - 11:00', nome: 'Interpretação de texto', materia: 'Português', done: false },
  { id: 4, dia: 'Quinta', horario: '09:00 - 10:00', nome: 'Vestibulinho 2025', materia: 'Prova Anterior', done: false },
  { id: 5, dia: 'Quinta', horario: '14:00 - 15:00', nome: 'Equação 2º Grau', materia: 'Matemática', done: false },
  { id: 6, dia: 'Sexta', horario: '14:00 - 16:00', nome: 'Simulado', materia: 'Simulado', done: false },
];

const emptyForm = { nome: '', materia: MATERIAS[0], horario: '', dia: WEEK_DAYS[0] };

// ============================================================
// BANCO DE CONTEÚDOS — o que mais cai no Vestibulinho ETEC
// ============================================================
const TOPICS_BANK = {
  'Português': [
    'Interpretação de texto',
    'Ortografia e acentuação',
    'Classes gramaticais',
    'Concordância verbal e nominal',
    'Regência verbal e nominal',
    'Crase',
    'Figuras de linguagem',
    'Gêneros textuais',
    'Coesão e coerência textual',
    'Pontuação',
    'Redação dissertativo-argumentativa',
  ],
  'Matemática': [
    'Operações com números naturais e inteiros',
    'Frações e números decimais',
    'Porcentagem e regra de três',
    'Equações do 1º grau',
    'Equações do 2º grau',
    'Sistemas de equações',
    'Geometria plana: áreas e perímetros',
    'Geometria espacial: volumes',
    'Razão e proporção',
    'Funções e gráficos',
    'Potenciação e radiciação',
  ],
  'Ciências': [
    'Célula e organização dos seres vivos',
    'Ecologia e meio ambiente',
    'Corpo humano: sistemas',
    'Física: movimento e velocidade',
    'Química: matéria e transformações',
    'Energia e suas formas',
    'Reino animal e vegetal',
    'Genética básica',
    'Sustentabilidade e recursos naturais',
  ],
  'História': [
    'Brasil Colônia',
    'Brasil Império',
    'Era Vargas',
    'Ditadura Militar no Brasil',
    'Revolução Industrial',
    'Guerras Mundiais',
    'Guerra Fria',
    'Movimentos sociais brasileiros',
    'Globalização',
  ],
  'Geografia': [
    'Relevo e clima do Brasil',
    'Urbanização brasileira',
    'Globalização e economia',
    'Meio ambiente e sustentabilidade',
    'População e demografia',
    'Fontes de energia',
    'Geopolítica mundial',
    'Agropecuária brasileira',
  ],
  'Atualidades': [
    'Notícias e fatos recentes',
    'Meio ambiente e mudanças climáticas',
    'Tecnologia e sociedade',
    'Economia brasileira',
    'Cultura e diversidade',
    'Direitos humanos',
    'Educação no Brasil',
    'Ciência e inovação',
  ],
};

const SUBJECT_ORDER = Object.keys(TOPICS_BANK);

// Distribui os dias de estudo de forma espalhada pela semana,
// em vez de deixar tudo grudado no começo.
const DAYS_BY_COUNT = {
  1: ['Quarta'],
  2: ['Terça', 'Quinta'],
  3: ['Segunda', 'Quarta', 'Sexta'],
  4: ['Segunda', 'Terça', 'Quinta', 'Sexta'],
  5: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
  6: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  7: WEEK_DAYS,
};

// Gera o plano completo: um array de meses, cada um com 4 semanas,
// cada semana com os dias de estudo escolhidos preenchidos com
// matéria + tópico, intercalando as matérias e repetindo em modo
// "revisão" quando o plano é mais longo que o banco de tópicos.
function gerarPlanoDeEstudos(meses, diasPorSemana) {
  const diasDaSemana = DAYS_BY_COUNT[diasPorSemana] || DAYS_BY_COUNT[3];
  const contadorPorMateria = {};
  SUBJECT_ORDER.forEach((m) => { contadorPorMateria[m] = 0; });

  let indiceMateria = 0;

  function proximoItem() {
    const materia = SUBJECT_ORDER[indiceMateria % SUBJECT_ORDER.length];
    indiceMateria += 1;

    const topicos = TOPICS_BANK[materia];
    const posicao = contadorPorMateria[materia] % topicos.length;
    const volta = Math.floor(contadorPorMateria[materia] / topicos.length);
    contadorPorMateria[materia] += 1;

    const topico = topicos[posicao];
    return {
      materia,
      topico: volta === 0 ? topico : `Revisão: ${topico}`,
    };
  }

  const planoMeses = [];

  for (let m = 1; m <= meses; m++) {
    const semanas = [];
    for (let s = 1; s <= 4; s++) {
      const dias = diasDaSemana.map((dia) => ({ dia, ...proximoItem() }));
      semanas.push({ numero: s, dias });
    }
    planoMeses.push({ numero: m, semanas });
  }

  return planoMeses;
}

export default function Cronograma() {
  const { addXP } = useGamification();

  // ---------- estado: cronograma manual (já existia) ----------
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekLabel = weekOffset === 0 ? 'Semana Atual' : weekOffset > 0 ? `${weekOffset} semana(s) à frente` : `${Math.abs(weekOffset)} semana(s) atrás`;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // ---------- estado: aba ativa ----------
  const [tab, setTab] = useState('meu'); // 'meu' | 'auto'

  // ---------- estado: plano automático ----------
  const [meses, setMeses] = useState(6);
  const [diasPorSemana, setDiasPorSemana] = useState(3);
  const [plano, setPlano] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState(1);

  function handleGerarPlano() {
    const novoPlano = gerarPlanoDeEstudos(meses, diasPorSemana);
    setPlano(novoPlano);
    setMesSelecionado(1);
  }

  function adicionarSemanaAoCronograma(semana) {
    const novasAtividades = semana.dias.map((d) => ({
      id: Date.now() + Math.random(),
      dia: d.dia,
      horario: 'A definir',
      nome: d.topico,
      materia: d.materia,
      done: false,
    }));
    setActivities((prev) => [...prev, ...novasAtividades]);
    addXP(10, 'semana adicionada ao cronograma');
    setTab('meu');
  }

  // ---------- funções: cronograma manual ----------
  function openCreate() {
    setCreateForm(emptyForm);
    setShowCreate(true);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!createForm.nome.trim() || !createForm.horario.trim()) return;
    setActivities((prev) => [...prev, { id: Date.now(), ...createForm, done: false }]);
    addXP(15, 'atividade concluída');
    setShowCreate(false);
  }

  function openEdit(activity) {
    setEditing(activity);
    setEditForm({ nome: activity.nome, materia: activity.materia, horario: activity.horario, dia: activity.dia });
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    setActivities((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...editForm } : a)));
    setEditing(null);
  }

  function handleComplete() {
    setActivities((prev) => prev.map((a) => (a.id === editing.id ? { ...a, done: true } : a)));
    setEditing(null);
  }

  function handleDelete() {
    setActivities((prev) => prev.filter((a) => a.id !== editing.id));
    setEditing(null);
  }

  // ---------- resumo calculado a partir das atividades reais ----------
  function parseHoras(horario) {
    const match = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec((horario || '').trim());
    if (!match) return 0;
    const inicio = Number(match[1]) + Number(match[2]) / 60;
    const fim = Number(match[3]) + Number(match[4]) / 60;
    const diff = fim - inicio;
    return diff > 0 ? diff : 0;
  }

  const resumo = useMemo(() => {
    const totalHoras = activities.reduce((soma, a) => soma + parseHoras(a.horario), 0);
    const totalSimulados = activities.filter((a) => a.materia === 'Simulado').length;

    const porMateria = {};
    activities.forEach((a) => {
      if (!porMateria[a.materia]) porMateria[a.materia] = { total: 0, feitas: 0 };
      porMateria[a.materia].total += 1;
      if (a.done) porMateria[a.materia].feitas += 1;
    });
    const distribuicao = Object.entries(porMateria)
      .map(([materia, v]) => ({ materia, pct: Math.round((v.feitas / v.total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);

    const concluidas = activities.filter((a) => a.done).length;
    const metaPct = activities.length > 0 ? Math.round((concluidas / activities.length) * 100) : 0;
    const horasFeitas = activities.filter((a) => a.done).reduce((soma, a) => soma + parseHoras(a.horario), 0);

    return { totalHoras, totalSimulados, distribuicao, metaPct, horasFeitas };
  }, [activities]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cronograma de estudos</h1>
          <p>Organize seu tempo e maximize seu aprendizado</p>
        </div>
        {tab === 'meu' && (
          <div className="page-actions">
            <button className="mural-btn primary" onClick={openCreate}>+ Adicionar Atividade</button>
          </div>
        )}
      </div>

      <div className="cronograma-tabs">
        <button className={`cronograma-tab ${tab === 'meu' ? 'active' : ''}`} onClick={() => setTab('meu')}>
          Meu cronograma
        </button>
        <button className={`cronograma-tab ${tab === 'auto' ? 'active' : ''}`} onClick={() => setTab('auto')}>
          Plano automático
        </button>
      </div>

      {tab === 'meu' && (
        <>
          <div className="week-nav">
            <button onClick={() => setWeekOffset((v) => v - 1)} aria-label="Semana anterior">‹</button>
            <span className="week-label">{weekLabel}</span>
            <button onClick={() => setWeekOffset((v) => v + 1)} aria-label="Próxima semana">›</button>
          </div>

          <div className="week-grid">
            {WEEK_DAYS.map((day) => {
              const dayTasks = activities.filter((a) => a.dia === day);
              return (
                <div className="day-column" key={day}>
                  <span className="day-name">{day}</span>
                  {dayTasks.length === 0 ? (
                    <span className="day-task-empty">Sem atividades</span>
                  ) : (
                    dayTasks.map((t) => (
                      <div className={`day-task ${t.done ? 'done' : ''}`} key={t.id} onClick={() => openEdit(t)}>
                        <span className="task-time">{t.horario}</span>
                        <strong>{t.materia}</strong><br />
                        {t.nome}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          <div className="cronograma-summary-grid">
            <div className="panel-card">
              <h3>Resumo da Semana</h3>
              <div className="summary-list">
                <div className="summary-row"><span>Total de horas</span><span>{resumo.totalHoras.toFixed(1)}h</span></div>
                <div className="summary-row"><span>Atividades</span><span>{activities.length}</span></div>
                <div className="summary-row"><span>Simulados</span><span>{resumo.totalSimulados}</span></div>
              </div>
            </div>

            <div className="panel-card">
              <h3>Distribuição</h3>
              {resumo.distribuicao.length === 0 ? (
                <span className="day-task-empty">Adicione atividades para ver a distribuição</span>
              ) : (
                resumo.distribuicao.map((d) => (
                  <div className="bar-row" key={d.materia}>
                    <div className="bar-row-label"><span>{d.materia}</span><span>{d.pct}%</span></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${d.pct}%` }}></div></div>
                  </div>
                ))
              )}
            </div>

            <div className="panel-card">
              <h3>Meta Semanal</h3>
              <div className="meta-circle-wrap">
                <div className="meta-circle" style={{ background: `conic-gradient(var(--accent) 0% ${resumo.metaPct}%, var(--paper) ${resumo.metaPct}% 100%)` }}>
                  <div style={{ background: '#fff', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{resumo.metaPct}%</div>
                </div>
                <span className="meta-circle-label">{resumo.horasFeitas.toFixed(1)}h de {resumo.totalHoras.toFixed(1)}h completas</span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'auto' && (
        <div className="auto-plan">
          <div className="panel-card auto-plan-config">
            <h3>Monte seu plano</h3>
            <p className="auto-plan-hint">Escolha quanto tempo falta para a sua prova e quantos dias por semana você consegue estudar. O plano se ajusta sozinho, intercalando as matérias mais cobradas no Vestibulinho.</p>

            <span className="modal-materia-label">Meses até a prova</span>
            <div className="pill-row">
              {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((m) => (
                <button
                  type="button"
                  key={m}
                  className={`materia-pill ${meses === m ? 'selected' : ''}`}
                  onClick={() => setMeses(m)}
                >
                  {m} {m === 1 ? 'mês' : 'meses'}
                </button>
              ))}
            </div>

            <span className="modal-materia-label" style={{ marginTop: 18, display: 'block' }}>Dias por semana</span>
            <div className="pill-row">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  type="button"
                  key={d}
                  className={`materia-pill ${diasPorSemana === d ? 'selected' : ''}`}
                  onClick={() => setDiasPorSemana(d)}
                >
                  {d}x por semana
                </button>
              ))}
            </div>

            <button className="mural-btn primary auto-plan-generate" onClick={handleGerarPlano}>
              Gerar cronograma automático
            </button>
          </div>

          {plano && (
            <div className="auto-plan-result">
              <div className="auto-plan-months">
                {plano.map((mes) => (
                  <button
                    type="button"
                    key={mes.numero}
                    className={`auto-plan-month-tab ${mesSelecionado === mes.numero ? 'active' : ''}`}
                    onClick={() => setMesSelecionado(mes.numero)}
                  >
                    Mês {mes.numero}
                  </button>
                ))}
              </div>

              {plano.filter((mes) => mes.numero === mesSelecionado).map((mes) => (
                <div key={mes.numero}>
                  {mes.semanas.map((semana) => (
                    <div className="panel-card auto-plan-week" key={semana.numero}>
                      <div className="auto-plan-week-header">
                        <h3>Semana {semana.numero}</h3>
                        <button className="mural-btn secondary" onClick={() => adicionarSemanaAoCronograma(semana)}>
                          + Adicionar ao meu cronograma
                        </button>
                      </div>
                      <div className="auto-plan-days">
                        {semana.dias.map((d, i) => (
                          <div className="auto-plan-day" key={i}>
                            <span className="auto-plan-day-name">{d.dia}</span>
                            <strong>{d.materia}</strong>
                            <span>{d.topico}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicione atividades ao seu cronograma</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-two-col">
                <div>
                  <div className="modal-input-group">
                    <label>Nome da atividade</label>
                    <input
                      type="text"
                      value={createForm.nome}
                      onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Horário</label>
                    <input
                      type="text"
                      placeholder="08:00 - 09:00"
                      value={createForm.horario}
                      onChange={(e) => setCreateForm({ ...createForm, horario: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Dia da semana</label>
                    <select
                      value={createForm.dia}
                      onChange={(e) => setCreateForm({ ...createForm, dia: e.target.value })}
                    >
                      {WEEK_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <span className="modal-materia-label">Matéria</span>
                  <div className="materia-pill-grid">
                    {MATERIAS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`materia-pill ${createForm.materia === m ? 'selected' : ''}`}
                        onClick={() => setCreateForm({ ...createForm, materia: m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Atividade</h2>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-two-col">
                <div>
                  <div className="modal-input-group">
                    <label>Nome da atividade</label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Horário</label>
                    <input
                      type="text"
                      value={editForm.horario}
                      onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label>Dia da semana</label>
                    <select
                      value={editForm.dia}
                      onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })}
                    >
                      {WEEK_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <span className="modal-materia-label">Matéria</span>
                  <div className="materia-pill-grid">
                    {MATERIAS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`materia-pill ${editForm.materia === m ? 'selected' : ''}`}
                        onClick={() => setEditForm({ ...editForm, materia: m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="mural-btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
                <button type="submit" className="mural-btn primary">Salvar</button>
                <button type="button" className="mural-btn primary" onClick={handleComplete}>Concluída</button>
              </div>
            </form>
            <button className="modal-delete" onClick={handleDelete}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}
