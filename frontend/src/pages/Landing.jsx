import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import tennaLogo from '../assets/tenna_logo.png';

function getDaysUntilExam() {
  const target = new Date('2026-11-08T00:00:00');
  const now = new Date();

  return Math.max(
    0,
    Math.ceil((target - now) / 86400000)
  );
}


/* ============================================================
   MATÉRIAS
   ============================================================ */

const SUBJECTS = [
  { name: 'Matemática', pct: 82, done: true },
  { name: 'Português', pct: 64, done: true },
  { name: 'Ciências', pct: 38, done: false },
  { name: 'Atualidades', pct: 15, done: false },
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
    Icon: IconFlashcards,
    title: 'Flashcards',
    desc: 'Revise os conteúdos mais cobrados em cartões rápidos, no seu ritmo.',
  },
  {
    Icon: IconSimulados,
    title: 'Simulados',
    desc: 'Faça provas no estilo do Vestibulinho e veja sua nota na hora.',
  },
  {
    Icon: IconCronograma,
    title: 'Cronograma',
    desc: 'Um plano de estudos que se adapta aos meses e dias que você tem disponível.',
  },
  {
    Icon: IconDesempenho,
    title: 'Desempenho',
    desc: 'Acompanhe gráficos com sua evolução e descubra onde focar.',
  },
  {
    Icon: IconMural,
    title: 'Mural',
    desc: 'Troque dúvidas e dicas com outros estudantes se preparando com você.',
  },
  {
    Icon: IconXP,
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

  const [subjects, setSubjects] = useState(SUBJECTS);


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

        <div className="landing-brand">
          <img
            src={tennaLogo}
            alt="tenna"
            className="landing-brand-icon"
          />
        </div>

        <button
          className="landing-nav-btn"
          onClick={goToLogin}
        >
          Entrar
        </button>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="landing-hero-full">

        <div className="landing-hero-row">

          {/* ============================
              LADO ESQUERDO
          ============================ */}

          <div className="landing-hero-copy">

            <div className="countdown-badge landing-badge">
              <span className="landing-badge-icon">🔥</span>

              <span>
                <strong>{getDaysUntilExam()}</strong>{' '}
                dias até o Vestibulinho
              </span>
            </div>


            <h1>
              Organize seus estudos e conquiste sua vaga na{' '}
              <span className="accent-word">
                ETECAMP.
              </span>
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
                <span className="btn-label">
                  Criar conta
                </span>
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
                  SEU PROGRESSO
                </span>

                <h2>
                  Continue evoluindo
                </h2>
              </div>

              <div className="landing-dashboard-score">
                <strong>50%</strong>
                <span>geral</span>
              </div>

            </div>


            <div className="landing-subjects-row">

              {subjects.map((s) => (

                <button
                  type="button"
                  key={s.name}
                  className="landing-subject-card"
                  onClick={() => toggleSubject(s.name)}
                >

                  <div
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


                    <div className="subject-bar">
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


            <div className="landing-dashboard-footer">

              <div className="landing-dashboard-mini-icon">
                ✓
              </div>

              <div>
                <strong>
                  Você está no caminho certo!
                </strong>

                <span>
                  Mantenha sua rotina de estudos.
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FUNCIONALIDADES
      ===================================================== */}

      <section className="landing-features">

        <div className="landing-section-heading">

          <span className="landing-section-label">
            RECURSOS
          </span>

          <h2>
            Tudo o que você precisa para estudar
          </h2>

          <p>
            Ferramentas pensadas para deixar sua
            preparação mais organizada e eficiente.
          </p>

        </div>


        <div className="landing-features-grid">

          {FEATURES.map(({ Icon, title, desc }) => (

            <div
              className="landing-feature-card"
              key={title}
            >

              <div className="landing-feature-icon">
                <Icon />
              </div>

              <h3>
                {title}
              </h3>

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

      <section className="landing-steps">

        <div className="landing-section-heading">

          <span className="landing-section-label">
            SIMPLES E PRÁTICO
          </span>

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

              <div className="landing-step-n">
                {s.n}
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

          <span className="landing-section-label">
            SUA VAGA COMEÇA AQUI
          </span>

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
              Criar conta grátis
            </span>
          </button>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="landing-footer">

        <span>
          © {new Date().getFullYear()} tenna
        </span>

      </footer>

    </div>
  );
}
