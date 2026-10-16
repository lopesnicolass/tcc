import '../../styles/public/Landing.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tennaLogo from '../../assets/tenna_logo.webp';
import { API_URL } from '../../services/api.js';
import { diasAteVestibulinho } from '../../utils/vestibulinho.js';



/* ============================================================
   MATÉRIAS
   ============================================================ */

const SUBJECT_COLORS = { 'Matemática': '#E53935', 'Português': '#2196F3', 'Ciências': '#8E44AD', 'Geografia': '#43A047' };

const SUBJECTS = [
  { name: 'Matemática', pct: 82, done: true },
  { name: 'Português', pct: 64, done: true },
  { name: 'Ciências', pct: 38, done: false },
  { name: 'Geografia', pct: 15, done: false },
];


/* ============================================================
   FUNCIONALIDADES
   ============================================================ */

const FEATURES = [
  {
    image: 'flashcards.png',
    title: 'Flashcards',
    desc: 'Revise os conteúdos mais cobrados em cartões rápidos, no seu ritmo.',
  },
  {
    image: 'simulados.png',
    title: 'Simulados',
    desc: 'Faça provas no estilo do Vestibulinho e veja sua nota na hora.',
  },
  {
    image: 'cronograma.png',
    title: 'Cronograma',
    desc: 'Um plano de estudos que se adapta aos meses e dias que você tem disponível.',
  },
  {
    image: 'desempenho.png',
    title: 'Desempenho',
    desc: 'Acompanhe gráficos com sua evolução e descubra onde focar.',
  },
  {
    image: 'mural.png',
    title: 'Mural',
    desc: 'Troque dúvidas e dicas com outros estudantes se preparando com você.',
  },
  {
    image: 'xp_conquistas.png',
    title: 'XP e conquistas',
    desc: 'Ganhe pontos a cada estudo e suba de nível conforme avança.',
  },
];


/* ============================================================
   ETAPAS
   ============================================================ */

const STEPS = [
  {
    n: '1',
    title: 'Crie sua conta',
    desc: 'Cadastro rápido, leva menos de um minuto.',
  },
  {
    n: '2',
    title: 'Monte seu plano',
    desc: 'Organize seu cronograma e escolha suas matérias.',
  },
  {
    n: '3',
    title: 'Estude e evolua',
    desc: 'Use flashcards e simulados e acompanhe seu progresso.',
  },
];


