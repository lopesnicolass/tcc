import { Modal } from './Modal.jsx';

// Modal de criar/editar tópico.
// Extraído de AdminConteudos.jsx (era a seção "MODAL DE TÓPICO").

export function ModalTopico({
  modalTopico,
  setModalTopico,
  formTopico,
  setFormTopico,
  salvarTopico,
  salvando,
}) {
  if (!modalTopico) {
    return null;
  }

  return (
    <Modal
      titulo={
        modalTopico.modo ===
        'criar'
          ? 'Novo tópico'
          : 'Editar tópico'
      }
      onClose={() =>
        setModalTopico(null)
      }
      onSave={
        salvarTopico
      }
      salvando={
        salvando
      }
    >
      <label className="admin-field">
        <span>
          Nome do tópico
        </span>

        <input
          value={
            formTopico.nome
          }
          onChange={(
            event
          ) =>
            setFormTopico(
              (atual) => ({
                ...atual,
                nome:
                  event.target
                    .value,
              })
            )
          }
          placeholder="Ex.: Interpretação de texto"
        />
      </label>

      <div className="admin-field-row">
        <label className="admin-field">
          <span>
            Ordem
          </span>

          <input
            type="number"
            min="0"
            value={
              formTopico.ordem
            }
            onChange={(
              event
            ) =>
              setFormTopico(
                (atual) => ({
                  ...atual,
                  ordem:
                    event.target
                      .value,
                })
              )
            }
          />
        </label>

        <label className="admin-check">
          <input
            type="checkbox"
            checked={Boolean(
              formTopico.ativo
            )}
            onChange={(
              event
            ) =>
              setFormTopico(
                (atual) => ({
                  ...atual,
                  ativo:
                    event.target
                      .checked,
                })
              )
            }
          />

          Tópico ativo
        </label>
      </div>

      <label className="admin-field">
        <span>
          Descrição
        </span>

        <textarea
          rows="4"
          value={
            formTopico.descricao
          }
          onChange={(
            event
          ) =>
            setFormTopico(
              (atual) => ({
                ...atual,
                descricao:
                  event.target
                    .value,
              })
            )
          }
          placeholder="Descrição opcional do tópico."
        />
      </label>
    </Modal>
  );
}
