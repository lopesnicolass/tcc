import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Perfil() {
  const navigate = useNavigate();

  const usuarioSalvo = localStorage.getItem('etecamp_usuario');
  const usuarioLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  function handleLogout() {
    localStorage.removeItem('etecamp_usuario');
    navigate('/login');
  }
  const [editing, setEditing] = useState({ nome: false, email: false, senha: false });
  const [values, setValues] = useState({
    nome: usuarioLogado?.nome || '',
    email: usuarioLogado?.email || '',
    senha: '••••••••',
  });

  function toggleEdit(field) {
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    setEditing({ nome: false, email: false, senha: false });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Perfil</h1>
          <p>Organize seu perfil</p>
        </div>
      </div>

      <div className="perfil-grid">
        <form className="panel-card" onSubmit={handleSave}>
          <div className="perfil-field">
            <label>Nome</label>
            <div className="perfil-input-wrap">
              <input
                type="text"
                value={values.nome}
                disabled={!editing.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
              />
              <button type="button" className="perfil-edit-btn" onClick={() => toggleEdit('nome')} aria-label="Editar nome">✎</button>
            </div>
          </div>

          <div className="perfil-field">
            <label>E-mail</label>
            <div className="perfil-input-wrap">
              <input
                type="email"
                value={values.email}
                disabled={!editing.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <button type="button" className="perfil-edit-btn" onClick={() => toggleEdit('email')} aria-label="Editar e-mail">✎</button>
            </div>
          </div>

          <div className="perfil-field">
            <label>Senha</label>
            <div className="perfil-input-wrap">
              <input
                type={editing.senha ? 'text' : 'password'}
                value={values.senha}
                disabled={!editing.senha}
                onChange={(e) => handleChange('senha', e.target.value)}
              />
              <button type="button" className="perfil-edit-btn" onClick={() => toggleEdit('senha')} aria-label="Editar senha">✎</button>
            </div>
          </div>

          <button type="submit" className="mural-btn primary">Salvar Alterações</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="perfil-avatar-card">
            <div className="avatar-circle">{values.nome.charAt(0)}</div>
            <strong>{values.nome}</strong>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sair
            </button>
          </div>

          <div className="panel-card">
            <h3>Conquistas</h3>
            <div className="achievement-list">
              <div className="achievement-item">
                <div className="achievement-icon">🏆</div>
                <div className="achievement-text">
                  <strong>Nota Máxima</strong>
                  <span>Acertou 100% em um simulado</span>
                </div>
              </div>
              <div className="achievement-item">
                <div className="achievement-icon">🎯</div>
                <div className="achievement-text">
                  <strong>Meta Semanal</strong>
                  <span>Completou 20h de estudo em uma semana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}