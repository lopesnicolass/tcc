import { useEffect, useMemo, useState } from 'react';
import '../../styles/adm/AdminCronogramas.css';

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obterToken() {
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        ''
    );
}

function obterUsuariosDaResposta(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    if (Array.isArray(dados?.usuarios)) {
        return dados.usuarios;
    }

    if (Array.isArray(dados?.data)) {
        return dados.data;
    }

    return [];
}

function formatarData(data) {
    if (!data) {
        return '';
    }

    const partes = String(data).split('-');

    if (partes.length !== 3) {
        return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function dataHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

const FORM_INICIAL = {
    nome: '',
    materia: '',
    data: dataHoje(),
    horario: '08:00',
    done: false
};

export default function AdminCronogramas() {
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
    const [atividades, setAtividades] = useState([]);

    const [materias, setMaterias] = useState([]);

    const [formulario, setFormulario] = useState(FORM_INICIAL);
    const [atividadeEditando, setAtividadeEditando] = useState(null);

    const [carregandoUsuarios, setCarregandoUsuarios] =
        useState(true);

    const [carregandoAtividades, setCarregandoAtividades] =
        useState(false);

    const [salvando, setSalvando] = useState(false);

    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');

    const [modalExclusao, setModalExclusao] = useState(null);

    const token = obterToken();

    const usuarioAtual = useMemo(() => {
        return usuarios.find(
            (usuario) =>
                String(usuario.id) ===
                String(usuarioSelecionado)
        );
    }, [usuarios, usuarioSelecionado]);

    const atividadesOrdenadas = useMemo(() => {
        return [...atividades].sort((a, b) => {
            const dataA = `${a.data || ''} ${a.horario || ''}`;
            const dataB = `${b.data || ''} ${b.horario || ''}`;

            return dataA.localeCompare(dataB);
        });
    }, [atividades]);

    const quantidadeConcluidas = atividades.filter(
        (atividade) => atividade.done
    ).length;

    useEffect(() => {
        carregarUsuarios();
        carregarMaterias();
    }, []);

    useEffect(() => {
        if (!usuarioSelecionado) {
            setAtividades([]);
            return;
        }

        carregarAtividades(usuarioSelecionado);
    }, [usuarioSelecionado]);

    function limparMensagens() {
        setMensagem('');
        setErro('');
    }

    async function carregarUsuarios() {
        setCarregandoUsuarios(true);
        setErro('');

        try {
            const resposta = await fetch(
                `${API_URL}/usuarios`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        'Não foi possível carregar os usuários.'
                );
            }

            const lista = obterUsuariosDaResposta(dados);

            const somenteAlunos = lista.filter(
                (usuario) =>
                    usuario.tipo !== 'admin' &&
                    usuario.tipo !== 'administrador'
            );

            setUsuarios(somenteAlunos);
        } catch (error) {
            console.error(error);

            setErro(
                error.message ||
                    'Erro ao carregar os estudantes.'
            );
        } finally {
            setCarregandoUsuarios(false);
        }
    }

    async function carregarMaterias() {
        try {
            const resposta = await fetch(
                `${API_URL}/conteudos/publico`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!resposta.ok) {
                return;
            }

            const dados = await resposta.json();

            let lista = [];

            if (Array.isArray(dados)) {
                lista = dados;
            } else if (Array.isArray(dados?.materias)) {
                lista = dados.materias;
            } else if (Array.isArray(dados?.data)) {
                lista = dados.data;
            }

            setMaterias(lista);
        } catch (error) {
            console.error(
                'Erro ao carregar matérias:',
                error
            );
        }
    }

    async function carregarAtividades(usuarioId) {
        setCarregandoAtividades(true);
        setErro('');

        try {
            const resposta = await fetch(
                `${API_URL}/cronograma/${usuarioId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        'Não foi possível carregar o cronograma.'
                );
            }

            setAtividades(
                Array.isArray(dados?.atividades)
                    ? dados.atividades
                    : []
            );
        } catch (error) {
            console.error(error);

            setAtividades([]);

            setErro(
                error.message ||
                    'Erro ao carregar o cronograma.'
            );
        } finally {
            setCarregandoAtividades(false);
        }
    }

    function alterarFormulario(campo, valor) {
        setFormulario((atual) => ({
            ...atual,
            [campo]: valor
        }));
    }

    function iniciarEdicao(atividade) {
        limparMensagens();

        setAtividadeEditando(atividade.id);

        setFormulario({
            nome: atividade.nome || '',
            materia: atividade.materia || '',
            data: atividade.data || dataHoje(),
            horario: atividade.horario || '08:00',
            done: Boolean(atividade.done)
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function cancelarEdicao() {
        setAtividadeEditando(null);
        setFormulario(FORM_INICIAL);
        limparMensagens();
    }

    async function salvarAtividade(event) {
        event.preventDefault();

        limparMensagens();

        if (!usuarioSelecionado) {
            setErro('Selecione um estudante primeiro.');
            return;
        }

        if (
            !formulario.nome.trim() ||
            !formulario.materia ||
            !formulario.data ||
            !formulario.horario
        ) {
            setErro(
                'Preencha nome, matéria, data e horário.'
            );
            return;
        }

        setSalvando(true);

        try {
            const editando = Boolean(
                atividadeEditando
            );

            const url = editando
                ? `${API_URL}/cronograma/${usuarioSelecionado}/${atividadeEditando}`
                : `${API_URL}/cronograma/${usuarioSelecionado}`;

            const resposta = await fetch(url, {
                method: editando ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: formulario.nome.trim(),
                    materia: formulario.materia,
                    data: formulario.data,
                    horario: formulario.horario,
                    done: Boolean(formulario.done)
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        'Não foi possível salvar a atividade.'
                );
            }

            await carregarAtividades(
                usuarioSelecionado
            );

            setFormulario(FORM_INICIAL);
            setAtividadeEditando(null);

            setMensagem(
                editando
                    ? 'Atividade atualizada com sucesso!'
                    : 'Atividade adicionada ao cronograma!'
            );
        } catch (error) {
            console.error(error);

            setErro(
                error.message ||
                    'Erro ao salvar a atividade.'
            );
        } finally {
            setSalvando(false);
        }
    }

    function pedirExclusao(atividade) {
        setModalExclusao(atividade);
    }

    function fecharModalExclusao() {
        setModalExclusao(null);
    }

    async function excluirAtividade() {
        if (!modalExclusao || !usuarioSelecionado) {
            return;
        }

        const atividadeId = modalExclusao.id;

        fecharModalExclusao();
        limparMensagens();

        try {
            const resposta = await fetch(
                `${API_URL}/cronograma/${usuarioSelecionado}/${atividadeId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        'Não foi possível excluir a atividade.'
                );
            }

            setAtividades((atual) =>
                atual.filter(
                    (atividade) =>
                        atividade.id !== atividadeId
                )
            );

            if (
                atividadeEditando ===
                atividadeId
            ) {
                cancelarEdicao();
            }

            setMensagem(
                'Atividade excluída com sucesso!'
            );
        } catch (error) {
            console.error(error);

            setErro(
                error.message ||
                    'Erro ao excluir a atividade.'
            );
        }
    }

    async function alternarConclusao(atividade) {
        limparMensagens();

        try {
            const resposta = await fetch(
                `${API_URL}/cronograma/${usuarioSelecionado}/${atividade.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        done: !atividade.done
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        'Não foi possível atualizar a atividade.'
                );
            }

            setAtividades((atual) =>
                atual.map((item) =>
                    item.id === atividade.id
                        ? {
                              ...item,
                              done: !item.done
                          }
                        : item
                )
            );
        } catch (error) {
            console.error(error);

            setErro(
                error.message ||
                    'Erro ao atualizar a atividade.'
            );
        }
    }

    async function apagarPlanoAutomatico() {
        if (!usuarioSelecionado) {
            return;
        }

        limparMensagens();

        try {
            const resposta = await fetch(
                `${API_URL}/cronograma/${usuarioSelecionado}/origem/plano-automatico`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        'Não foi possível apagar o plano automático.'
                );
            }

            await carregarAtividades(
                usuarioSelecionado
            );

            setMensagem(
                `${dados.removidas || 0} atividade(s) do plano automático foram removidas.`
            );
        } catch (error) {
            console.error(error);

            setErro(
                error.message ||
                    'Erro ao apagar o plano automático.'
            );
        }
    }

    return (
        <div className="admin-cronogramas">
            <div className="admin-cronogramas-header">
                <div>
                    <h1>Cronogramas</h1>

                    <p>
                        Gerencie as atividades de estudo
                        dos estudantes.
                    </p>
                </div>

                {usuarioAtual && (
                    <div className="cronograma-aluno-resumo">
                        <span>Estudante selecionado</span>

                        <strong>
                            {usuarioAtual.nome ||
                                usuarioAtual.email ||
                                `Usuário ${usuarioAtual.id}`}
                        </strong>
                    </div>
                )}
            </div>

            {mensagem && (
                <div className="cronograma-alerta sucesso">
                    {mensagem}
                </div>
            )}

            {erro && (
                <div className="cronograma-alerta erro">
                    {erro}
                </div>
            )}

            <div className="cronograma-admin-grid">
                <section className="cronograma-admin-card">
                    <div className="cronograma-card-header">
                        <div>
                            <h2>
                                Selecionar estudante
                            </h2>

                            <p>
                                Escolha o estudante cujo
                                cronograma deseja gerenciar.
                            </p>
                        </div>
                    </div>

                    {carregandoUsuarios ? (
                        <div className="cronograma-loading">
                            Carregando estudantes...
                        </div>
                    ) : usuarios.length === 0 ? (
                        <div className="cronograma-empty">
                            Nenhum estudante encontrado.
                        </div>
                    ) : (
                        <select
                            className="cronograma-select"
                            value={
                                usuarioSelecionado
                            }
                            onChange={(event) => {
                                setUsuarioSelecionado(
                                    event.target.value
                                );
                                setAtividadeEditando(
                                    null
                                );
                                setFormulario(
                                    FORM_INICIAL
                                );
                                limparMensagens();
                            }}
                        >
                            <option value="">
                                Selecione um estudante
                            </option>

                            {usuarios.map(
                                (usuario) => (
                                    <option
                                        key={
                                            usuario.id
                                        }
                                        value={
                                            usuario.id
                                        }
                                    >
                                        {usuario.nome ||
                                            usuario.email ||
                                            `Usuário ${usuario.id}`}
                                    </option>
                                )
                            )}
                        </select>
                    )}
                </section>

                <section className="cronograma-admin-card">
                    <div className="cronograma-card-header">
                        <div>
                            <h2>
                                {atividadeEditando
                                    ? 'Editar atividade'
                                    : 'Nova atividade'}
                            </h2>

                            <p>
                                {atividadeEditando
                                    ? 'Altere os dados da atividade selecionada.'
                                    : 'Adicione uma atividade diretamente ao cronograma.'}
                            </p>
                        </div>
                    </div>

                    {!usuarioSelecionado ? (
                        <div className="cronograma-empty">
                            Selecione um estudante para
                            adicionar atividades.
                        </div>
                    ) : (
                        <form
                            className="cronograma-form"
                            onSubmit={
                                salvarAtividade
                            }
                        >
                            <div className="cronograma-form-group">
                                <label htmlFor="atividade-nome">
                                    Nome da atividade
                                </label>

                                <input
                                    id="atividade-nome"
                                    type="text"
                                    value={
                                        formulario.nome
                                    }
                                    onChange={(event) =>
                                        alterarFormulario(
                                            'nome',
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Ex.: Revisar funções do 1º grau"
                                />
                            </div>

                            <div className="cronograma-form-row">
                                <div className="cronograma-form-group">
                                    <label htmlFor="atividade-materia">
                                        Matéria
                                    </label>

                                    {materias.length >
                                    0 ? (
                                        <select
                                            id="atividade-materia"
                                            value={
                                                formulario.materia
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                alterarFormulario(
                                                    'materia',
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Selecione
                                            </option>

                                            {materias.map(
                                                (
                                                    materia
                                                ) => (
                                                    <option
                                                        key={
                                                            materia.id ||
                                                            materia.slug ||
                                                            materia.nome
                                                        }
                                                        value={
                                                            materia.nome
                                                        }
                                                    >
                                                        {
                                                            materia.nome
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    ) : (
                                        <input
                                            id="atividade-materia"
                                            type="text"
                                            value={
                                                formulario.materia
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                alterarFormulario(
                                                    'materia',
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Ex.: Matemática"
                                        />
                                    )}
                                </div>

                                <div className="cronograma-form-group">
                                    <label htmlFor="atividade-horario">
                                        Horário
                                    </label>

                                    <input
                                        id="atividade-horario"
                                        type="time"
                                        value={
                                            formulario.horario
                                        }
                                        onChange={(event) =>
                                            alterarFormulario(
                                                'horario',
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="cronograma-form-group">
                                <label htmlFor="atividade-data">
                                    Data
                                </label>

                                <input
                                    id="atividade-data"
                                    type="date"
                                    value={
                                        formulario.data
                                    }
                                    onChange={(event) =>
                                        alterarFormulario(
                                            'data',
                                            event.target
                                                .value
                                        )
                                    }
                                />
                            </div>

                            <label className="cronograma-checkbox">
                                <input
                                    type="checkbox"
                                    checked={
                                        formulario.done
                                    }
                                    onChange={(event) =>
                                        alterarFormulario(
                                            'done',
                                            event.target
                                                .checked
                                        )
                                    }
                                />

                                <span>
                                    Marcar como concluída
                                </span>
                            </label>

                            <div className="cronograma-form-actions">
                                {atividadeEditando && (
                                    <button
                                        type="button"
                                        className="cronograma-btn secundario"
                                        onClick={
                                            cancelarEdicao
                                        }
                                    >
                                        Cancelar edição
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className="cronograma-btn principal"
                                    disabled={salvando}
                                >
                                    {salvando
                                        ? 'Salvando...'
                                        : atividadeEditando
                                        ? 'Salvar alterações'
                                        : 'Adicionar atividade'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>

            <section className="cronograma-admin-card cronograma-lista-card">
                <div className="cronograma-lista-header">
                    <div>
                        <h2>
                            {usuarioAtual
                                ? `Cronograma de ${
                                      usuarioAtual.nome ||
                                      usuarioAtual.email ||
                                      `Usuário ${usuarioAtual.id}`
                                  }`
                                : 'Atividades'}
                        </h2>

                        <p>
                            {usuarioSelecionado
                                ? `${atividades.length} atividade(s) cadastrada(s)`
                                : 'Selecione um estudante para visualizar as atividades.'}
                        </p>
                    </div>

                    {usuarioSelecionado &&
                        atividades.some(
                            (atividade) =>
                                atividade.origem ===
                                'plano-automatico'
                        ) && (
                            <button
                                type="button"
                                className="cronograma-btn apagar-plano"
                                onClick={
                                    apagarPlanoAutomatico
                                }
                            >
                                Apagar plano automático
                            </button>
                        )}
                </div>

                {usuarioSelecionado &&
                    !carregandoAtividades &&
                    atividades.length > 0 && (
                        <div className="cronograma-estatisticas">
                            <div className="cronograma-stat">
                                <span>Total</span>
                                <strong>
                                    {atividades.length}
                                </strong>
                            </div>

                            <div className="cronograma-stat">
                                <span>Concluídas</span>
                                <strong>
                                    {
                                        quantidadeConcluidas
                                    }
                                </strong>
                            </div>

                            <div className="cronograma-stat">
                                <span>Pendentes</span>
                                <strong>
                                    {
                                        atividades.length -
                                        quantidadeConcluidas
                                    }
                                </strong>
                            </div>
                        </div>
                    )}

                {!usuarioSelecionado ? (
                    <div className="cronograma-empty grande">
                        <div className="cronograma-empty-icon">
                            ☰
                        </div>

                        <h3>
                            Nenhum estudante selecionado
                        </h3>

                        <p>
                            Escolha um estudante acima para
                            visualizar e gerenciar seu
                            cronograma.
                        </p>
                    </div>
                ) : carregandoAtividades ? (
                    <div className="cronograma-loading grande">
                        Carregando cronograma...
                    </div>
                ) : atividadesOrdenadas.length === 0 ? (
                    <div className="cronograma-empty grande">
                        <div className="cronograma-empty-icon">
                            ✓
                        </div>

                        <h3>
                            Cronograma vazio
                        </h3>

                        <p>
                            Esse estudante ainda não possui
                            atividades cadastradas.
                        </p>
                    </div>
                ) : (
                    <div className="cronograma-tabela-wrapper">
                        <table className="cronograma-tabela">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Atividade</th>
                                    <th>Matéria</th>
                                    <th>Data</th>
                                    <th>Horário</th>
                                    <th>Origem</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {atividadesOrdenadas.map(
                                    (atividade) => (
                                        <tr
                                            key={
                                                atividade.id
                                            }
                                            className={
                                                atividade.done
                                                    ? 'atividade-concluida'
                                                    : ''
                                            }
                                        >
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`cronograma-status ${
                                                        atividade.done
                                                            ? 'concluido'
                                                            : 'pendente'
                                                    }`}
                                                    onClick={() =>
                                                        alternarConclusao(
                                                            atividade
                                                        )
                                                    }
                                                    title={
                                                        atividade.done
                                                            ? 'Marcar como pendente'
                                                            : 'Marcar como concluída'
                                                    }
                                                >
                                                    {atividade.done
                                                        ? '✓'
                                                        : '○'}
                                                </button>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        atividade.nome
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="cronograma-materia">
                                                    {
                                                        atividade.materia
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    formatarData(
                                                        atividade.data
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    atividade.horario
                                                }
                                            </td>

                                            <td>
                                                {atividade.origem ===
                                                'plano-automatico' ? (
                                                    <span className="cronograma-badge automatico">
                                                        Plano automático
                                                    </span>
                                                ) : (
                                                    <span className="cronograma-badge manual">
                                                        Manual
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="cronograma-acoes">
                                                    <button
                                                        type="button"
                                                        className="cronograma-acao editar"
                                                        onClick={() =>
                                                            iniciarEdicao(
                                                                atividade
                                                            )
                                                        }
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="cronograma-acao excluir"
                                                        onClick={() =>
                                                            pedirExclusao(
                                                                atividade
                                                            )
                                                        }
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {modalExclusao && (
                <div
                    className="cronograma-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharModalExclusao();
                        }
                    }}
                >
                    <div className="cronograma-modal">
                        <div className="cronograma-modal-icon">
                            !
                        </div>

                        <h2>
                            Excluir atividade?
                        </h2>

                        <p>
                            A atividade{' '}
                            <strong>
                                "{modalExclusao.nome}"
                            </strong>{' '}
                            será removida do cronograma.
                        </p>

                        <div className="cronograma-modal-actions">
                            <button
                                type="button"
                                className="cronograma-btn secundario"
                                onClick={
                                    fecharModalExclusao
                                }
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="cronograma-btn confirmar-exclusao"
                                onClick={
                                    excluirAtividade
                                }
                            >
                                Sim, excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}