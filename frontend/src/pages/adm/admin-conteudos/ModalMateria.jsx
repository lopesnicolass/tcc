import { Modal } from './Modal.jsx';

export function ModalMateria({ modalMateria, setModalMateria, formMateria, setFormMateria, salvarMateria, salvando }) {
  if (!modalMateria) return null;
  return (
    <Modal titulo={`Descrição de ${formMateria.nome}`} onClose={() => setModalMateria(null)} onSave={salvarMateria} salvando={salvando}>
      <p className="admin-fixed-subject-hint">
        Matéria, cor e ícone são definidos pelo Tenna. Você pode editar a descrição e criar tópicos à vontade.
      </p>
      <label className="admin-field">
        <span>Descrição da matéria</span>
        <textarea rows={4} maxLength={500} value={formMateria.descricao}
          onChange={(event) => setFormMateria((anterior) => ({ ...anterior, descricao: event.target.value }))}
          placeholder="Explique o que os estudantes encontrarão nesta matéria..." />
      </label>
    </Modal>
  );
}
