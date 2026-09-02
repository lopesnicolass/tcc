import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import logoIcon from '../assets/logo.PNG';

function getDaysUntilExam() {
  const target = new Date('2026-11-08T00:00:00');
  const now = new Date();
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

const SUBJECTS = [
  { name: 'Matemática', pct: 82, done: true },
  { name: 'Português', pct: 64, done: true },
  { name: 'Ciências', pct: 38, done: false },
  { name: 'Atualidades', pct: 15, done: false },
];

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Flashcards',
    desc: 'Revise os conteúdos mais cobrados em cartões rápidos, no seu ritmo.',
  },
  {
    icon: '📝',
    title: 'Simulados',
    desc: 'Faça provas no estilo do Vestibulinho e veja sua nota na hora.',
  },
  {
    icon: '📅',
    title: 'Cronograma',
    desc: 'Organize sua rotina de estudos matéria por matéria até o dia da prova.',
  },
  {
    icon: '📊',
    title: 'Desempenho',
    desc: 'Acompanhe gráficos com sua evolução e descubra onde focar.',
  },
  {
    icon: '💬',
    title: 'Mural',
    desc: 'Troque dúvidas e dicas com outros estudantes se preparando com você.',
  },
  {
    icon: '⭐',
    title: 'XP e conquistas',
    desc: 'Ganhe pontos a cada estudo e suba de nível conforme avança.',
  },
];

const STEPS = [
  { n: '1', title: 'Crie sua conta', desc: 'Cadastro rápido, leva menos de um minuto.' },
  { n: '2', title: 'Monte seu plano', desc: 'Organize seu cronograma e escolha suas matérias.' },
  { n: '3', title: 'Estude e evolua', desc: 'Use flashcards e simulados e acompanhe seu progresso.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(SUBJECTS);

  function toggleSubject(name) {
    setSubjects((prev) =>
      prev.map((s) => (s.name === name ? { ...s, done: !s.done } : s))
    );
  }

  function goToLogin() {
    navigate('/login');
  }

  function goToCadastro() {
    navigate('/login', { state: { view: 'cadastro' } });
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <img src={logoIcon} alt="Prepara ETECAMP" className="landing-brand-icon" />
          <span>Prepara ETECAMP</span>
        </div>
        <button className="landing-nav-btn" onClick={goToLogin}>Entrar</button>
      </header>

           <section className="landing-hero-full">
        <div className="landing-hero-row">
          <div className="landing-hero-copy">
            <div className="countdown-badge landing-badge">
              🔥 <span><strong>{getDaysUntilExam()}</strong> dias até o Vestibulinho</span>
            </div>
            <h1>
              Organize seus estudos e conquiste sua vaga na <span className="accent-word">ETEC.</span>
            </h1>
            <p>
              O Prepara ETECAMP reúne flashcards, simulados, cronograma e acompanhamento
              de desempenho num só lugar, feito para quem está se preparando para o
              Vestibulinho.
            </p>
            <div className="landing-cta-row">
              <button className="btn-primary landing-cta" onClick={goToCadastro}>
                <span className="btn-label">Criar conta grátis</span>
              </button>
              <button className="landing-cta-secondary" onClick={goToLogin}>
                Já tenho conta
              </button>
            </div>
          </div>

                             <div className="landing-hero-subjects">
            <span className="landing-hero-subjects-eyebrow">Veja como funciona</span>
            <h3>Organize sua rotina de estudos<br /><span className="accent-word">matéria por matéria.</span></h3>
            <p>Acompanhe seu progresso rumo à aprovação no Vestibulinho ETEC.</p>
            <div className="landing-subjects-row">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.name}
                  className="landing-subject-card"
                  onClick={() => toggleSubject(s.name)}
                >
                  <div className={`subject-check ${s.done ? 'done' : 'pending'}`}>
                    {s.done ? '✓' : ''}
                  </div>
                  <div className="subject-info">
                    <div className="subject-name">
                      <span>{s.name}</span>
                      <span className="pct">{s.pct}%</span>
                    </div>
                    <div className="subject-bar">
                      <span style={{ width: `${s.pct}%` }}></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2>Tudo o que você precisa para estudar</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-steps">
        <h2>Como funciona</h2>
        <div className="landing-steps-row">
          {STEPS.map((s) => (
            <div className="landing-step" key={s.n}>
              <div className="landing-step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>Pronto para começar a estudar?</h2>
        <p>Crie sua conta gratuita e monte seu plano de estudos agora mesmo.</p>
        <button className="btn-primary landing-cta" onClick={goToCadastro}>
          <span className="btn-label">Criar conta grátis</span>
        </button>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Prepara ETECAMP</span>
      </footer>
    </div>
  );
}