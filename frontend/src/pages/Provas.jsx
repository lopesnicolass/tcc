import { useEffect, useState } from "react";

export default function Provas() {

    const [provas, setProvas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {

        fetch("http://localhost:3000/provas")
            .then((res) => res.json())
            .then((dados) => {

                setProvas(dados.provas || []);
                setCarregando(false);

            })
            .catch((erro) => {

                console.error("Erro ao carregar provas:", erro);
                setCarregando(false);

            });

    }, []);

    return (
        <div>

            <div className="page-header">

                <div>

                    <h1>Provas dos anos anteriores</h1>

                    <p>
                        Melhore seu desempenho e conhecimento realizando
                        as provas dos anos anteriores.
                    </p>

                </div>

            </div>


            {carregando && (

                <p style={{ color: "var(--muted)" }}>
                    Carregando provas...
                </p>

            )}


            {!carregando && provas.length === 0 && (

                <div className="mural-empty">
                    Nenhuma prova anterior foi cadastrada ainda.
                </div>

            )}


            {!carregando && provas.length > 0 && (

                <div className="provas-list">

                    {provas.map((prova) => (

                        <div
                            className="prova-row"
                            key={prova.id}
                        >

                            <span className="prova-title">

                                VESTIBULINHO ETEC {prova.ano}

                            </span>


                            <div className="prova-links">

                                <a
                                    href={
                                        "http://localhost:3000/uploads/provas/" +
                                        prova.arquivo_prova
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Prova
                                </a>


                                <a
                                    href={
                                        "http://localhost:3000/uploads/provas/" +
                                        prova.arquivo_gabarito
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Gabarito
                                </a>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}