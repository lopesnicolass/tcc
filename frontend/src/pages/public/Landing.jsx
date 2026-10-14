import '../../styles/public/Landing.css';
import { useEffect, useRef, useState } from 'react';
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
   ÍCONES
   ============================================================ */

function IconFlashcards() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="14" height="10" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}


function IconSimulados() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}


function IconCronograma() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      <path d="M7.5 13.2h2M11 13.2h2M14.5 13.2h2M7.5 16.5h2M11 16.5h2" />
    </svg>
  );
}


function IconDesempenho() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V10M11 20V4M18 20v-6" />
      <path d="M3 20h18" />
    </svg>
  );
}


function IconMural() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4.5 4V6a1 1 0 0 1 1-1Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}


function IconXP() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 9.9l6-.9L12 3.5Z" />
    </svg>
  );
}


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

  const mascotRef = useRef(null);
  const dragRef = useRef(null);
  const [mascotPosition, setMascotPosition] = useState(null);
  const [mascotDragging, setMascotDragging] = useState(false);

  const handleMascotPointerDown = (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const bounds = mascotRef.current?.getBoundingClientRect();
    if (!bounds) return;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setMascotDragging(true);
  };

  const handleMascotPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = mascotRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.max(0, Math.min(window.innerWidth - bounds.width, event.clientX - drag.offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - bounds.height, event.clientY - drag.offsetY));
    setMascotPosition({ x, y });
  };

  const handleMascotPointerEnd = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setMascotDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (!mascotPosition) return;
    const keepMascotOnScreen = () => {
      const bounds = mascotRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setMascotPosition((pos) => pos && ({
        x: Math.max(0, Math.min(window.innerWidth - bounds.width, pos.x)),
        y: Math.max(0, Math.min(window.innerHeight - bounds.height, pos.y)),
      }));
    };
    window.addEventListener('resize', keepMascotOnScreen);
    return () => window.removeEventListener('resize', keepMascotOnScreen);
  }, [mascotPosition !== null]);

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
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
              Criar conta  <span aria-hidden="true">→</span>
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
              <span className="accent-word">ETECAMP.</span>
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
                <svg className="landing-cta-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
            <svg className="landing-cta-arrow" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div
        ref={mascotRef}
        className={`landing-floating-mascot${mascotDragging ? ' is-dragging' : ''}`}
        style={mascotPosition ? { left: mascotPosition.x, top: mascotPosition.y, bottom: 'auto' } : undefined}
        onPointerDown={handleMascotPointerDown}
        onPointerMove={handleMascotPointerMove}
        onPointerUp={handleMascotPointerEnd}
        onPointerCancel={handleMascotPointerEnd}
        role="img"
        aria-label="Mascote Tenna. Arraste para mudar de posição."
        title="Arraste a Tenna para onde quiser"
      >
        <img src={`${import.meta.env.BASE_URL}tenna-formiga-estudando.png`} alt="" draggable="false" />
      </div>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          
          <span>© {new Date().getFullYear()} Tenna. Todos os direitos reservados.</span>
        </div>
      </footer>

    </div>
  );
}
