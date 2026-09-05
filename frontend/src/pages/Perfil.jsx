import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const UPLOADS_URL =
  `${API_URL}/uploads/perfis`;

export default function Perfil() {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);


  // =====================================================
  // USUÁRIO
  // =====================================================

  const usuarioSalvo =
    localStorage.getItem('etecamp_usuario');

  const usuarioInicial =
    usuarioSalvo
      ? JSON.parse(usuarioSalvo)
      : null;


  // =====================================================
  // ESTADOS
  // =====================================================

  const [values, setValues] = useState({

    nome:
      usuarioInicial?.nome || '',

    email:
      usuarioInicial?.email || '',

    senhaAtual: '',

    novaSenha: ''

  });


  const [foto, setFoto] = useState(
    usuarioInicial?.foto_perfil || null
  );


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


        const resposta =
          await fetch(
            `${API_URL}/usuarios/meu-perfil`,
            {

              headers: {

                Authorization:
                  `Bearer ${token}`

              }

            }
          );


        const dados =
          await resposta.json();


        if (!resposta.ok) {

          throw new Error(
            dados.mensagem ||
            'Erro ao carregar perfil.'
          );

        }


        const usuario =
          dados.usuario;


        setValues({

          nome:
            usuario.nome || '',

          email:
            usuario.email || '',

          senhaAtual: '',

          novaSenha: ''

        });


        setFoto(
          usuario.foto_perfil || null
        );


        localStorage.setItem(
          'etecamp_usuario',
          JSON.stringify(usuario)
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

  function toggleEdit(
    campo
  ) {

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


      const resposta =
        await fetch(
          `${API_URL}/usuarios/meu-perfil`,
          {

            method: 'PUT',

            headers: {

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`

            },

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

          }
        );


      const dados =
        await resposta.json();


      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          'Não foi possível atualizar o perfil.'
        );

      }


      // =================================================
      // ATUALIZAR LOCALSTORAGE
      // =================================================

      localStorage.setItem(
        'etecamp_usuario',
        JSON.stringify(
          dados.usuario
        )
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

  function handleSelecionarFoto(
    e
  ) {

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


      const formData =
        new FormData();


      formData.append(
        'foto',
        previewFoto.arquivo
      );


      const resposta =
        await fetch(
          `${API_URL}/usuarios/meu-perfil/foto`,
          {

            method: 'POST',

            headers: {

              Authorization:
                `Bearer ${token}`

            },

            body: formData

          }
        );


      const dados =
        await resposta.json();


      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          'Erro ao salvar foto.'
        );

      }


      setFoto(
        dados.foto_perfil
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
        );


      const usuarioAtualizado = {

        ...usuarioAtual,

        foto_perfil:
          dados.foto_perfil

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

        await fetch(

          `${API_URL}/sessoes/sair/${usuario.id}`,

          {

            method: 'PUT',

            headers: {

              Authorization:
                `Bearer ${token}`

            }

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
    (
      foto
        ? `${UPLOADS_URL}/${foto}`
        : null
    );


  const primeiraLetra =
    values.nome
      ?.charAt(0)
      ?.toUpperCase() || '?';


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div>

      <div className="page-header">

        <div>

          <h1>
            Perfil
          </h1>

          <p>
            Organize seu perfil
          </p>

        </div>

      </div>


      {mensagem && (

        <div
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#E3F2FD',
            color: '#0D47A1',
            fontWeight: 600
          }}
        >

          {mensagem}

        </div>

      )}


      {erro && (

        <div
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#FDECEC',
            color: '#C1462F',
            fontWeight: 600
          }}
        >

          {erro}

        </div>

      )}


      <div className="perfil-grid">


        {/* =============================================
            DADOS
        ============================================= */}

        <form
          className="panel-card"
          onSubmit={handleSave}
        >


          {/* NOME */}

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


          {/* EMAIL */}

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


          {/* SENHA */}

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


          <button

            type="submit"

            className="mural-btn primary"

            disabled={salvando}

          >

            {salvando
              ? 'Salvando...'
              : 'Salvar Alterações'}

          </button>


        </form>


        {/* =============================================
            LADO DIREITO
        ============================================= */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >


          {/* FOTO */}

          <div className="perfil-avatar-card">


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


            <strong>
              {values.nome}
            </strong>


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


          {/* CONQUISTAS */}

          <div className="panel-card">

            <h3>
              Conquistas
            </h3>


            <div className="achievement-list">


              <div className="achievement-item">

                <div className="achievement-icon">
                  🏆
                </div>

                <div className="achievement-text">

                  <strong>
                    Nota Máxima
                  </strong>

                  <span>
                    Acertou 100% em um simulado
                  </span>

                </div>

              </div>


              <div className="achievement-item">

                <div className="achievement-icon">
                  🎯
                </div>

                <div className="achievement-text">

                  <strong>
                    Meta Semanal
                  </strong>

                  <span>
                    Completou 20h de estudo em uma semana
                  </span>

                </div>

              </div>


            </div>

          </div>

        </div>

      </div>

    </div>

  );

}