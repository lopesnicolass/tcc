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
    <div className="admin-modal-backdrop admin-modal-backdrop-refined">
      <div className="admin-modal admin-modal-refined">

        <div className="admin-modal-head">
          <div>
            <h2>{titulo}</h2>
          </div>

          <button
            type="button"
            className="admin-modal-close" aria-label="Fechar janela"
            onClick={onClose}
            disabled={salvando}
          >
            <Icon
              name="close"
              size={18}
            />
          </button>
        </div>

        <div className="admin-modal-scroll-content">{children}</div>

        <div className="admin-modal-actions">
          <button
            type="button"
            className="mural-btn secondary admin-modal-button admin-modal-button-cancel"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="mural-btn admin-modal-button admin-modal-button-save"
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
