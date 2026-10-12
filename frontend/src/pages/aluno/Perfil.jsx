import '../../styles/aluno/Perfil.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api.js';
import { LEVEL_TITLES, xpForLevel } from '../../context/GamificationContext.jsx';
import Icon from '../../components/Icon.jsx';
import { CATEGORIAS_CONQUISTAS, calcularNivelPorXp, montarConquistas } from '../../utils/conquistas.js';

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
  const [salvandoRanking, setSalvandoRanking] = useState(false);
  const [erroRanking, setErroRanking] = useState('');

  useEffect(() => {
    let ativo = true;
    request('/gamificacao/ranking/configuracao')
      .then((dados) => { if (ativo) setParticipaRanking(Boolean(dados.participando)); })
      .catch(() => { if (ativo) setErroRanking('Não foi possível consultar sua participação no ranking.'); });
    return () => { ativo = false; };
  }, []);

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
  const dadosXP = dadosConquistas.gamificacao;
  const nivelInfo = dadosXP ? calcularNivelPorXp(dadosXP.xp, xpForLevel) : null;
  const tituloNivel = nivelInfo
    ? LEVEL_TITLES[Math.min(nivelInfo.nivel - 1, LEVEL_TITLES.length - 1)]
    : 'Aguardando dados';
  const progressoNivel = nivelInfo
    ? Math.round((nivelInfo.xpNoNivel / nivelInfo.xpProximoNivel) * 100)
    : 0;

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

    setEditing((prev) => ({
      ...prev,
      [campo]:
        !prev[campo]
    }));

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
  // AVATAR
  // =====================================================

  const imagemAvatar =
    previewFoto?.url ||
    foto ||
    null;

  const primeiraLetra =
    values.nome
      ?.charAt(0)
      ?.toUpperCase() || '?';

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="perfil-page">

      {mensagem && (
        <div className="perfil-alert perfil-alert-success">
          <span className="perfil-alert-icon">✓</span>
          <span>{mensagem}</span>
        </div>
      )}

      {erro && (
        <div className="perfil-alert perfil-alert-error">
          <span className="perfil-alert-icon">!</span>
          <span>{erro}</span>
        </div>
      )}

      <section className="perfil-hero" aria-labelledby="perfil-titulo">
        <div className="perfil-hero-intro">
          <span className="perfil-hero-kicker"><Icon name="trophy" size={15} /> SUA JORNADA</span>
          <h1 id="perfil-titulo">Seu espaço de conquistas</h1>
          <p>Acompanhe seu nível, veja o que já conquistou e descubra seus próximos objetivos.</p>
        </div>
        <div className="perfil-hero-dados">
          <div className="perfil-level-details">
            <span className="perfil-level-badge">{nivelInfo ? nivelInfo.nivel : '—'}</span>
            <div>
              <span className="perfil-level-label">NÍVEL ATUAL</span>
              <strong>{tituloNivel}</strong>
            </div>
          </div>
          <div className="perfil-level-track" role="progressbar" aria-label="Progresso do nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressoNivel}>
            <span style={{ width: `${progressoNivel}%` }} />
          </div>
          <div className="perfil-level-foot">
            <span>{nivelInfo ? `${nivelInfo.xpNoNivel} / ${nivelInfo.xpProximoNivel} XP no nível` : 'XP indisponível'}</span>
            <span>{dadosXP ? `${Number(dadosXP.xp).toLocaleString('pt-BR')} XP total` : '—'}</span>
          </div>
          <div className="perfil-hero-streak"><Icon name="calendar" size={16} /><strong>{dadosXP ? Number(dadosXP.streak) || 0 : '—'}</strong> dias de sequência atual</div>
        </div>
      </section>

      <div className="perfil-grid">

        <form
          className="panel-card perfil-form-card"
          onSubmit={handleSave}
        >

          <div className="perfil-form-heading">
            <div>
              <span className="perfil-section-kicker">DADOS DA CONTA</span>
              <h2>Informações do perfil</h2>
              <p>Atualize seus dados pessoais e mantenha sua conta sempre organizada.</p>
            </div>
          </div>

          <div className="perfil-fields">

          <div className="perfil-field">

            <label>
              Nome
            </label>

            <div className="perfil-input-wrap">

              <input
                type="text"
                value={values.nome}
                disabled={!editing.nome}
                onChange={(e) =>
                  handleChange(
                    'nome',
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="perfil-edit-btn"
                onClick={() =>
                  toggleEdit('nome')
                }
                aria-label="Editar nome"
              >
                ✎
              </button>

            </div>

          </div>

          <div className="perfil-field">

            <label>
              E-mail
            </label>

            <div className="perfil-input-wrap">

              <input
                type="email"
                value={values.email}
                disabled={!editing.email}
                onChange={(e) =>
                  handleChange(
                    'email',
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="perfil-edit-btn"
                onClick={() =>
                  toggleEdit('email')
                }
                aria-label="Editar e-mail"
              >
                ✎
              </button>

            </div>

          </div>

          <div className="perfil-field">

            <label>
              Senha atual
            </label>

            <div className="perfil-input-wrap">

              <input
                type="password"
                value={values.senhaAtual}
                disabled={!editing.senha}
                placeholder={
                  editing.senha
                    ? 'Digite sua senha atual'
                    : '••••••••'
                }
                onChange={(e) =>
                  handleChange(
                    'senhaAtual',
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="perfil-edit-btn"
                onClick={() =>
                  toggleEdit('senha')
                }
                aria-label="Editar senha"
              >
                ✎
              </button>

            </div>

          </div>

          {editing.senha && (

            <div className="perfil-field">

              <label>
                Nova senha
              </label>

              <div className="perfil-input-wrap">

                <input
                  type="password"
                  value={values.novaSenha}
                  placeholder="Digite a nova senha"
                  onChange={(e) =>
                    handleChange(
                      'novaSenha',
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

          )}

          </div>

          <div className="perfil-form-footer">
            <span>Suas alterações serão aplicadas à sua conta.</span>
            <button
              type="submit"
              className="mural-btn primary"
              disabled={salvando}
            >
              {salvando
                ? 'Salvando...'
                : 'Salvar alterações'}
            </button>
          </div>

        </form>

        <div className="perfil-side-column">
          <div className="perfil-avatar-card perfil-profile-card">

            <div className="perfil-side-heading">
              <span className="perfil-section-kicker">SUA CONTA</span>
              <h3>Foto de perfil</h3>
            </div>

            <div
              className="avatar-circle"
              style={{
                overflow: 'hidden',
                position: 'relative'
              }}
            >

              {imagemAvatar ? (

                <img
                  src={imagemAvatar}
                  alt="Foto de perfil"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

              ) : (

                primeiraLetra

              )}

            </div>

            <div className="perfil-avatar-meta">
              <strong>{values.nome || 'Seu perfil'}</strong>
              <span>{values.email || 'E-mail da conta'}</span>
            </div>

            <span className="perfil-profile-badge">Perfil pessoal</span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleSelecionarFoto
              }
              style={{
                display: 'none'
              }}
            />

            <button
              type="button"
              className="mural-btn"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              {foto
                ? 'Alterar foto'
                : 'Adicionar foto'}
            </button>

            {previewFoto && (

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >

                <button
                  type="button"
                  className="mural-btn primary"
                  onClick={
                    handleSalvarFoto
                  }
                  disabled={salvandoFoto}
                >
                  {salvandoFoto
                    ? 'Salvando...'
                    : 'Salvar foto'}
                </button>

                <button
                  type="button"
                  className="mural-btn"
                  onClick={
                    cancelarFoto
                  }
                >
                  Cancelar
                </button>

              </div>

            )}

            <button
              type="button"
              className="btn-logout"
              onClick={
                handleLogout
              }
            >

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >

                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />

              </svg>

              Sair

            </button>

          </div>

          <section className="perfil-ranking-card" aria-labelledby="perfil-ranking-titulo">
            <div className="perfil-ranking-top">
              <Icon name="trophy" size={22} />
              <div>
                <h3 id="perfil-ranking-titulo">Ranking da turma</h3>
                <p>Escolha se deseja aparecer no Top 3 de XP da Home.</p>
              </div>
            </div>
            <p className="perfil-ranking-description">
              Ao participar, estudantes logados poderão ver seu nome, foto de perfil e XP. Você pode sair quando quiser.
            </p>
            <button
              type="button"
              className={`perfil-ranking-toggle ${participaRanking ? 'is-active' : ''}`}
              onClick={alternarRanking}
              disabled={participaRanking === null || salvandoRanking}
              aria-pressed={Boolean(participaRanking)}
            >
              {participaRanking === null ? 'Consultando...' : salvandoRanking ? 'Salvando...' : participaRanking ? 'Participando · Sair do ranking' : 'Participar do ranking'}
            </button>
            {erroRanking && <p className="perfil-ranking-error" role="alert">{erroRanking}</p>}
          </section>
        </div>

      </div>

      <section className="perfil-achievements-section panel-card" aria-labelledby="perfil-conquistas-titulo">
        <div className="perfil-achievements-heading">
          <div>
            <span className="perfil-section-kicker">METAS DO SEU ESTUDO</span>
            <h2 id="perfil-conquistas-titulo">Suas conquistas</h2>
            <p>Medalhas liberadas conforme seu progresso registrado no Tenna.</p>
          </div>
          <div className="perfil-achievements-counter" aria-live="polite">
            <strong>{carregandoConquistas ? '—' : totalDesbloqueadas} / {conquistas.length}</strong>
            <span>desbloqueadas</span>
          </div>
        </div>

        <div className="perfil-achievements-controls">
          <div className="perfil-achievements-filters" aria-label="Filtrar conquistas">
            {CATEGORIAS_CONQUISTAS.map((categoria) => (
              <button key={categoria} type="button"
                className={`perfil-achievements-filter ${filtroConquistas === categoria ? 'active' : ''}`}
                aria-pressed={filtroConquistas === categoria}
                onClick={() => setFiltroConquistas(categoria)}>
                {categoria}
              </button>
            ))}
          </div>
          <button type="button" className="perfil-achievements-refresh"
            onClick={() => setAtualizacaoConquistas((anterior) => anterior + 1)}
            disabled={carregandoConquistas}>
            <Icon name="refresh" size={15} /> {carregandoConquistas ? 'Atualizando...' : 'Atualizar progresso'}
          </button>
        </div>

        {faltandoVerificar && !carregandoConquistas && (
          <p className="perfil-achievements-notice" role="status">
            Algumas informações não puderam ser consultadas. Tente atualizar para verificar as medalhas pendentes.
          </p>
        )}

        <div className="perfil-achievements-grid">
          {conquistasVisiveis.map((conquista) => {
            const status = !conquista.verificado ? 'Não verificada'
              : conquista.desbloqueada ? 'Conquistada' : 'Bloqueada';
            return (
              <article key={conquista.id}
                className={`perfil-badge-card ${conquista.desbloqueada ? 'perfil-badge-unlocked' : 'perfil-badge-locked'}`}>
                <div className="perfil-badge-top">
                  <div className="perfil-badge-icon" aria-hidden="true"><Icon name={conquista.icone} size={23} /></div>
                  <span className={`perfil-badge-status ${conquista.desbloqueada ? 'is-unlocked' : ''}`}>
                    {carregandoConquistas ? 'Carregando' : status}
                  </span>
                </div>
                <span className="perfil-badge-category">{conquista.categoria}</span>
                <h3>{conquista.titulo}</h3>
                <p>{conquista.descricao}</p>
                <div className="perfil-badge-bottom">
                  <div className="perfil-badge-count">
                    <span>Progresso</span>
                    <strong>{conquista.verificado && !carregandoConquistas
                      ? `${conquista.progresso} / ${conquista.meta}` : '—'}</strong>
                  </div>
                  <div className="perfil-badge-progress" role="progressbar"
                    aria-label={`Progresso: ${conquista.titulo}`}
                    aria-valuemin={0} aria-valuemax={conquista.meta}
                    aria-valuenow={conquista.verificado ? conquista.progresso : 0}>
                    <span style={{ width: `${!carregandoConquistas ? conquista.porcentagem : 0}%` }} />
                  </div>
                </div>
                {!conquista.desbloqueada && conquista.verificado && !carregandoConquistas && (
                  <button type="button" className="perfil-badge-link"
                    onClick={() => navigate(conquista.destino)}>
                    Ir estudar <Icon name="arrowRight" size={15} />
                  </button>
                )}
              </article>
            );
          })}
        </div>
        <p className="perfil-achievements-explainer">
          As conquistas refletem seu progresso atual. Elas não concedem XP adicional. A meta de horas semanais não aparece porque o Tenna ainda não registra horas efetivas de estudo.
        </p>
      </section>

    </div>

  );
}
