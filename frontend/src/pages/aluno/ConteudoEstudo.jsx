import '../../styles/aluno/ConteudoEstudo.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import SubjectIcon from '../../components/SubjectIcon.jsx';
import { getSubjectStyle } from '../../utils/subjects.js';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obterToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token')
  );
}

function youtubeEmbed(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : '';
      }

      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : '';
      }
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
}

function normalizarDados(bloco) {
  if (!bloco?.dados) return {};
  if (typeof bloco.dados === 'object') return bloco.dados;

  try {
    return JSON.parse(bloco.dados);
  } catch {
    return {};
  }
}

function TextoComQuebras({ texto }) {
  if (!texto) return null;

  return (
    <div className="study-rich-text">
      {String(texto).split('\n').map((linha, index) => (
        <p key={`${index}-${linha.slice(0, 10)}`}>
          {linha || '\u00a0'}
        </p>
      ))}
    </div>
  );
}

function BlocoConteudo({ bloco }) {
  const dados = normalizarDados(bloco);
  const titulo = dados.titulo;

  switch (bloco.tipo) {
    case 'texto':
      return (
        <article className="study-block study-text-block">
          {titulo && <h2>{titulo}</h2>}
          <TextoComQuebras texto={dados.texto} />
        </article>
      );

    case 'destaque':
      return (
        <article
          className={`study-block study-highlight study-highlight-${dados.variante || 'info'}`}
        >
          {titulo && <h3>{titulo}</h3>}
          <TextoComQuebras texto={dados.texto} />
        </article>
      );

    case 'video': {
      const embed = youtubeEmbed(dados.url);

      if (!embed) {
        return (
          <article className="study-block study-video-block">
            <div className="study-block-error">
              O vídeo desta aula ainda não possui um link válido do YouTube.
            </div>
          </article>
        );
      }

      return (
        <article className="study-block study-video-block">
          <div className="study-block-heading">
            <span className="study-block-icon">
              <span className="study-play-symbol">▶</span>
            </span>
            <div>
              <span className="study-block-kicker">VIDEOAULA</span>
              <h2>{titulo || 'Assista à videoaula'}</h2>
            </div>
          </div>

          <div className="study-video-frame">
            <iframe
              src={embed}
              title={titulo || 'Videoaula do conteúdo'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {dados.descricao && (
            <p className="study-video-description">{dados.descricao}</p>
          )}
        </article>
      );
    }

    case 'imagem':
      return (
        <article className="study-block study-image-block">
          {titulo && <h2>{titulo}</h2>}
          {dados.url ? (
            <figure>
              <img src={dados.url} alt={dados.alt || titulo || 'Imagem do conteúdo'} />
              {dados.legenda && <figcaption>{dados.legenda}</figcaption>}
            </figure>
          ) : (
            <div className="study-block-error">Esta imagem ainda não possui uma URL.</div>
          )}
        </article>
      );

    case 'pdf':
      return (
        <article className="study-block study-material-block">
          <div className="study-material-icon"><Icon name="book" size={22} /></div>
          <div>
            <span className="study-block-kicker">MATERIAL COMPLEMENTAR</span>
            <h2>{titulo || 'Material para estudar'}</h2>
            {dados.descricao && <p>{dados.descricao}</p>}
            {dados.url && (
              <a href={dados.url} target="_blank" rel="noreferrer" className="study-action-link">
                Abrir material →
              </a>
            )}
          </div>
        </article>
      );

    case 'lista':
      return (
        <article className="study-block study-list-block">
          {titulo && <h2>{titulo}</h2>}
          <ul>
            {(Array.isArray(dados.itens) ? dados.itens : []).filter(Boolean).map((item, index) => (
              <li key={`${index}-${item}`}><span>✓</span>{item}</li>
            ))}
          </ul>
        </article>
      );

    case 'checklist':
      return (
        <article className="study-block study-list-block study-checklist-block">
          {titulo && <h2>{titulo}</h2>}
          <ul>
            {(Array.isArray(dados.itens) ? dados.itens : []).filter(Boolean).map((item, index) => (
              <li key={`${index}-${item}`}><span>□</span>{item}</li>
            ))}
          </ul>
        </article>
      );

    case 'flashcards':
    case 'questoes':
    case 'simulado':
      return (
        <article className="study-block study-related-block">
          <div className="study-related-icon">✦</div>
          <div>
            <span className="study-block-kicker">PARA PRATICAR</span>
            <h2>{titulo || 'Continue praticando'}</h2>
            {dados.descricao && <p>{dados.descricao}</p>}
            <p className="study-related-note">
              Este material está relacionado a esta aula e pode ser usado para revisar o conteúdo.
            </p>
          </div>
        </article>
      );

    default:
      return null;
  }
}

export default function ConteudoEstudo() {
  const navigate = useNavigate();
  const { topicoId } = useParams();

  const [pagina, setPagina] = useState(null);
  const [blocos, setBlocos] = useState([]);
  const [estudado, setEstudado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    const token = obterToken();

    try {
      setCarregando(true);
      setErro('');

      const resposta = await fetch(
        `${API_URL}/paginas-conteudo/topico/${topicoId}`,
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados.erro || dados.mensagem || 'Não foi possível carregar esta aula.'
        );
      }

      if (!dados.pagina) {
        setPagina(null);
        setBlocos([]);
        return;
      }

      setPagina(dados.pagina);
      setBlocos(
        (Array.isArray(dados.blocos) ? dados.blocos : [])
          .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))
      );

      if (token) {
        const progresso = await fetch(`${API_URL}/conteudos/progresso`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dadosProgresso = await progresso.json().catch(() => ({}));
        const item = Array.isArray(dadosProgresso.topicos)
          ? dadosProgresso.topicos.find(
              (topico) => Number(topico.topico_id) === Number(topicoId)
            )
          : null;
        setEstudado(Boolean(item?.estudado));
      }
    } catch (error) {
      console.error('Erro ao carregar aula:', error);
      setErro(error.message || 'Não foi possível carregar esta aula.');
    } finally {
      setCarregando(false);
    }
  }, [topicoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const materiaStyle = useMemo(
    () => getSubjectStyle(pagina?.materia || ''),
    [pagina?.materia]
  );

  async function alternarEstudado() {
    const token = obterToken();
    if (!token) {
      setErro('Sua sessão não foi encontrada. Faça login novamente.');
      return;
    }

    const novoStatus = !estudado;

    try {
      setSalvando(true);
      setErro('');

      const resposta = await fetch(
        `${API_URL}/conteudos/progresso/${Number(topicoId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estudado: novoStatus }),
        }
      );

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(
          dados.erro || dados.mensagem || 'Não foi possível salvar seu progresso.'
        );
      }

      setEstudado(novoStatus);
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      setErro(error.message || 'Não foi possível salvar seu progresso.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="conteudo-estudo-page">
        <div className="study-state">
          <strong>Carregando aula...</strong>
          <span>Preparando o conteúdo para você estudar.</span>
        </div>
      </div>
    );
  }

  if (erro && !pagina) {
    return (
      <div className="conteudo-estudo-page">
        <button className="study-back-button" onClick={() => navigate('/conteudos')}>
          ← Voltar para conteúdos
        </button>
        <div className="study-state study-state-error">
          <strong>Não foi possível abrir esta aula.</strong>
          <span>{erro}</span>
        </div>
      </div>
    );
  }

  if (!pagina) {
    return (
      <div className="conteudo-estudo-page">
        <button className="study-back-button" onClick={() => navigate('/conteudos')}>
          ← Voltar para conteúdos
        </button>
        <div className="study-empty-content">
          <div className="study-empty-icon"><Icon name="book" size={30} /></div>
          <h1>Conteúdo em preparação</h1>
          <p>Este tópico já está disponível na lista de estudos, mas a aula ainda não foi publicada.</p>
          <button className="study-primary-button" onClick={() => navigate('/conteudos')}>
            Voltar para conteúdos
          </button>
        </div>
      </div>
    );
  }

  const nomesBlocos = {
    texto: 'Explicação',
    destaque: 'Ponto importante',
    video: 'Videoaula',
    imagem: 'Imagem',
    pdf: 'Material complementar',
    lista: 'Lista',
    checklist: 'Checklist',
    flashcards: 'Flashcards',
    questoes: 'Questões',
    simulado: 'Simulado',
  };

  return (
    <div className="conteudo-estudo-page">
      <button className="study-back-button" onClick={() => navigate('/conteudos')}>
        ← Voltar para conteúdos
      </button>

      <div className="study-breadcrumb">
        <span>Conteúdos</span><b>›</b><span>{pagina.materia || 'Matéria'}</span><b>›</b><strong>{pagina.topico || pagina.titulo}</strong>
      </div>

      <header className="study-hero" style={{ borderLeftColor: materiaStyle.color }}>
        <div className="study-hero-icon" style={{ background: materiaStyle.bg, color: materiaStyle.color }}>
          <SubjectIcon materia={pagina.materia} size={25} />
        </div>
        <div className="study-hero-copy">
          <div className="study-title-line">
            <span className="study-eyebrow">{pagina.materia || 'CONTEÚDO'} · AULA</span>
            <span className={`study-status-pill ${estudado ? 'done' : ''}`}>{estudado ? '✓ Estudado' : 'Não estudado'}</span>
          </div>
          <h1>{pagina.titulo || pagina.topico}</h1>
          <p>{pagina.descricao || `Aprenda ${pagina.topico || 'este conteúdo'} com explicações e materiais de apoio.`}</p>
        </div>
      </header>

      {erro && <div className="study-inline-error">{erro}</div>}

      <div className="study-layout">
        <main className="study-content-column">
          {blocos.length ? (
            blocos.map((bloco, index) => (
              <div className="study-numbered-block" id={`bloco-${bloco.id}`} key={bloco.id}>
                <span className="study-block-number">{String(index + 1).padStart(2, '0')}</span>
                <BlocoConteudo bloco={bloco} />
              </div>
            ))
          ) : (
            <div className="study-empty-content study-empty-small">
              <h2>Aula ainda sem conteúdo</h2>
              <p>O administrador pode adicionar texto, vídeo, imagens e materiais pelo construtor de conteúdos.</p>
            </div>
          )}

          <section className={`study-completion-card ${estudado ? 'completed' : ''}`}>
            <div>
              <span className="study-block-kicker">SEU PROGRESSO</span>
              <h2>{estudado ? 'Conteúdo concluído!' : 'Terminou de estudar?'}</h2>
              <p>{estudado ? 'Esta aula já está marcada como estudada no seu progresso.' : 'Marque esta aula como estudada para acompanhar sua evolução.'}</p>
            </div>
            <button className="study-complete-button" onClick={alternarEstudado} disabled={salvando}>
              {salvando ? 'Salvando...' : estudado ? '✓ Estudado' : 'Concluir aula'}
            </button>
          </section>
        </main>

        <aside className="study-sidebar">
          <section className="study-side-card">
            <span className="study-side-kicker">NESTA AULA</span>
            <h2>Conteúdos</h2>
            <div className="study-side-list">
              {blocos.map((bloco, index) => (
                <a key={bloco.id} href={`#bloco-${bloco.id}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {normalizarDados(bloco).titulo || nomesBlocos[bloco.tipo] || 'Conteúdo'}
                </a>
              ))}
            </div>
          </section>
          <section className="study-side-card study-side-progress">
            <span className="study-side-kicker">PROGRESSO</span>
            <div className="study-side-progress-row"><strong>{estudado ? '100%' : '0%'}</strong><span>{estudado ? 'Concluída' : 'Em andamento'}</span></div>
            <div className="study-side-track"><span style={{ width: estudado ? '100%' : '0%' }} /></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