export default function Landing() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [subjects, setSubjects] = useState(SUBJECTS);
  const [dataVestibulinho, setDataVestibulinho] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/calendario/vestibulinho`, { signal: controller.signal })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Data indisponível');
        return resposta.json();
      })
      .then((dados) => setDataVestibulinho(dados?.data || null))
      .catch((erro) => {
        if (erro.name !== 'AbortError') setDataVestibulinho(null);
      });

    return () => controller.abort();
  }, []);

  // Destaca a seção que o visitante está visualizando.
  useEffect(() => {
    function updateActiveSection() {
      const recursos = document.getElementById('recursos');
      const comoFunciona = document.getElementById('como-funciona');
      const limite = window.scrollY + 180;

      if (comoFunciona && limite >= comoFunciona.offsetTop) {
        setActiveSection('como-funciona');
      } else if (recursos && limite >= recursos.offsetTop) {
        setActiveSection('recursos');
      } else {
        setActiveSection('inicio');
      }
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, []);

  // O menu móvel pode ser fechado pela tecla Escape.
  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  function handleNavLink(section) {
    setActiveSection(section);
    setMenuOpen(false);
  }

  const diasParaProva = diasAteVestibulinho(dataVestibulinho);


  // Esta é uma prévia interativa; o percentual acompanha as matérias marcadas.
  const materiasConcluidas = subjects.filter((materia) => materia.done).length;
  const progressoGeral = Math.round((materiasConcluidas / subjects.length) * 100);


  function toggleSubject(name) {
    setSubjects((prev) =>
      prev.map((s) =>
        s.name === name
          ? { ...s, done: !s.done }
          : s
      )
    );
  }


  function goToLogin() {
    navigate('/login');
  }


  function goToCadastro() {
    navigate('/login', {
      state: {
        view: 'cadastro',
      },
    });
  }


  return (
    <div className="landing">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="landing-nav">
        <div className="landing-nav-shell">
          <a
            className="landing-brand"
            href="#inicio"
            aria-label="Tenna — voltar ao início"
            onClick={() => handleNavLink('inicio')}
          >
            <img src={tennaLogo} alt="Tenna" className="landing-brand-icon" />
          </a>

          <nav className="landing-nav-links" aria-label="Navegação principal">
            <a
              href="#inicio"
              className={activeSection === 'inicio' ? 'is-active' : ''}
              aria-current={activeSection === 'inicio' ? 'location' : undefined}
              onClick={() => handleNavLink('inicio')}
            >
              Início
            </a>
            <a
              href="#recursos"
              className={activeSection === 'recursos' ? 'is-active' : ''}
              aria-current={activeSection === 'recursos' ? 'location' : undefined}
              onClick={() => handleNavLink('recursos')}
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              className={activeSection === 'como-funciona' ? 'is-active' : ''}
              aria-current={activeSection === 'como-funciona' ? 'location' : undefined}
              onClick={() => handleNavLink('como-funciona')}
            >
              Como funciona
            </a>
          </nav>

          <div className="landing-nav-actions">
            <button type="button" className="landing-nav-login" onClick={goToLogin}>
              Entrar
            </button>
            <button type="button" className="landing-nav-btn" onClick={goToCadastro}>
              Começar
            </button>
            <button
              type="button"
              className={`landing-nav-menu-toggle${menuOpen ? ' is-open' : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="landing-mobile-menu" className="landing-mobile-nav" aria-label="Navegação móvel">
            <a href="#inicio" onClick={() => handleNavLink('inicio')} className={activeSection === 'inicio' ? 'is-active' : ''}>Início</a>
            <a href="#recursos" onClick={() => handleNavLink('recursos')} className={activeSection === 'recursos' ? 'is-active' : ''}>Recursos</a>
            <a href="#como-funciona" onClick={() => handleNavLink('como-funciona')} className={activeSection === 'como-funciona' ? 'is-active' : ''}>Como funciona</a>
            <button type="button" className="landing-mobile-register" onClick={goToCadastro}>
              Criar conta
            </button>
          </nav>
        )}
      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section id="inicio" className="landing-hero-full">

        <div className="landing-hero-row">

          {/* ============================
              LADO ESQUERDO
          ============================ */}

          <div className="landing-hero-copy">

            <div
              className="landing-countdown"
              role="status"
              aria-label={diasParaProva === null
                ? 'Data do Vestibulinho a confirmar'
                : `Faltam ${diasParaProva} dias para o Vestibulinho`}
            >
              <span className="landing-countdown-mark" aria-hidden="true" />
              <span className="landing-countdown-label">VESTIBULINHO</span>
              <span className="landing-countdown-divider" aria-hidden="true" />
              <span className="landing-countdown-text">
                {diasParaProva === null ? (
                  'Data a confirmar'
                ) : (
                  <>Faltam <strong>{diasParaProva} dias</strong></>
                )}
</span>
            </div>


            <h1>
              Organize seus estudos e conquiste sua vaga na{' '}
              <span className="accent-word">TENNA.</span>
            </h1>


            <p>
              A tenna reúne flashcards, simulados,
              cronograma e acompanhamento de desempenho
              num só lugar, feito para quem está se
              preparando para o Vestibulinho.
            </p>


            <div className="landing-cta-row">

              <button
                className="btn-primary landing-cta"
                onClick={goToCadastro}
              >
                <span className="btn-label">Criar conta</span>
              </button>


              <button
                className="landing-cta-secondary"
                onClick={goToLogin}
              >
                Já tenho conta
              </button>

            </div>

          </div>


          {/* ============================
              LADO DIREITO
          ============================ */}

          <div className="landing-hero-dashboard">

            <div className="landing-dashboard-top">

              <div>
                <span className="landing-dashboard-label">
                  PRÉVIA DO SEU PROGRESSO
