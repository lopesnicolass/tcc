import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import logoWordmark from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState(location.state?.view === 'cadastro' ? 'cadastro' : 'login');
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [loginErrors, setLoginErrors] = useState({});
  const [cadErrors, setCadErrors] = useState({});
  const [loginServerError, setLoginServerError] = useState('');
  const [cadServerError, setCadServerError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [cadLoading, setCadLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showCadPass, setShowCadPass] = useState(false);

  const loginBtnRef = useRef(null);
  const cadBtnRef = useRef(null);
  const viewportRef = useRef(null);
  const loginViewRef = useRef(null);
  const cadViewRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    const activeBtn = view === 'login' ? loginBtnRef.current : cadBtnRef.current;
    const activeView = view === 'login' ? loginViewRef.current : cadViewRef.current;
    if (activeBtn && indicatorRef.current) {
      indicatorRef.current.style.width = activeBtn.offsetWidth + 'px';
      indicatorRef.current.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    }
    if (activeView && viewportRef.current) {
      viewportRef.current.style.height = activeView.offsetHeight + 'px';
    }
  }, [view]);

  function fireToast(msg) {
    setToast(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoginServerError('');

    const email = e.target.email.value;
    const senha = e.target.senha.value;
    const errors = {};
    if (!validateEmail(email)) errors.email = true;
    if (senha.length < 6) errors.senha = true;
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoginLoading(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email,
    senha
  }),
});

const dados = await resposta.json();

console.log("RESPOSTA DO LOGIN:", dados);

if (!resposta.ok) {
  setLoginServerError(dados.mensagem || 'Não foi possível entrar.');
  setLoginLoading(false);
  return;
}

localStorage.setItem(
  'etecamp_usuario',
  JSON.stringify(dados.usuario)
);

localStorage.setItem(
  'etecamp_token',
  dados.token
);

localStorage.setItem('token', dados.token);

setLoginLoading(false);

fireToast(
  dados.mensagem || 'Login realizado! Redirecionando para o painel...'
);

