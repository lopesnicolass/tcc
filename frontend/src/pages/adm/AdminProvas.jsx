import '../../styles/adm/AdminProvas.css';
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL, request } from '../../services/api.js';

export default function AdminProvas() {
    const [ano, setAno] = useState("");
    const [titulo, setTitulo] = useState("");
    const [arquivoProva, setArquivoProva] = useState(null);
    const [arquivoGabarito, setArquivoGabarito] = useState(null);
    const [provas, setProvas] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [busca, setBusca] = useState('');
    const [erroLista, setErroLista] = useState('');
    const [carregandoLista, setCarregandoLista] = useState(true);
    const [excluindoId, setExcluindoId] = useState(null);
    const provaInputRef = useRef(null);
    const gabaritoInputRef = useRef(null);

    const provasFiltradas = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase('pt-BR');
        return [...provas]
            .filter((prova) => !termo || `${prova.titulo || ''} ${prova.ano || ''}`.toLocaleLowerCase('pt-BR').includes(termo))
            .sort((a, b) => Number(b.ano || 0) - Number(a.ano || 0));
    }, [provas, busca]);

    async function carregarProvas() {
        setCarregandoLista(true);
        setErroLista('');
        try {
            const dados = await request('/provas');
            setProvas(Array.isArray(dados?.provas) ? dados.provas : []);
        } catch (erro) {
            console.error('Erro ao carregar provas:', erro);
            setErroLista(erro.message || 'Não foi possível consultar as provas.');
        } finally {
            setCarregandoLista(false);
        }
    }

    useEffect(() => {
        carregarProvas();
    }, []);

    async function cadastrarProva(event) {
        event.preventDefault();
        setMensagem("");

        if (!ano || !titulo.trim() || !arquivoProva || !arquivoGabarito) {
            setMensagem("error:Preencha todos os campos antes de cadastrar.");
            return;
        }

        if (!Number.isInteger(Number(ano)) || Number(ano) < 2000 || Number(ano) > 2100) {
            setMensagem('error:Informe um ano válido entre 2000 e 2100.');
            return;
        }

        if (![arquivoProva, arquivoGabarito].every((arquivo) =>
            arquivo && (/\.pdf$/i.test(arquivo.name) || arquivo.type === 'application/pdf')
        )) {
            setMensagem('error:Selecione dois arquivos PDF válidos.');
            return;
        }

        const formData = new FormData();

        formData.append("ano", ano);
        formData.append("titulo", titulo.trim());
        formData.append("arquivo_prova", arquivoProva);
        formData.append("arquivo_gabarito", arquivoGabarito);

        setCarregando(true);

        try {
            await request(
                "/provas",
                {
                    method: "POST",
                    body: formData
                },
                "Erro ao cadastrar prova."
            );

            setMensagem("success:Prova cadastrada com sucesso!");

            setAno("");
            setTitulo("");
            setArquivoProva(null);
            setArquivoGabarito(null);

            if (provaInputRef.current) provaInputRef.current.value = '';
            if (gabaritoInputRef.current) gabaritoInputRef.current.value = '';

            await carregarProvas();

        } catch (erro) {
            console.error(erro);

            setMensagem(
                erro.status
                    ? "error:" + erro.message
                    : "error:Não foi possível conectar ao servidor."
            );
        } finally {
            setCarregando(false);
        }
    }

    async function excluirProva(id) {
        if (excluindoId !== null) return;
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir esta prova?\n\nA prova e o gabarito serão apagados."
        );

        if (!confirmar) {
            return;
        }

        setExcluindoId(id);
        try {
            await request(
                `/provas/${id}`,
                {
                    method: "DELETE"
                },
                "Erro ao excluir prova."
            );

            setMensagem("success:Prova excluída com sucesso!");

            await carregarProvas();

        } catch (erro) {
            console.error(erro);

            setMensagem(
                erro.status
                    ? "error:" + erro.message
                    : "error:Não foi possível conectar ao servidor."
            );
        } finally {
            setExcluindoId(null);
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
                                required
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
                                required
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
                                ref={provaInputRef}
                                required
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
                                ref={gabaritoInputRef}
                                required
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
                            role={mensagem.startsWith('success:') ? 'status' : 'alert'}
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

                <div className="admin-provas-list-toolbar">
                    <div className="admin-provas-list-counter">
                        <strong>{carregandoLista || erroLista ? '—' : provas.length}</strong>
                        <span>{provas.length === 1 ? 'prova cadastrada' : 'provas cadastradas'}</span>
                    </div>
                    <label className="admin-provas-search">
                        <span className="sr-only">Buscar provas por título ou ano</span>
                        <input type="search" placeholder="Buscar por ano ou título" value={busca} onChange={(event) => setBusca(event.target.value)} />
                    </label>
                    <button className="admin-provas-refresh" type="button" onClick={carregarProvas} disabled={carregandoLista}>
                        {carregandoLista ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>

                {erroLista && <div className="admin-provas-message error" role="alert">{erroLista} <button type="button" onClick={carregarProvas}>Tentar novamente</button></div>}

                {carregandoLista ? (
                    <div className="mural-empty">Carregando provas...</div>
                ) : erroLista ? null : provas.length === 0 ? (

                    <div className="mural-empty">
                        Nenhuma prova cadastrada ainda.
                    </div>

                ) : provasFiltradas.length === 0 ? (
                    <div className="mural-empty">Nenhuma prova corresponde à busca. <button className="admin-provas-clean-search" type="button" onClick={() => setBusca('')}>Limpar busca</button></div>
                ) : (

                    <div className="provas-list">

                        {provasFiltradas.map((prova) => (

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
                                        href={`${API_URL}/uploads/provas/${prova.arquivo_prova}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Prova
                                    </a>

                                    <a
                                        href={`${API_URL}/uploads/provas/${prova.arquivo_gabarito}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Gabarito
                                    </a>

                                    <button
                                        type="button"
                                        className="admin-delete-prova"
                                        onClick={() => excluirProva(prova.id)}
                                        disabled={excluindoId !== null}
                                    >
                                        {excluindoId === prova.id ? 'Excluindo...' : 'Excluir'}
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