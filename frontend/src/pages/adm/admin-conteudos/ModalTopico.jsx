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

      <div className="admin-field-row">
        <label className="admin-field">
          <span>Prioridade para o Vestibulinho</span>
          <select
            value={Number(formTopico.prioridade || 2)}
            onChange={(event) =>
              setFormTopico((atual) => ({
                ...atual,
                prioridade: Number(event.target.value),
              }))
            }
          >
            <option value={1}>Essencial</option>
            <option value={2}>Importante</option>
            <option value={3}>Complementar</option>
          </select>
          <small>Essencial entra primeiro nos planos curtos.</small>
        </label>

        <label className="admin-field">
          <span>Recorrência observada nas provas</span>
          <select
            value={Number(formTopico.frequencia_provas || 0)}
            onChange={(event) =>
              setFormTopico((atual) => ({
                ...atual,
                frequencia_provas: Number(event.target.value),
              }))
            }
          >
            <option value={0}>Ainda não analisada</option>
            <option value={1}>Baixa / ocasional</option>
            <option value={2}>Recorrente</option>
            <option value={3}>Muito recorrente</option>
          </select>
          <small>Marque com base na análise de provas anteriores oficiais.</small>
        </label>
      </div>

      <div className="admin-field-row">
        <label className="admin-field">
          <span>Tempo estimado (minutos)</span>
          <input
            type="number"
            min="15"
            max="240"
            step="15"
            value={formTopico.tempo_estimado_minutos ?? 45}
            onChange={(event) =>
              setFormTopico((atual) => ({
                ...atual,
                tempo_estimado_minutos: event.target.value,
              }))
            }
          />
        </label>

        <label className="admin-field">
          <span>Fonte da análise de recorrência</span>
          <input
            value={formTopico.fonte_frequencia || ''}
            onChange={(event) =>
              setFormTopico((atual) => ({
                ...atual,
                fonte_frequencia: event.target.value,
              }))
            }
            placeholder="Ex.: ETEC 2023–2026, provas consultadas"
            maxLength={250}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Justificativa da prioridade</span>
        <textarea
          rows="2"
          value={formTopico.justificativa_prioridade || ''}
          onChange={(event) =>
            setFormTopico((atual) => ({
              ...atual,
              justificativa_prioridade: event.target.value,
            }))
          }
          maxLength={500}
          placeholder="Explique por que o conteúdo é essencial, importante ou complementar."
        />
      </label>

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