setTimeout(() => {
  navigate(
    dados.usuario?.tipo === 'admin'
      ? '/admin/usuarios'
      : '/home'
  );
}, 900);

    } catch (erro) {
      console.error(erro);
      setLoginServerError('Não foi possível conectar ao servidor.');
      setLoginLoading(false);
    }
  }

  async function handleCadSubmit(e) {
    e.preventDefault();
    setCadServerError('');

    const nome = e.target.nome.value;
    const email = e.target.email.value;
    const senha = e.target.senha.value;
    const errors = {};
    if (nome.trim().length < 2) errors.nome = true;
    if (!validateEmail(email)) errors.email = true;
    if (senha.length < 6) errors.senha = true;
    setCadErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCadLoading(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setCadServerError(dados.mensagem || 'Não foi possível criar a conta.');
        setCadLoading(false);
        return;
      }

      setCadLoading(false);
      fireToast(dados.mensagem || 'Conta criada com sucesso! Bem-vindo(a).');
      setTimeout(() => setView('login'), 1200);

    } catch (erro) {
      console.error(erro);
      setCadServerError('Não foi possível conectar ao servidor.');
      setCadLoading(false);
    }
  }

  return (
    <div className="page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate('/')}
        aria-label="Voltar para a página inicial"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="app">
        <div className="panel-visual panel-visual-simple">
          <button
            type="button"
            className="panel-visual-logo-btn"
            onClick={() => navigate('/')}
            aria-label="Voltar para a página inicial"
          >
            <img src={logoWordmark} alt="Prepara ETECAMP" className="panel-visual-logo" />
          </button>
        </div>

        <div className="panel-form">
          <div className="tab-switch">
            <div className="tab-indicator" ref={indicatorRef}></div>
            <button ref={loginBtnRef} className={`tab-btn ${view === 'login' ? 'active' : ''}`} onClick={() => setView('login')}>
              Entrar
            </button>
            <button ref={cadBtnRef} className={`tab-btn ${view === 'cadastro' ? 'active' : ''}`} onClick={() => setView('cadastro')}>
              Cadastrar
            </button>
          </div>

          <div className="form-viewport" ref={viewportRef}>
            <div className="form-track" style={{ transform: view === 'login' ? 'translateX(0%)' : 'translateX(-50%)' }}>

              <div className="view" ref={loginViewRef}>
                <div className="form-head">
                  <p className="eyebrow">Bem-vindo de volta</p>
                  <h2>Entrar na plataforma</h2>
                  <p className="sub">Continue de onde você parou nos seus estudos.</p>
                </div>
                <form onSubmit={handleLoginSubmit} noValidate>
                  {loginServerError && (
                    <div className="field" style={{ marginBottom: 6 }}>
                      <span style={{ color: '#C1462F', fontSize: 13.5, fontWeight: 600 }}>{loginServerError}</span>
                    </div>
                  )}
                  <div className={`field ${loginErrors.email ? 'has-error' : ''}`}>
                    <label htmlFor="login-email">E-mail</label>
                    <input type="email" id="login-email" name="email" placeholder="seunome@email.com" />
                    <span className="error-msg">Digite um e-mail válido.</span>
                  </div>
                  <div className={`field ${loginErrors.senha ? 'has-error' : ''}`}>
                    <label htmlFor="login-senha">Senha</label>
                    <div className="field-input-wrap">
                      <input
                        type={showLoginPass ? 'text' : 'password'}
                        id="login-senha"
                        name="senha"
                        className="has-toggle"
                        placeholder="••••••••"
                      />
                      <button type="button" className="toggle-eye" onClick={() => setShowLoginPass(!showLoginPass)} aria-label="Mostrar senha">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                    <span className="error-msg">A senha deve ter pelo menos 6 caracteres.</span>
                  </div>
                  <div className="field-row">
                    <button
                      type="button"
                      className="link-inline link-btn"
                      onClick={() => fireToast('Envie um e-mail para suporte@prepararetecamp.com para redefinir sua senha.')}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <button type="submit" className={`btn-primary ${loginLoading ? 'loading' : ''}`}>
                    <span className="btn-label">Entrar</span>
                    <span className="spinner"></span>
                  </button>
                </form>
                <p className="switch-line">
                  Ainda não possui uma conta? <button type="button" onClick={() => setView('cadastro')}>Cadastre-se</button>
                </p>
              </div>

              <div className="view" ref={cadViewRef}>
                <div className="form-head">
                  <p className="eyebrow">Comece agora</p>
                  <h2>Criar sua conta</h2>
                  <p className="sub">Leva menos de um minuto para começar a organizar seus estudos.</p>
                </div>
                <form onSubmit={handleCadSubmit} noValidate>
                  {cadServerError && (
                    <div className="field" style={{ marginBottom: 6 }}>
                      <span style={{ color: '#C1462F', fontSize: 13.5, fontWeight: 600 }}>{cadServerError}</span>
                    </div>
                  )}
                  <div className={`field ${cadErrors.nome ? 'has-error' : ''}`}>
                    <label htmlFor="cad-nome">Nome</label>
                    <input type="text" id="cad-nome" name="nome" placeholder="Seu nome completo" />
                    <span className="error-msg">Digite seu nome.</span>
                  </div>
                  <div className={`field ${cadErrors.email ? 'has-error' : ''}`}>
                    <label htmlFor="cad-email">E-mail</label>
                    <input type="email" id="cad-email" name="email" placeholder="seunome@email.com" />
                    <span className="error-msg">Digite um e-mail válido.</span>
                  </div>
                  <div className={`field ${cadErrors.senha ? 'has-error' : ''}`}>
                    <label htmlFor="cad-senha">Senha</label>
                    <div className="field-input-wrap">
                      <input
                        type={showCadPass ? 'text' : 'password'}
                        id="cad-senha"
                        name="senha"
                        className="has-toggle"
                        placeholder="Crie uma senha"
                      />
                      <button type="button" className="toggle-eye" onClick={() => setShowCadPass(!showCadPass)} aria-label="Mostrar senha">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                    <span className="error-msg">A senha deve ter pelo menos 6 caracteres.</span>
                  </div>
                  <button type="submit" className={`btn-primary ${cadLoading ? 'loading' : ''}`}>
                    <span className="btn-label">Cadastrar</span>
                    <span className="spinner"></span>
                  </button>
                </form>
                <p className="switch-line">
                  Já possui uma conta? <button type="button" onClick={() => setView('login')}>Entrar</button>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>
        <span className="dot"></span><span>{toast}</span>
      </div>
    </div>
  );
}