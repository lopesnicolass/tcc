import { Icon } from './icons.jsx';

// Modal genérico usado tanto para editar matéria quanto tópico.
// Extraído de AdminConteudos.jsx (estava tudo junto no mesmo arquivo).

export function Modal({
  titulo,
  children,
  onClose,
  onSave,
  salvando,
}) {
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">

        <div className="admin-modal-head">
          <div>
            <span className="admin-section-kicker">
              ADMINISTRAÇÃO
            </span>

            <h2>{titulo}</h2>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            disabled={salvando}
          >
            <Icon
              name="close"
              size={18}
            />
          </button>
        </div>

        {children}

        <div className="admin-modal-actions">
          <button
            type="button"
            className="mural-btn secondary"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="mural-btn"
            onClick={onSave}
            disabled={salvando}
          >
            {salvando
              ? 'Salvando...'
              : 'Salvar'}
          </button>
        </div>

      </div>
    </div>
  );
}
