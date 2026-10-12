import '../../styles/aluno/Provas.css';
import { useEffect, useState } from 'react';
import { API_URL, request } from '../../services/api.js';

function obterResumoPassos() {
  return [
    { numero: '01', titulo: 'Abra a prova' },
    { numero: '02', titulo: 'Resolva com calma' },
    { numero: '03', titulo: 'Confira o gabarito' },
  ];
}

export default function Provas() {
  const [provas, setProvas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    request('/provas')
      .then((dados) => {
        if (!ativo) return;
        setProvas(Array.isArray(dados?.provas) ? dados.provas : []);
        setErro('');
        setCarregando(false);
      })
      .catch((erroAtual) => {
        if (!ativo) return;
        console.error('Erro ao carregar provas:', erroAtual);
        setErro('Não foi possível carregar as provas anteriores agora.');
        setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const passos = obterResumoPassos();

  return (
    <div className="provas-page page-shell">
      <section className="provas-header-card" aria-labelledby="provas-titulo">
        <div className="provas-header-copy">
          <span className="provas-eyebrow">Vestibulinhos ETEC</span>
          <h1 id="provas-titulo">Provas dos anos anteriores</h1>
          <p>Treine com edições anteriores e confira o gabarito quando terminar.</p>
        </div>

        <div className="provas-header-steps" aria-label="Como usar as provas">
          {passos.map((passo) => (
            <div className="provas-step-pill" key={passo.numero}>
              <span>{passo.numero}</span>
              <strong>{passo.titulo}</strong>
            </div>
          ))}
        </div>
      </section>

      {carregando && <p className="provas-feedback">Carregando provas...</p>}

      {!carregando && erro && <div className="provas-empty">{erro}</div>}

      {!carregando && !erro && provas.length === 0 && (
        <div className="provas-empty">Nenhuma prova anterior foi cadastrada ainda.</div>
      )}

      {!carregando && !erro && provas.length > 0 && (
        <section className="provas-grid" aria-label="Lista de provas anteriores">
          {provas.map((prova, indice) => (
            <article className="prova-card" key={prova.id}>
              <div className="prova-card-main">
                <div className="prova-card-copy">
                  <span className="prova-card-kicker">Vestibulinho ETEC</span>
                  <h2>
                    <span>Prova</span>
                    <strong>{prova.ano}</strong>
                  </h2>
                </div>

                <div className={`prova-card-visual prova-card-visual-${indice % 3}`} aria-hidden="true">
                  <div className="prova-sheet prova-sheet-back" />
                  <div className="prova-sheet prova-sheet-front">
                    <span className="prova-sheet-brand">ETEC</span>
                    <strong className="prova-sheet-year">{prova.ano}</strong>
                    <div className="prova-sheet-lines">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="prova-sheet-marks">
                      <b />
                      <b />
                      <b />
                    </div>
                  </div>
                </div>
              </div>

              <div className="prova-links">
                <a
                  href={`${API_URL}/uploads/provas/${prova.arquivo_prova}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir prova
                </a>

                <a
                  href={`${API_URL}/uploads/provas/${prova.arquivo_gabarito}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver gabarito
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
