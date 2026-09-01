import { useEffect, useState } from "react";

export default function AdminProvas() {
    const [ano, setAno] = useState("");
    const [titulo, setTitulo] = useState("");
    const [arquivoProva, setArquivoProva] = useState(null);
    const [arquivoGabarito, setArquivoGabarito] = useState(null);
    const [provas, setProvas] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function carregarProvas() {
        try {
            const resposta = await fetch("http://localhost:3000/provas");
            const dados = await resposta.json();

            if (resposta.ok) {
                setProvas(dados.provas || []);
            }
        } catch (erro) {
            console.error("Erro ao carregar provas:", erro);
        }
    }

    useEffect(() => {
        carregarProvas();
    }, []);

    async function cadastrarProva(event) {
        event.preventDefault();
        setMensagem("");

        if (!ano || !titulo || !arquivoProva || !arquivoGabarito) {
            setMensagem("error:Preencha todos os campos antes de cadastrar.");
            return;
        }

        const formData = new FormData();

        formData.append("ano", ano);
        formData.append("titulo", titulo);
        formData.append("arquivo_prova", arquivoProva);
        formData.append("arquivo_gabarito", arquivoGabarito);

        setCarregando(true);

        try {
            const resposta = await fetch(
                "http://localhost:3000/provas",
                {
                    method: "POST",
                    body: formData
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem(
                    "error:" +
                    (dados.mensagem || "Erro ao cadastrar prova.")
                );
                return;
            }

            setMensagem("success:Prova cadastrada com sucesso!");

            setAno("");
            setTitulo("");
            setArquivoProva(null);
            setArquivoGabarito(null);

            document.getElementById("arquivoProva").value = "";
            document.getElementById("arquivoGabarito").value = "";

            carregarProvas();

        } catch (erro) {
            console.error(erro);

            setMensagem(
                "error:Não foi possível conectar ao servidor."
            );
        } finally {
            setCarregando(false);
        }
    }

    async function excluirProva(id) {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir esta prova?\n\nA prova e o gabarito serão apagados."
        );

        if (!confirmar) {
            return;
        }

        try {
            const resposta = await fetch(
                `http://localhost:3000/provas/${id}`,
                {
                    method: "DELETE"
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem(
                    "error:" +
                    (dados.mensagem || "Erro ao excluir prova.")
                );
                return;
            }

            setMensagem("success:Prova excluída com sucesso!");

            carregarProvas();

        } catch (erro) {
            console.error(erro);

            setMensagem(
                "error:Não foi possível conectar ao servidor."
            );
        }
    }

    return (
        <div className="admin-provas-page">

            <div className="admin-provas-header">
                <div>
                    <span className="admin-provas-tag">
                        ADMINISTRADOR
                    </span>

                    <h1>Provas Anteriores</h1>

                    <p>
                        Adicione provas anteriores do Vestibulinho
                        para os alunos acessarem.
                    </p>
                </div>
            </div>

            <div className="admin-provas-card">

                <div className="admin-provas-card-header">

                    <div className="admin-provas-icon">
                        📄
                    </div>

                    <div>
                        <h2>Cadastrar nova prova</h2>

                        <p>
                            Preencha as informações e envie os arquivos
                            em PDF.
                        </p>
                    </div>

                </div>

                <form
                    className="admin-provas-form"
                    onSubmit={cadastrarProva}
                >

                    <div className="admin-provas-row">

                        <div className="admin-provas-field">

                            <label htmlFor="ano">
                                Ano
                            </label>

                            <input
                                id="ano"
                                type="number"
                                min="2000"
                                max="2100"
                                value={ano}
                                onChange={(e) =>
                                    setAno(e.target.value)
                                }
                                placeholder="Ex: 2025"
                            />

                        </div>

                        <div className="admin-provas-field">

                            <label htmlFor="titulo">
                                Nome da prova
                            </label>

                            <input
                                id="titulo"
                                type="text"
                                value={titulo}
                                onChange={(e) =>
                                    setTitulo(e.target.value)
                                }
                                placeholder="Ex: Vestibulinho ETEC 2025"
                            />

                        </div>

                    </div>

                    <div className="admin-provas-files">

                        <div className="admin-provas-file">

                            <div className="file-info">

                                <div className="file-icon">
                                    📄
                                </div>

                                <div>
                                    <strong>
                                        Prova
                                    </strong>

                                    <span>
                                        Envie o PDF da prova
                                    </span>
                                </div>

                            </div>

                            <label
                                htmlFor="arquivoProva"
                                className="file-button"
                            >
                                Escolher PDF
                            </label>

                            <input
                                id="arquivoProva"
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={(e) =>
                                    setArquivoProva(
                                        e.target.files[0]
                                    )
                                }
                            />

                            {arquivoProva && (
                                <span className="file-selected">
                                    ✓ {arquivoProva.name}
                                </span>
                            )}

                        </div>

                        <div className="admin-provas-file">

                            <div className="file-info">

                                <div className="file-icon">
                                    ✅
                                </div>

                                <div>
                                    <strong>
                                        Gabarito
                                    </strong>

                                    <span>
                                        Envie o PDF do gabarito
                                    </span>
                                </div>

                            </div>

                            <label
                                htmlFor="arquivoGabarito"
                                className="file-button"
                            >
                                Escolher PDF
                            </label>

                            <input
                                id="arquivoGabarito"
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={(e) =>
                                    setArquivoGabarito(
                                        e.target.files[0]
                                    )
                                }
                            />

                            {arquivoGabarito && (
                                <span className="file-selected">
                                    ✓ {arquivoGabarito.name}
                                </span>
                            )}

                        </div>

                    </div>

                    {mensagem && (
                        <div
                            className={
                                mensagem.startsWith("success:")
                                    ? "admin-provas-message success"
                                    : "admin-provas-message error"
                            }
                        >
                            {mensagem.replace(
                                /^(success:|error:)/,
                                ""
                            )}
                        </div>
                    )}

                    <div className="admin-provas-footer">

                        <button
                            type="submit"
                            className="admin-provas-submit"
                            disabled={carregando}
                        >
                            {carregando
                                ? "Cadastrando..."
                                : "Cadastrar prova"
                            }
                        </button>

                    </div>

                </form>

            </div>

            <div className="admin-provas-card">

                <div className="admin-provas-card-header">

                    <div className="admin-provas-icon">
                        📚
                    </div>

                    <div>
                        <h2>Provas cadastradas</h2>

                        <p>
                            Gerencie as provas disponíveis para os alunos.
                        </p>
                    </div>

                </div>

                {provas.length === 0 ? (

                    <div className="mural-empty">
                        Nenhuma prova cadastrada ainda.
                    </div>

                ) : (

                    <div className="provas-list">

                        {provas.map((prova) => (

                            <div
                                className="prova-row"
                                key={prova.id}
                            >

                                <div>
                                    <span className="prova-title">
                                        {prova.titulo}
                                    </span>

                                    <div className="prova-admin-ano">
                                        Ano: {prova.ano}
                                    </div>
                                </div>

                                <div className="prova-links">

                                    <a
                                        href={`http://localhost:3000/uploads/provas/${prova.arquivo_prova}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Prova
                                    </a>

                                    <a
                                        href={`http://localhost:3000/uploads/provas/${prova.arquivo_gabarito}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Gabarito
                                    </a>

                                    <button
                                        type="button"
                                        className="admin-delete-prova"
                                        onClick={() =>
                                            excluirProva(prova.id)
                                        }
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}