</span>

                <h2>
                  Continue evoluindo
                </h2>
                <p className="landing-dashboard-description">
                  {materiasConcluidas} de {subjects.length} matérias concluídas
                </p>
              </div>

              <div
                className="landing-dashboard-score"
                role="status"
                aria-label={`Progresso geral: ${progressoGeral}%`}
                style={{ '--landing-progress': `${progressoGeral}%` }}
              >
                <div className="landing-dashboard-score-inner">
                  <strong>{progressoGeral}%</strong>
                  <span>geral</span>
                </div>
              </div>

            </div>


            <div className="landing-subjects-row">

              {subjects.map((s) => (

                <button
                  type="button"
                  key={s.name}
                  className="landing-subject-card"
                  style={{ "--subject-color": SUBJECT_COLORS[s.name] }}
                  aria-pressed={s.done}
                  aria-label={`${s.name}: ${s.pct}% de progresso. ${s.done ? 'Matéria marcada' : 'Matéria não marcada'}. Clique para alterar.`}
                  onClick={() => toggleSubject(s.name)}
                >

                  <div
                    aria-hidden="true"
                    className={`subject-check ${
                      s.done
                        ? 'done'
                        : 'pending'
                    }`}
                  >
                    {s.done ? '✓' : ''}
                  </div>


                  <div className="subject-info">

                    <div className="subject-name">

                      <span>
                        {s.name}
</span>

                      <span className="pct">
                        {s.pct}%
</span>

                    </div>


                    <div
                      className="subject-bar"
                      role="progressbar"
                      aria-label={`Progresso em ${s.name}`}
                      aria-valuenow={s.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span
                        style={{
                          width: `${s.pct}%`,
                        }}
                      />
                    </div>

                  </div>

                </button>

              ))}

            </div>
          </div>
</div>

      </section>


      {/* =====================================================
          FUNCIONALIDADES
      ===================================================== */}

      <section
        id="recursos"
        className="landing-features"
      >

        <div className="landing-section-heading">

          <h2>
            Tudo o que você precisa para estudar
          </h2>

          <p>
            Ferramentas pensadas para deixar sua
            preparação mais organizada e eficiente.
          </p>

        </div>


        <div className="landing-features-grid">

          {FEATURES.map(({ image, title, desc }) => (

            <div
              className="landing-feature-card"
              key={title}
            >

              <div className="landing-feature-header">
                <div className="landing-feature-art">
                  <img src={`${import.meta.env.BASE_URL}tenna-recursos/${image}`} alt="" loading="lazy" />
                </div>
                <h3>{title}</h3>
              </div>

              <p>
                {desc}
              </p>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          COMO FUNCIONA
      ===================================================== */}

      <section
        id="como-funciona"
        className="landing-steps"
      >

        <div className="landing-section-heading">

          <h2>
            Como funciona
          </h2>

        </div>


        <div className="landing-steps-row">

          {STEPS.map((s) => (

            <div
              className="landing-step"
              key={s.n}
            >

              <div className={`landing-step-art landing-step-art-${s.n}`} aria-hidden="true">
                {s.n === '1' ? <svg viewBox="0 0 64 64" fill="none"><rect x="11" y="9" width="42" height="46" rx="9" fill="#fff"/><circle cx="32" cy="25" r="8" fill="#42B8A2"/><path d="M19 45c2-12 24-12 26 0" stroke="#229F8D" strokeWidth="5" strokeLinecap="round"/><path d="M46 12v13M39.5 18.5h13" stroke="#137F72" strokeWidth="4" strokeLinecap="round"/></svg> : s.n === '2' ? <svg viewBox="0 0 64 64" fill="none"><rect x="10" y="13" width="44" height="42" rx="8" fill="#fff"/><path d="M10 23h44" stroke="#F7A34C" strokeWidth="8"/><path d="M21 10v10M43 10v10" stroke="#D67822" strokeWidth="5" strokeLinecap="round"/><path d="M20 34h8M20 43h8M36 34h8M36 43h8" stroke="#E9B676" strokeWidth="4" strokeLinecap="round"/></svg> : <svg viewBox="0 0 64 64" fill="none"><path d="M32 49c-9-6-15-6-24-4V15c10-3 18-1 24 5 6-6 14-8 24-5v30c-9-2-15-2-24 4Z" fill="#fff" stroke="#6656C9" strokeWidth="3" strokeLinejoin="round"/><path d="M32 20v29M15 25h11M38 25h11M15 33h11M38 33h11" stroke="#A99FF0" strokeWidth="3" strokeLinecap="round"/><path d="m39 12 4 4 8-9" stroke="#2EBE8B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>

              <h3>
                {s.title}
              </h3>

              <p>
                {s.desc}
              </p>

            </div>

          ))}

        </div>


      </section>


      {/* =====================================================
          CTA FINAL
      ===================================================== */}

      <section className="landing-final-cta">

        <div className="landing-final-content">

          <h2>
            Pronto para começar a estudar?
          </h2>

          <p>
            Crie sua conta gratuita e monte seu plano
            de estudos agora mesmo.
          </p>

          <button
            className="btn-primary landing-cta"
            onClick={goToCadastro}
          >
            <span className="btn-label">
              Criar conta 
</span>
          </button>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          
          <span>© {new Date().getFullYear()} Tenna.</span>
        </div>
      </footer>

    </div>
  );
}
