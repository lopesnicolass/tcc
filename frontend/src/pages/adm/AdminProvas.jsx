import '../../styles/adm/AdminProvas.css';
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL, request } from '../../services/api.js';

function ProvasIcon({ name, size = 20 }) {
    const paths = {
        file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
        check: <><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/></>,
        layers: <><rect x="4" y="4" width="13" height="15" rx="2"/><path d="M8 8h12v12a2 2 0 0 1-2 2H8"/></>,
        search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.8 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 12.2-2"/></>,
        upload: <><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></>,
        trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
        plus: <path d="M12 5v14M5 12h14"/>,
        close: <path d="M5 5l14 14M19 5 5 19"/>
    };
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

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
        const iniciar = setTimeout(() => { void carregarProvas(); }, 0);
        return () => clearTimeout(iniciar);
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
                        <ProvasIcon name="file" size={22} />
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

                        <div className={`admin-provas-file ${arquivoProva ? "has-file" : ""}`}>

                            <div className="file-info">

                                <div className="file-icon">
                                    <ProvasIcon name="file" size={22} />
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
                                <ProvasIcon name="upload" size={16} /> Escolher PDF
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
                                    {arquivoProva.name}
                                </span>
                            )}

                        </div>

                        <div className={`admin-provas-file ${arquivoGabarito ? "has-file" : ""}`}>

                            <div className="file-info">

                                <div className="file-icon">
                                    <ProvasIcon name="check" size={22} />
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
                                <ProvasIcon name="upload" size={16} /> Escolher PDF
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
                                    {arquivoGabarito.name}
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
                                : <><ProvasIcon name="plus" size={18} /> Cadastrar prova</>
                            }
                        </button>

                    </div>

                </form>

            </div>

            <div className="admin-provas-card">

                <div className="admin-provas-card-header admin-provas-list-header">

                    <div className="admin-provas-icon">
                        <ProvasIcon name="layers" size={22} />
                    </div>

                    <div>
                        <h2>Provas cadastradas</h2>

                        <p>
                            Gerencie as provas disponíveis para os alunos.
                        </p>
                    </div>

                </div>

                <div className="admin-provas-list-toolbar">
                    <label className="admin-provas-search">
                        <ProvasIcon name="search" size={19} />
                        <span className="sr-only">Buscar provas por título ou ano</span>
                        <input type="search" placeholder="Buscar por nome ou ano..." value={busca} onChange={(event) => setBusca(event.target.value)} />
                    </label>
                    <button className="admin-provas-refresh" type="button" onClick={carregarProvas} disabled={carregandoLista} title="Atualizar lista" aria-label="Atualizar lista">
                        <ProvasIcon name="refresh" size={19} />
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

                                <div className="prova-row-info">
                                    <div className="prova-row-icon"><ProvasIcon name="file" size={22} /></div>
                                    <div className="prova-row-text">
                                    <span className="prova-title">
                                        {prova.titulo}
                                    </span>

                                    <div className="prova-admin-ano">
                                        <ProvasIcon name="calendar" size={14} /> {prova.ano}
                                    </div>
                                    </div>
                                </div>

                                <div className="prova-links">

                                    <a
                                        href={`${API_URL}/uploads/provas/${prova.arquivo_prova}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ProvasIcon name="file" size={16} /> Prova
                                    </a>

                                    <a
                                        href={`${API_URL}/uploads/provas/${prova.arquivo_gabarito}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ProvasIcon name="check" size={16} /> Gabarito
                                    </a>

                                    <button
                                        type="button"
                                        className="admin-delete-prova"
                                        onClick={() => excluirProva(prova.id)}
                                        disabled={excluindoId !== null}
                                    >
                                        <ProvasIcon name="trash" size={16} /> {excluindoId === prova.id ? 'Excluindo...' : 'Excluir'}
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