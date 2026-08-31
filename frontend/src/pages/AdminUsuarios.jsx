import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AdminUsuarios() {

  const [users, setUsers] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(null);

  // ============================
  // CARREGAR USUÁRIOS
  // ============================

  async function carregarUsuarios() {

    try {

      const token = localStorage.getItem('etecamp_token');

      if (!token) {
        setErro('Token não encontrado.');
        setCarregando(false);
        return;
      }

      const resposta = await fetch(
        `${API_URL}/usuarios`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.mensagem || 'Erro ao carregar usuários.'
        );

        setCarregando(false);
        return;
      }

      setUsers(dados.usuarios || []);

    } catch (erro) {

      console.error(erro);

      setErro(
        'Não foi possível conectar ao servidor.'
      );

    } finally {

      setCarregando(false);

    }
  }


  // ============================
  // CARREGAR AO ABRIR A PÁGINA
  // ============================

  useEffect(() => {

    carregarUsuarios();

  }, []);


  // ============================
  // EXCLUIR USUÁRIO
  // ============================

  async function handleDelete(id) {

    const usuario = users.find((u) => u.id === id);

    if (!usuario) {
      return;
    }

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o usuário "${usuario.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {

      setExcluindo(id);

      const token = localStorage.getItem('etecamp_token');

      if (!token) {
        setErro('Token não encontrado.');
        return;
      }

      const resposta = await fetch(
        `${API_URL}/usuarios/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {

        setErro(
          dados.mensagem || 'Erro ao excluir usuário.'
        );

        return;
      }

      // Remove o usuário da tela imediatamente
      setUsers((prev) =>
        prev.filter((u) => u.id !== id)
      );

    } catch (erro) {

      console.error(erro);

      setErro(
        'Não foi possível conectar ao servidor.'
      );

    } finally {

      setExcluindo(null);

    }
  }


  return (
    <div>

      <div className="page-header">

        <div>
          <h1>Usuários</h1>
          <p>Gerencie os usuários cadastrados na plataforma.</p>
        </div>

      </div>


      {carregando && (
        <div className="mural-empty">
          Carregando usuários...
        </div>
      )}


      {erro && (
        <div className="mural-empty">
          {erro}
        </div>
      )}


      {!carregando && !erro && (
        <div className="user-list">

          {users.map((u) => (

            <div
              className="user-row"
              key={u.id}
            >

              <div className="user-info">

                <strong>
                  {u.nome}
                </strong>

                <span>
                  email: {u.email}
                </span>

                <span>
                  tipo: {u.tipo}
                </span>

              </div>


              <button
                type="button"
                className="btn-delete-user"
                onClick={() => handleDelete(u.id)}
                disabled={excluindo === u.id}
              >

                {excluindo === u.id
                  ? 'Excluindo...'
                  : 'Excluir usuário'}

              </button>

            </div>

          ))}


          {users.length === 0 && (
            <div className="mural-empty">
              Nenhum usuário cadastrado.
            </div>
          )}

        </div>
      )}

    </div>
  );
}