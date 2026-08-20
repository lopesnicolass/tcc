const PROVAS = [2025, 2024, 2023, 2022, 2020, 2019];

export default function Provas() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Provas dos anos anteriores</h1>
          <p>Melhore seu desempenho e conhecimento realizando as provas dos anos anteriores.</p>
        </div>
      </div>

      <div className="provas-list">
        {PROVAS.map((ano) => (
          <div className="prova-row" key={ano}>
            <span className="prova-title">VESTIBULINHO ETEC {ano}</span>
            <div className="prova-links">
              <a href="#">Prova</a>
              <a href="#">Gabarito</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}