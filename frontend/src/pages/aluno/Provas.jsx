import '../../styles/aluno/Provas.css';
import { useEffect, useState } from "react";

import { API_URL, request } from '../../services/api.js';

export default function Provas() {

    const [provas, setProvas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {

        request('/provas')
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
        <div className="provas-page">

            <div className="provas-header">
                <div className="provas-header-content">
                    <span className="provas-eyebrow">Vestibulinho ETEC</span>
                    <h1>Provas dos anos anteriores</h1>
                    <p>
                        Melhore seu desempenho e conhecimento realizando as provas dos anos anteriores.
                    </p>
                </div>
            </div>


            {carregando && (

                <p style={{ color: "var(--muted)" }}>
                    Carregando provas...
                </p>

            )}


            {!carregando && provas.length === 0 && (

                <div className="provas-empty">
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
                                        `${API_URL}/uploads/provas/${prova.arquivo_prova}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Prova
                                </a>


                                <a
                                    href={
                                        `${API_URL}/uploads/provas/${prova.arquivo_gabarito}`
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