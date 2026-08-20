import { useState } from 'react';

const INITIAL_USERS = [
  { id: 1, nome: 'ruan', email: 'ruan@email.com' },
  { id: 2, nome: 'nicolas', email: 'nicolas@email.com' },
  { id: 3, nome: 'maria luiza', email: 'marialuiza@email.com' },
  { id: 4, nome: 'daniel', email: 'daniel@email.com' },
  { id: 5, nome: 'carol', email: 'carol@email.com' },
  { id: 6, nome: 'emily', email: 'emily@email.com' },
];

export default function AdminUsuarios() {
  const [users, setUsers] = useState(INITIAL_USERS);

  function handleDelete(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Usuários</h1>
      </div>

      <div className="user-list">
        {users.map((u) => (
          <div className="user-row" key={u.id}>
            <div className="user-info">
              <strong>{u.nome}</strong>
              <span>email: {u.email}</span>
              <span>senha: •••••••</span>
            </div>
            <button className="btn-delete-user" onClick={() => handleDelete(u.id)}>Excluir usuário</button>
          </div>
        ))}
        {users.length === 0 && <div className="mural-empty">Nenhum usuário cadastrado.</div>}
      </div>
    </div>
  );
}