// Campo de formulário (texto ou textarea) reutilizado por todos os
// tipos de bloco do editor. Extraído de EditorConteudo.jsx.
// Mantido como função (não como <Campo/>) só pra não precisar mexer
// em todas as dezenas de chamadas existentes, que já usavam
// campo(label, valor, onChange, opcoes).

export function campo(
  label,
  valor,
  onChange,
  opcoes = {}
) {
  const {
    placeholder = '',
    multiline = false,
    rows = 5,
    help = '',
  } = opcoes;

  return (
    <label className="editor-field">
      <span className="editor-field-label">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={valor || ''}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          rows={rows}
        />
      ) : (
        <input
          type="text"
          value={valor || ''}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
        />
      )}

      {help && (
        <small className="editor-field-help">
          {help}
        </small>
      )}
    </label>
  );
}
