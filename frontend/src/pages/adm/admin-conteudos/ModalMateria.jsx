import { Modal } from './Modal.jsx';
import { ICONES } from './helpers.js';

// Modal de criar/editar matéria.
// Extraído de AdminConteudos.jsx (era a seção "MODAL DE MATÉRIA").

export function ModalMateria({
  modalMateria,
  setModalMateria,
  formMateria,
  setFormMateria,
  salvarMateria,
  salvando,
}) {
  if (!modalMateria) {
    return null;
  }

  return (
    <Modal
      titulo={
        modalMateria.modo ===
        'criar'
          ? 'Nova matéria'
          : 'Editar matéria'
      }
      onClose={() =>
        setModalMateria(null)
      }
      onSave={
        salvarMateria
      }
      salvando={
        salvando
      }
    >
      <label className="admin-field">
        <span>
          Nome da matéria
        </span>

        <input
          value={
            formMateria.nome
          }
          onChange={(
            event
          ) =>
            setFormMateria(
              (atual) => ({
                ...atual,
                nome:
                  event.target
                    .value,
              })
            )
          }
          placeholder="Ex.: Língua Portuguesa"
        />
      </label>

      <label className="admin-field">
        <span>
          Slug
        </span>

        <input
          value={
            formMateria.slug
          }
          onChange={(
            event
          ) =>
            setFormMateria(
              (atual) => ({
                ...atual,
                slug:
                  event.target
                    .value,
              })
            )
          }
          placeholder="lingua-portuguesa"
        />

        <small>
          Pode deixar vazio para o
          sistema gerar automaticamente.
        </small>
      </label>

      <div className="admin-field-row">
        <label className="admin-field">
          <span>
            Ícone
          </span>

          <select
            value={
              formMateria.icone
            }
            onChange={(
              event
            ) =>
              setFormMateria(
                (atual) => ({
                  ...atual,
                  icone:
                    event.target
                      .value,
                })
              )
            }
          >
            {ICONES.map(
              (icone) => (
                <option
                  key={icone}
                  value={icone}
                >
                  {icone}
                </option>
              )
            )}
          </select>
        </label>

        <label className="admin-field">
          <span>
            Cor
          </span>

          <input
            type="text"
            value={
              formMateria.cor
            }
            onChange={(
              event
            ) =>
              setFormMateria(
                (atual) => ({
                  ...atual,
                  cor:
                    event.target
                      .value,
                })
              )
            }
            placeholder="#2196F3"
          />
        </label>
      </div>

      <div className="admin-field-row">
        <label className="admin-field">
          <span>
            Ordem
          </span>

          <input
            type="number"
            min="0"
            value={
              formMateria.ordem
            }
            onChange={(
              event
            ) =>
              setFormMateria(
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
              formMateria.ativa
            )}
            onChange={(
              event
            ) =>
              setFormMateria(
                (atual) => ({
                  ...atual,
                  ativa:
                    event.target
                      .checked,
                })
              )
            }
          />

          Matéria ativa
        </label>
      </div>

      <label className="admin-field">
        <span>
          Descrição
        </span>

        <textarea
          rows="4"
          value={
            formMateria.descricao
          }
          onChange={(
            event
          ) =>
            setFormMateria(
              (atual) => ({
                ...atual,
                descricao:
                  event.target
                    .value,
              })
            )
          }
          placeholder="Explique brevemente o conteúdo desta matéria."
        />
      </label>
    </Modal>
  );
}
