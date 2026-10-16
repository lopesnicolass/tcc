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
          ? 'Novo conteúdo'
          : 'Editar conteúdo'
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
          Nome do conteúdo
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

    </Modal>
  );
}