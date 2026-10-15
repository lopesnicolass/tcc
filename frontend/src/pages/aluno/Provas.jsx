import '../../styles/aluno/Provas.css';
import { useEffect, useState } from 'react';
import { API_URL, request } from '../../services/api.js';

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

  return (
    <div className="provas-page page-shell">
      <section className="provas-header-card" aria-labelledby="provas-titulo">
        <div className="provas-header-copy">
          <span className="provas-eyebrow">Vestibulinhos ETEC</span>
          <h1 id="provas-titulo">Provas dos anos anteriores</h1>
          <p>Treine com edições anteriores e confira o gabarito quando terminar.</p>
        </div>

      </section>

      {carregando && <p className="provas-feedback">Carregando provas...</p>}

      {!carregando && erro && <div className="provas-empty">{erro}</div>}

      {!carregando && !erro && provas.length === 0 && (
        <div className="provas-empty">Nenhuma prova anterior foi cadastrada ainda.</div>
      )}

      {!carregando && !erro && provas.length > 0 && (
        <section className="provas-grid" aria-label="Lista de provas anteriores">
          {provas.map((prova) => (
            <article className="prova-card" key={prova.id}>
              <div className="prova-card-main">
                <span className="prova-pdf-icon" aria-label="Arquivo PDF" title="Arquivo PDF">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 2.5h7l5 5V21H7a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z"/>
                    <path d="M14 2.5V8h5"/>
                    <path d="M8 13h8M8 16h8"/>
                  </svg>
                  <span>PDF</span>
                </span>
                <div className="prova-card-copy">
                  <span className="prova-card-kicker">Prova anterior · ETEC</span>
                  <h2>{prova.ano}</h2>
                  <p className="prova-card-description">Questões oficiais do Vestibulinho</p>
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
