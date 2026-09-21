// Barra de busca + filtro (todas/ativas/inativas).
// Extraído de AdminConteudos.jsx (era a seção "FILTROS").

export function Filtros({
  busca,
  setBusca,
  filtro,
  setFiltro,
}) {
  return (
    <section
      className="panel-card"
      style={{
        marginTop:
          '18px',
      }}
    >
      <div
        className="admin-content-toolbar"
        style={{
          display:
            'flex',
          alignItems:
            'center',
          justifyContent:
            'space-between',
          gap:
            '12px',
          flexWrap:
            'wrap',
        }}
      >
        <div
          style={{
            flex:
              '1 1 280px',
          }}
        >
          <input
            type="text"
            value={busca}
            onChange={(
              event
            ) =>
              setBusca(
                event.target.value
              )
            }
            placeholder="Buscar matéria ou tópico..."
            style={{
              width:
                '100%',
              boxSizing:
                'border-box',
              border:
                '1px solid var(--line)',
              borderRadius:
                '11px',
              padding:
                '11px 13px',
              font:
                'inherit',
              outline:
                'none',
            }}
          />
        </div>

        <select
          value={filtro}
          onChange={(
            event
          ) =>
            setFiltro(
              event.target
                .value
            )
          }
          style={{
            minWidth:
              '150px',
            border:
              '1px solid var(--line)',
            borderRadius:
              '11px',
            padding:
              '11px 13px',
            background:
              '#fff',
            color:
              'var(--ink)',
            font:
              'inherit',
          }}
        >
          <option value="todas">
            Todas
          </option>

          <option value="ativas">
            Ativas
          </option>

          <option value="inativas">
            Inativas
          </option>
        </select>
      </div>
    </section>
  );
}
