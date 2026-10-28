import '../../styles/aluno/Perfil.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api.js';
import Icon from '../../components/Icon.jsx';
import { CATEGORIAS_CONQUISTAS, montarConquistas } from '../../utils/conquistas.js';

export default function Perfil() {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // =====================================================
  // USUÁRIO
  // =====================================================

  const usuarioSalvo =
    localStorage.getItem('etecamp_usuario');

  let usuarioInicial = null;
  try {
    usuarioInicial = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch {
    usuarioInicial = null;
  }

  // =====================================================
  // ESTADOS
  // =====================================================

  const [values, setValues] = useState({
    nome: usuarioInicial?.nome || '',
    email: usuarioInicial?.email || '',
    senhaAtual: '',
    novaSenha: ''
  });

  const [foto, setFoto] = useState(null);

  const [previewFoto, setPreviewFoto] =
    useState(null);

  const [editing, setEditing] = useState({
    nome: false,
    email: false,
    senha: false
  });

  const [salvando, setSalvando] =
    useState(false);

  const [salvandoFoto, setSalvandoFoto] =
    useState(false);

  const [mensagem, setMensagem] =
    useState('');

  const [erro, setErro] =
    useState('');

  const [dadosConquistas, setDadosConquistas] = useState({
    resultados: null,
    topicos: null,
    sessoes: null,
    gamificacao: null
  });
  const [carregandoConquistas, setCarregandoConquistas] = useState(true);
  const [atualizacaoConquistas, setAtualizacaoConquistas] = useState(0);
  const [filtroConquistas, setFiltroConquistas] = useState('Todas');
  const [participaRanking, setParticipaRanking] = useState(null);
  const [modalConquistasAberto, setModalConquistasAberto] = useState(false);
  const [posicaoRanking, setPosicaoRanking] = useState(null);
  const [erroPosicaoRanking, setErroPosicaoRanking] = useState(false);
  const [salvandoRanking, setSalvandoRanking] = useState(false);
  const [erroRanking, setErroRanking] = useState('');

  useEffect(() => {
    let ativo = true;
    request('/gamificacao/ranking/configuracao')
      .then((dados) => { if (ativo) setParticipaRanking(Boolean(dados.participando)); })
      .catch(() => { if (ativo) setErroRanking('Não foi possível consultar sua participação no ranking.'); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    async function consultarPosicao() {
      try {
        const dados = await request('/gamificacao/ranking');
        const idUsuario = Number(usuarioInicial?.id);
        const indiceTop3 = Array.isArray(dados?.top3) ? dados.top3.findIndex((aluno) => Number(aluno.id) === idUsuario) : -1;
        const posicao = Number(dados?.minhaPosicao ?? (indiceTop3 >= 0 ? indiceTop3 + 1 : 0));
        if (ativo) {
          setPosicaoRanking(Number.isInteger(posicao) && posicao > 0 ? posicao : null);
          setErroPosicaoRanking(false);
        }
      } catch {
        if (ativo) { setPosicaoRanking(null); setErroPosicaoRanking(true); }
      }
    }
    consultarPosicao();
    return () => { ativo = false; };
  }, [participaRanking, usuarioInicial?.id]);

  useEffect(() => {
    if (!modalConquistasAberto) return;
    const fechar = (evento) => { if (evento.key === 'Escape') setModalConquistasAberto(false); };
    document.addEventListener('keydown', fechar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fechar); document.body.style.overflow = overflowAnterior; };
  }, [modalConquistasAberto]);

  async function alternarRanking() {
    if (participaRanking === null || salvandoRanking) return;
    setSalvandoRanking(true);
    setErroRanking('');
    try {
      const dados = await request('/gamificacao/ranking/configuracao', {
        method: 'PUT',
        body: JSON.stringify({ participando: !participaRanking })
      });
      setParticipaRanking(Boolean(dados.participando));
    } catch (falha) {
      setErroRanking(falha.message || 'Não foi possível alterar sua participação.');
    } finally {
      setSalvandoRanking(false);
    }
  }


  // Busca resultados já registrados no servidor. Falhas parciais não viram
  // medalhas bloqueadas: os itens sem fonte aparecem como não verificados.
  useEffect(() => {
    let ativo = true;
    async function carregarConquistas() {
      setCarregandoConquistas(true);
      const chamadas = [
        request('/resultados/me'),
        request('/conteudos/progresso'),
        request('/flashcards/resultados/sessoes'),
        request('/gamificacao')
      ];
      const [res, progresso, flashcards, gamificacao] = await Promise.allSettled(chamadas);
      if (!ativo) return;
      setDadosConquistas({
        resultados: res.status === 'fulfilled' && Array.isArray(res.value?.resultados)
          ? res.value.resultados : null,
        topicos: progresso.status === 'fulfilled' && Array.isArray(progresso.value?.topicos)
          ? progresso.value.topicos : null,
        sessoes: flashcards.status === 'fulfilled' && Array.isArray(flashcards.value?.sessoes)
          ? flashcards.value.sessoes : null,
        gamificacao: gamificacao.status === 'fulfilled' && Number.isFinite(Number(gamificacao.value?.xp))
          ? gamificacao.value : null
      });
      setCarregandoConquistas(false);
    }
    carregarConquistas();
    return () => { ativo = false; };
  }, [atualizacaoConquistas]);

  const conquistas = useMemo(
    () => montarConquistas(dadosConquistas),
    [dadosConquistas]
  );
  const conquistasVisiveis = conquistas.filter((item) =>
    filtroConquistas === 'Todas' || item.categoria === filtroConquistas
  );
  const totalDesbloqueadas = conquistas.filter((item) => item.desbloqueada).length;
  const faltandoVerificar = conquistas.some((item) => !item.verificado);

  // =====================================================
  // CONVERTER BLOB DO SQLITE PARA IMAGEM
  // =====================================================

  function criarImagemBase64(dados, tipo) {

    if (!dados || !tipo) {
      return null;
    }

    let dadosArray = null;

    // Caso venha diretamente como array
    if (Array.isArray(dados)) {
      dadosArray = dados;
    }

    // Caso venha como Buffer serializado pelo Express
    else if (
      dados &&
      Array.isArray(dados.data)
    ) {
      dadosArray = dados.data;
    }

    // Caso venha como Uint8Array / ArrayBuffer
    else if (
      dados instanceof Uint8Array
    ) {
      dadosArray = Array.from(dados);
    }

    if (!dadosArray || dadosArray.length === 0) {
      return null;
    }

    const bytes =
      new Uint8Array(dadosArray);

    let binario = '';

    const tamanhoBloco = 8192;

    for (
      let inicio = 0;
      inicio < bytes.length;
      inicio += tamanhoBloco
    ) {

      const fim =
        Math.min(
          inicio + tamanhoBloco,
          bytes.length
        );

      const bloco =
        bytes.subarray(
          inicio,
          fim
        );

      binario += String.fromCharCode(
        ...bloco
      );
    }

    return (
      `data:${tipo};base64,` +
      btoa(binario)
    );
  }

  // =====================================================
  // CARREGAR PERFIL
  // =====================================================

  useEffect(() => {

    async function carregarPerfil() {

      try {

        const token =
          localStorage.getItem(
            'etecamp_token'
          );

        if (!token) {

          navigate('/login');

          return;

        }

        const dados =
          await request(
            '/usuarios/meu-perfil',
            {},
            'Erro ao carregar perfil.'
          );

        const usuario =
          dados.usuario;

        // =================================================
        // DADOS DO USUÁRIO
        // =================================================

        setValues({
          nome:
            usuario.nome || '',

          email:
            usuario.email || '',

          senhaAtual: '',

          novaSenha: ''
        });

        // =================================================
        // FOTO VINDO DO SQLITE
        // =================================================

        const imagem =
          criarImagemBase64(
            usuario.foto_perfil_dados,
            usuario.foto_perfil_tipo
          );

        setFoto(imagem);

        // =================================================
        // ATUALIZAR LOCALSTORAGE
        // =================================================

        localStorage.setItem(
          'etecamp_usuario',
          JSON.stringify({
            ...usuario,
            foto_perfil: null
          })
        );

      } catch (erro) {

        console.error(erro);

        setErro(
          erro.message ||
          'Não foi possível carregar seu perfil.'
        );

      }

    }

    carregarPerfil();

  }, [navigate]);

  // =====================================================
  // ALTERAR CAMPO
  // =====================================================

  function handleChange(
    campo,
    valor
  ) {

    setValues((prev) => ({
      ...prev,
      [campo]: valor
    }));

  }

  // =====================================================
  // EDITAR CAMPO
  // =====================================================

  function toggleEdit(campo) {
    // Fechar a edição da senha descarta o preenchimento não salvo.
    if (campo === 'senha' && editing.senha) {
      setValues((prev) => ({ ...prev, senhaAtual: '', novaSenha: '' }));
    }
    setEditing((prev) => ({ ...prev, [campo]: !prev[campo] }));
  }

  // =====================================================
  // SALVAR PERFIL
  // =====================================================

  async function handleSave(e) {

    e.preventDefault();

    setMensagem('');
    setErro('');
    setSalvando(true);

    try {

      const token =
        localStorage.getItem(
          'etecamp_token'
        );

      if (!token) {

        navigate('/login');

        return;

      }

      const dados =
        await request(
          '/usuarios/meu-perfil',
          {
            method: 'PUT',

            body:
              JSON.stringify({
                nome:
                  values.nome,

                email:
                  values.email,

                senhaAtual:
                  values.senhaAtual,

                novaSenha:
                  values.novaSenha
              })
          },
          'Não foi possível atualizar o perfil.'
        );

      localStorage.setItem(
        'etecamp_usuario',
        JSON.stringify({
          ...dados.usuario,
          foto_perfil: null
        })
      );

      setValues((prev) => ({
        ...prev,
        senhaAtual: '',
        novaSenha: ''
      }));

      setEditing({
        nome: false,
        email: false,
        senha: false
      });

      setMensagem(
        'Perfil atualizado com sucesso!'
      );

    } catch (erro) {

      console.error(erro);

      setErro(
        erro.message ||
        'Erro ao atualizar perfil.'
      );

    } finally {

      setSalvando(false);

    }

  }

  // =====================================================
  // SELECIONAR FOTO
  // =====================================================

  function handleSelecionarFoto(e) {

    const arquivo =
      e.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (
      !tiposPermitidos.includes(
        arquivo.type
      )
    ) {

      setErro(
        'Escolha uma imagem JPG, PNG ou WEBP.'
      );

      return;

    }

    if (
      arquivo.size >
      5 * 1024 * 1024
    ) {

      setErro(
        'A imagem deve possuir no máximo 5 MB.'
      );

      return;

    }

    setErro('');
    setMensagem('');

    // Libera URL anterior, caso exista
    if (previewFoto?.url) {

      URL.revokeObjectURL(
        previewFoto.url
      );

    }

    const url =
      URL.createObjectURL(
        arquivo
      );

    setPreviewFoto({
      arquivo,
      url
    });

  }

  // =====================================================
  // SALVAR FOTO
  // =====================================================

  async function handleSalvarFoto() {

    if (!previewFoto) {
      return;
    }

    setSalvandoFoto(true);
    setErro('');
    setMensagem('');

    try {

      const token =
        localStorage.getItem(
          'etecamp_token'
        );

      if (!token) {

        navigate('/login');

        return;

      }

      const formData =
        new FormData();

      formData.append(
        'foto',
        previewFoto.arquivo
      );

      await request(
        '/usuarios/meu-perfil/foto',
        {
          method: 'POST',

          body: formData
        },
        'Erro ao salvar foto.'
      );

      // =================================================
      // MOSTRAR A FOTO IMEDIATAMENTE
      // =================================================

      const arrayBuffer =
        await previewFoto.arquivo.arrayBuffer();

      const imagem =
        criarImagemBase64(
          new Uint8Array(arrayBuffer),
          previewFoto.arquivo.type
        );

      setFoto(imagem);

      // =================================================
      // LIMPAR PREVIEW
      // =================================================

      URL.revokeObjectURL(
        previewFoto.url
      );

      setPreviewFoto(null);

      // =================================================
      // ATUALIZAR LOCALSTORAGE
      // =================================================

      const usuarioAtual =
        JSON.parse(
          localStorage.getItem(
            'etecamp_usuario'
          )
        ) || {};

      const usuarioAtualizado = {
        ...usuarioAtual,
        foto_perfil: null
      };

      localStorage.setItem(
        'etecamp_usuario',
        JSON.stringify(
          usuarioAtualizado
        )
      );

      setMensagem(
        'Foto atualizada com sucesso!'
      );

    } catch (erro) {

      console.error(erro);

      setErro(
        erro.message ||
        'Erro ao salvar foto.'
      );

    } finally {

      setSalvandoFoto(false);

    }

  }

  // =====================================================
  // CANCELAR FOTO
  // =====================================================

  function cancelarFoto() {

    if (previewFoto?.url) {

      URL.revokeObjectURL(
        previewFoto.url
      );

    }

    setPreviewFoto(null);

  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {

    try {

      const token =
        localStorage.getItem(
          'etecamp_token'
        );

      const usuarioSalvo =
        localStorage.getItem(
          'etecamp_usuario'
        );

      const usuario =
        usuarioSalvo
          ? JSON.parse(usuarioSalvo)
          : null;

      if (
        usuario &&
        token
      ) {

        await request(
          `/sessoes/sair/${usuario.id}`,
          {
            method: 'PUT'
          }
        );

      }

    } catch (erro) {

      console.error(
        'Erro ao encerrar sessão:',
        erro
      );

    } finally {

      localStorage.removeItem(
        'etecamp_usuario'
      );

      localStorage.removeItem(
        'etecamp_token'
      );

      localStorage.removeItem(
        'token'
      );

      navigate('/login');

    }

  }

  // =====================================================
  // EXIBIÇÃO DO PERFIL
  // =====================================================

  const imagemAvatar = previewFoto?.url || foto || null;
  const primeiraLetra = values.nome?.trim()?.charAt(0)?.toUpperCase() || '?';
  const porcentagemConquistas = conquistas.length
    ? Math.round((totalDesbloqueadas / conquistas.length) * 100)
    : 0;
  const proximaConquista = conquistas.find((item) => item.verificado && !item.desbloqueada);

  return (
    <main className="perfil-page">
      <header className="perfil-hero" aria-labelledby="perfil-titulo">
        <div className="perfil-hero-intro">
          <span className="perfil-hero-kicker">MEU ESPAÇO</span>
          <h1 id="perfil-titulo">Meu perfil</h1>
          <p>Personalize sua conta e acompanhe o que você já conquistou na TENNA.</p>
        </div>
      </header>

      {mensagem && <div className="perfil-alert perfil-alert-success" role="status"><Icon name="check" size={18} />{mensagem}</div>}
      {erro && <div className="perfil-alert perfil-alert-error" role="alert"><Icon name="question" size={18} />{erro}</div>}

      <div className="perfil-grid">
        <form className="perfil-form-card" onSubmit={handleSave}>
          <div className="perfil-form-heading">
            <span className="perfil-heading-icon"><Icon name="shield" size={21} /></span>
            <div>
              <h2>Informações da conta</h2>
              <p>Seus dados, do seu jeito.</p>
            </div>
          </div>

          <div className="perfil-account-avatar">
            <div className="avatar-circle">
              {imagemAvatar ? <img src={imagemAvatar} alt="Foto de perfil" /> : <span>{primeiraLetra}</span>}
            </div>
            <div className="perfil-avatar-info">
              <span className="perfil-eyebrow">FOTO DO PERFIL</span>
              <strong>{values.nome?.trim() || 'Estudante TENNA'}</strong>
              <span>Escolha uma foto para deixar seu perfil com a sua cara.</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleSelecionarFoto}
              className="perfil-file-input"
              aria-label="Selecionar foto de perfil"
            />
            <div className="perfil-photo-actions">
              {previewFoto ? (
                <>
                  <button type="button" className="perfil-btn perfil-btn-primary" onClick={handleSalvarFoto} disabled={salvandoFoto}>
                    {salvandoFoto ? 'Salvando...' : 'Salvar foto'}
                  </button>
                  <button type="button" className="perfil-btn perfil-btn-quiet" onClick={cancelarFoto} disabled={salvandoFoto}>Cancelar</button>
                </>
              ) : (
                <button type="button" className="perfil-btn perfil-btn-outline" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="edit" size={16} /> {foto ? 'Trocar foto' : 'Adicionar foto'}
                </button>
              )}
            </div>
          </div>

          <section className="perfil-account-fields" aria-labelledby="perfil-dados-titulo">
            <div className="perfil-subheading">
              <div>
                <h3 id="perfil-dados-titulo">Dados pessoais</h3>
                <p>Para alterar, clique no lápis ao lado do campo.</p>
              </div>
            </div>
            <div className="perfil-fields">
              <div className="perfil-field">
                <label htmlFor="perfil-nome">Nome</label>
                <div className={`perfil-input-wrap ${editing.nome ? 'is-editing' : ''}`}>
                  <input id="perfil-nome" type="text" value={values.nome} disabled={!editing.nome}
                    autoComplete="name" onChange={(e) => handleChange('nome', e.target.value)} />
                  <button type="button" className="perfil-edit-btn" onClick={() => toggleEdit('nome')}
                    aria-label={editing.nome ? 'Concluir edição do nome' : 'Editar nome'}
                    title={editing.nome ? 'Concluir edição' : 'Editar nome'} aria-pressed={editing.nome}>
                    <Icon name={editing.nome ? 'check' : 'edit'} size={17} />
                  </button>
                </div>
              </div>
              <div className="perfil-field">
                <label htmlFor="perfil-email">E-mail</label>
                <div className={`perfil-input-wrap ${editing.email ? 'is-editing' : ''}`}>
                  <input id="perfil-email" type="email" value={values.email} disabled={!editing.email}
                    autoComplete="email" onChange={(e) => handleChange('email', e.target.value)} />
                  <button type="button" className="perfil-edit-btn" onClick={() => toggleEdit('email')}
                    aria-label={editing.email ? 'Concluir edição do e-mail' : 'Editar e-mail'}
                    title={editing.email ? 'Concluir edição' : 'Editar e-mail'} aria-pressed={editing.email}>
                    <Icon name={editing.email ? 'check' : 'edit'} size={17} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className={`perfil-security ${editing.senha ? 'is-open' : ''}`} aria-labelledby="perfil-seguranca-titulo">
            <div className="perfil-security-bar">
              <span className="perfil-security-icon"><Icon name="shield" size={20} /></span>
              <div className="perfil-security-copy">
                <h3 id="perfil-seguranca-titulo">Senha e segurança</h3>
                <p>{editing.senha ? 'Preencha os campos para definir uma nova senha.' : 'Sua senha fica protegida e não é exibida aqui.'}</p>
              </div>
              <button type="button" className="perfil-btn perfil-btn-outline perfil-security-toggle" onClick={() => toggleEdit('senha')}
                aria-expanded={editing.senha} aria-controls="perfil-senha-campos">
                <Icon name={editing.senha ? 'check' : 'edit'} size={15} />{editing.senha ? 'Fechar' : 'Alterar senha'}
              </button>
            </div>
            {editing.senha && (
              <div id="perfil-senha-campos" className="perfil-password-fields">
                <div className="perfil-field">
                  <label htmlFor="perfil-senha-atual">Senha atual</label>
                  <div className="perfil-input-wrap"><input id="perfil-senha-atual" type="password" value={values.senhaAtual}
                    autoComplete="current-password" placeholder="Digite sua senha atual"
                    onChange={(e) => handleChange('senhaAtual', e.target.value)} /></div>
                </div>
                <div className="perfil-field">
                  <label htmlFor="perfil-senha-nova">Nova senha</label>
                  <div className="perfil-input-wrap"><input id="perfil-senha-nova" type="password" value={values.novaSenha}
                    autoComplete="new-password" placeholder="Digite sua nova senha"
                    onChange={(e) => handleChange('novaSenha', e.target.value)} /></div>
                </div>
              </div>
            )}
          </section>

          <div className="perfil-form-footer">
            <button type="submit" className="perfil-btn perfil-btn-primary perfil-save" disabled={salvando}>
              <Icon name="check" size={17} />{salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button type="button" className="perfil-btn perfil-logout" onClick={handleLogout}>
              <Icon name="arrowRight" size={16} /> Sair da conta
            </button>
          </div>
        </form>

        <aside className="perfil-side-column" aria-label="Seu progresso">
          <section className="perfil-conquistas-resumo" aria-labelledby="perfil-resumo-titulo">
            <div className="perfil-side-head">
              <span className="perfil-side-icon perfil-side-icon-blue"><Icon name="trophy" size={21} /></span>
              <span className="perfil-eyebrow">SUA JORNADA</span>
            </div>
            <h2 id="perfil-resumo-titulo">Minhas conquistas</h2>
            <p className="perfil-side-description">Cada etapa de estudo é uma nova conquista.</p>
            <div className="perfil-progress-main">
              <div className="perfil-progress-ring" style={{ '--perfil-progress': `${porcentagemConquistas}%` }}
                role="progressbar" aria-label="Conquistas desbloqueadas" aria-valuenow={totalDesbloqueadas}
                aria-valuemin={0} aria-valuemax={conquistas.length}>
                <div className="perfil-progress-ring-inner">
                  <strong>{carregandoConquistas ? '—' : porcentagemConquistas}%</strong>
                  <small>concluído</small>
                </div>
              </div>
              <div className="perfil-progress-info">
                <strong>{carregandoConquistas ? '—' : totalDesbloqueadas} <span>de {conquistas.length}</span></strong>
                <span>conquistas desbloqueadas</span>
                <div className="perfil-progress-divider" />
                <small>{carregandoConquistas ? 'Carregando progresso...' : totalDesbloqueadas === conquistas.length ? 'Todas as conquistas alcançadas!' : `${conquistas.length - totalDesbloqueadas} para conquistar`}</small>
              </div>
            </div>
            {/* Mantém a altura do resumo estável enquanto o progresso é buscado. */}
            <div className={`perfil-next-goal ${carregandoConquistas ? 'perfil-next-goal-loading' : ''}`}
              aria-hidden={carregandoConquistas ? 'true' : undefined}>
              {!carregandoConquistas && (
                <>
                  <span className="perfil-next-goal-icon"><Icon name={proximaConquista ? 'target' : 'trophy'} size={17} /></span>
                  <div>
                    <span>{proximaConquista ? 'PRÓXIMO OBJETIVO' : 'SUAS CONQUISTAS'}</span>
                    <strong>{proximaConquista?.titulo || (totalDesbloqueadas === conquistas.length ? 'Todos os objetivos alcançados!' : 'Próximo objetivo indisponível')}</strong>
                  </div>
                  {proximaConquista && <small>{proximaConquista.progresso}/{proximaConquista.meta}</small>}
                </>
              )}
            </div>
            <button type="button" className="perfil-btn perfil-btn-primary perfil-full-button" onClick={() => setModalConquistasAberto(true)}>
              Ver minhas conquistas <Icon name="arrowRight" size={17} />
            </button>
          </section>

          <section className="perfil-ranking-card" aria-labelledby="perfil-ranking-titulo">
            <div className="perfil-side-head">
              <span className="perfil-side-icon perfil-side-icon-gold"><Icon name="crown" size={21} /></span>
              <span className="perfil-eyebrow">COMUNIDADE</span>
            </div>
            <div className="perfil-ranking-title-row">
              <h2 id="perfil-ranking-titulo">Ranking da turma</h2>
              <span className={`perfil-ranking-status ${participaRanking ? 'is-participating' : ''}`}>
                {participaRanking === null ? 'Consultando' : participaRanking ? 'Participando' : 'Desativado'}
              </span>
            </div>
            <p className="perfil-side-description">Acompanhe sua posição entre os estudantes.</p>
            <div className="perfil-ranking-position">
              <strong>{participaRanking && posicaoRanking ? `${posicaoRanking}º` : '—'}</strong>
              <div>
                <span>{participaRanking && posicaoRanking ? 'Sua posição atual' : 'Sua posição'}</span>
                <small>{participaRanking
                  ? posicaoRanking ? 'Continue avançando!' : erroPosicaoRanking ? 'Não foi possível consultar' : 'Ainda não disponível'
                  : 'Entre para descobrir'}</small>
              </div>
            </div>
            <div className="perfil-ranking-privacy"><Icon name="shield" size={16} />
              <span>Ao participar, seu nome, foto e XP são vistos pelos outros estudantes.</span>
            </div>
            <button type="button" className={`perfil-btn perfil-ranking-toggle ${participaRanking ? 'is-active' : ''}`}
              onClick={alternarRanking} disabled={participaRanking === null || salvandoRanking} aria-pressed={Boolean(participaRanking)}>
              {participaRanking === null ? 'Consultando...' : salvandoRanking ? 'Salvando...' : participaRanking ? 'Sair do ranking' : 'Participar do ranking'}
            </button>
            {erroRanking && <p className="perfil-ranking-error" role="alert">{erroRanking}</p>}
          </section>
        </aside>
      </div>

      {modalConquistasAberto && (
        <div className="perfil-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalConquistasAberto(false); }}>
          <div className="perfil-modal-panel" role="dialog" aria-modal="true" aria-labelledby="perfil-conquistas-titulo">
            <div className="perfil-modal-header">
              <div className="perfil-modal-title">
                <span className="perfil-eyebrow"><Icon name="trophy" size={14} /> MINHA JORNADA</span>
                <h2 id="perfil-conquistas-titulo">Minhas conquistas</h2>
                <p>Descubra seus objetivos alcançados e os próximos desafios.</p>
              </div>
              <div className="perfil-modal-header-right">
                <div className="perfil-achievements-counter" aria-live="polite">
                  <strong>{carregandoConquistas ? '—' : totalDesbloqueadas}<span> / {conquistas.length}</span></strong>
                  <small>desbloqueadas</small>
                </div>
                <button type="button" className="perfil-modal-close" onClick={() => setModalConquistasAberto(false)} aria-label="Fechar conquistas"><span className="perfil-modal-x" aria-hidden="true" /></button>
              </div>
            </div>
            <div className="perfil-achievements-controls">
              <div className="perfil-achievements-filters" aria-label="Filtrar conquistas">
                {CATEGORIAS_CONQUISTAS.map((categoria) => (
                  <button key={categoria} type="button"
                    className={`perfil-achievements-filter ${filtroConquistas === categoria ? 'active' : ''}`}
                    aria-pressed={filtroConquistas === categoria}
                    onClick={() => setFiltroConquistas(categoria)}>{categoria}</button>
                ))}
              </div>
              <button type="button" className="perfil-achievements-refresh"
                onClick={() => setAtualizacaoConquistas((anterior) => anterior + 1)}
                disabled={carregandoConquistas}>
                <Icon name="refresh" size={15} /> {carregandoConquistas ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            {faltandoVerificar && !carregandoConquistas && (
              <p className="perfil-achievements-notice" role="status">Algumas informações não puderam ser consultadas. Atualize para verificar as conquistas pendentes.</p>
            )}
            <div className="perfil-modal-scroll-region">
              <div className="perfil-achievements-grid">
                {conquistasVisiveis.map((conquista) => {
                  const status = !conquista.verificado ? 'Não verificada'
                    : conquista.desbloqueada ? 'Conquistada' : 'Bloqueada';
                  return (
                    <article key={conquista.id} data-categoria={conquista.categoria}
                      className={`perfil-badge-card ${conquista.desbloqueada ? 'perfil-badge-unlocked' : 'perfil-badge-locked'}`}>
                      <div className="perfil-badge-top">
                        <span className="perfil-badge-icon" aria-hidden="true"><Icon name={conquista.icone} size={23} /></span>
                        <span className={`perfil-badge-status ${conquista.desbloqueada ? 'is-unlocked' : ''}`}>
                          {conquista.desbloqueada && !carregandoConquistas && <Icon name="check" size={12} />}
                          {carregandoConquistas ? 'Carregando' : status}
                        </span>
                      </div>
                      <span className="perfil-badge-category">{conquista.categoria}</span>
                      <h3>{conquista.titulo}</h3>
                      <p>{conquista.descricao}</p>
                      <div className="perfil-badge-bottom">
                        <div className="perfil-badge-count">
                          <span>{conquista.desbloqueada ? 'Meta alcançada' : 'Seu progresso'}</span>
                          <strong>{conquista.verificado && !carregandoConquistas
                            ? `${conquista.progresso} / ${conquista.meta}` : '—'}</strong>
                        </div>
                        <div className="perfil-badge-progress" role="progressbar"
                          aria-label={`Progresso: ${conquista.titulo}`} aria-valuemin={0}
                          aria-valuemax={conquista.meta} aria-valuenow={conquista.verificado ? conquista.progresso : 0}>
                          <span style={{ width: `${!carregandoConquistas ? conquista.porcentagem : 0}%` }} />
                        </div>
                      </div>
                      {!conquista.desbloqueada && conquista.verificado && !carregandoConquistas && (
                        <button type="button" className="perfil-badge-link" onClick={() => navigate(conquista.destino)}>
                          Continuar estudando <Icon name="arrowRight" size={14} />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
            <footer className="perfil-modal-footer">
              <p><Icon name="shield" size={14} /> As conquistas registram seu progresso e não concedem XP adicional.</p>
              <span>{conquistasVisiveis.length} {conquistasVisiveis.length === 1 ? 'conquista' : 'conquistas'} nesta categoria</span>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
